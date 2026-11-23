// Isolated PostgreSQL/RLS contract test. This uses a minimal schema scaffold,
// NOT Supabase Auth, PostgREST, or the entire production migration history.
// See README.md before running; never point this at an existing database.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

if (!process.env.PGLITE_MODULE) throw new Error('Set PGLITE_MODULE to the absolute path of a separately installed @electric-sql/pglite dist/index.js');
const { PGlite } = await import(pathToFileURL(resolve(process.env.PGLITE_MODULE)).href);
const db = new PGlite();
const student1='00000000-0000-0000-0000-000000000001';
const student2='00000000-0000-0000-0000-000000000002';
const outsider='00000000-0000-0000-0000-000000000003';
const teacher1='00000000-0000-0000-0000-000000000004';
const teacher2='00000000-0000-0000-0000-000000000005';
const class1='10000000-0000-0000-0000-000000000001';
const class2='10000000-0000-0000-0000-000000000002';
const lesson1='20000000-0000-0000-0000-000000000001';
const lesson2='20000000-0000-0000-0000-000000000002';
const step1='30000000-0000-0000-0000-000000000001';
const step2='30000000-0000-0000-0000-000000000002';
const locked='30000000-0000-0000-0000-000000000003';
const later='30000000-0000-0000-0000-000000000004';
const prerequisite='30000000-0000-0000-0000-000000000005';
const unpublished='30000000-0000-0000-0000-000000000006';
const payload={version:1,inquiry:{version:1,taskIndex:0,questionIndex:0,actions:[],attempts:[],hintsUsed:{},feedback:''},parameters:{initialCount:64,halfLifeSeconds:10,seed:23},time:0,measurements:[],events:[]};
const full={...payload,inquiry:{...payload.inquiry,taskIndex:5}};
const checks=[];
function check(name, fn){checks.push({name,fn});}
async function identity(user){await db.exec('RESET ROLE'); await db.query("select set_config('request.jwt.claim.sub', $1, false)",[user]); await db.exec('SET ROLE authenticated');}
async function result(step,data=payload,submit=false,consent=true){return (await db.query('select public.save_half_life_classroom($1,$2,$3::jsonb,$4) result',[step,consent,JSON.stringify(data),submit])).rows[0].result;}
async function rows(){return (await db.query('select student_id, step_id, snapshot, submitted_at, updated_at from public.half_life_classroom_progress order by student_id')).rows;}
try {
  await db.exec(`
  create role anon; create role authenticated;
  create schema auth; grant usage on schema auth to authenticated;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table public.profiles(id uuid primary key, role text not null);
  create table public.classes(id uuid primary key, teacher_id uuid not null, deleted_at timestamptz);
  create table public.class_members(class_id uuid not null, student_id uuid not null);
  create table public.lessons(id uuid primary key, class_id uuid, teacher_id uuid not null, status text not null, deleted_at timestamptz);
  create table public.material_bank(id uuid primary key, is_published boolean, content_url text);
  create table public.lesson_pathway_steps(id uuid primary key, lesson_id uuid not null, phase text not null, material_id uuid, is_published boolean not null, step_type text not null, step_order integer not null, is_required boolean not null, config jsonb not null);
  create table public.student_phase_progress(lesson_id uuid, student_id uuid, phase text, is_completed boolean);
  create table public.student_step_progress(step_id uuid, student_id uuid, is_completed boolean);
  create function public.is_teacher() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='teacher') $$;
  grant usage on schema public to authenticated; grant execute on function public.is_teacher() to authenticated;
  alter table public.lesson_pathway_steps enable row level security;
  alter table public.lessons enable row level security;
  create policy lessons_read on public.lessons for select to authenticated using (teacher_id=auth.uid() or exists(select 1 from public.class_members where class_id=lessons.class_id and student_id=auth.uid()));
  create policy step_read on public.lesson_pathway_steps for select to authenticated using (exists(select 1 from public.lessons where id=lesson_id));
  grant select on public.class_members,public.lessons,public.lesson_pathway_steps to authenticated;
  `);
  const query = 'insert into public.profiles values ($1,$2)';
  for(const [id,role] of [[student1,'student'],[student2,'student'],[outsider,'student'],[teacher1,'teacher'],[teacher2,'teacher']]) await db.query(query,[id,role]);
  await db.query('insert into public.classes values ($1,$2,null),($3,$4,null)',[class1,teacher1,class2,teacher2]);
  await db.query('insert into public.class_members values ($1,$2),($1,$3),($4,$5)',[class1,student1,student2,class2,outsider]);
  await db.query("insert into public.lessons values ($1,$2,$3,'published',null),($4,$5,$6,'published',null)",[lesson1,class1,teacher1,lesson2,class2,teacher2]);
  const insertStep="insert into public.lesson_pathway_steps values ($1,$2,$3,null,true,'simulation',$4,$5,$6::jsonb)";
  for(const [id,lesson,phase,order,required] of [[step1,lesson1,'before_class',0,false],[step2,lesson2,'before_class',0,false],[locked,lesson1,'in_class',0,false],[later,lesson1,'before_class',2,true],[prerequisite,lesson1,'before_class',1,true]]) await db.query(insertStep,[id,lesson,phase,order,required,JSON.stringify({canonical_material_id:'system-sim-half-life'})]);
  await db.query("insert into public.lesson_pathway_steps values ($1,$2,'before_class',null,false,'simulation',0,false,$3::jsonb)",[unpublished,lesson1,JSON.stringify({canonical_material_id:'system-sim-half-life'})]);
  const migration=await readFile(new URL('../../supabase/migrations/20261113_021_half_life_classroom.sql',import.meta.url),'utf8');
  await db.exec(migration);
  await identity(student1);
  assert.equal((await result(step1)).ok,false,'default disabled must reject writes');
  assert.equal((await rows()).length,0,'default disabled must expose no rows');
  console.log('PASS disabled by default');
  // QA-only transaction: enable temporarily, exercise policies, then ROLLBACK.
  await db.exec('RESET ROLE; BEGIN; UPDATE public.half_life_classroom_settings SET enabled=true;');
  check('student1 may save own step',async()=>{await identity(student1); assert.equal((await result(step1)).ok,true); const visible=await rows(); assert.equal(visible.length,1); assert.equal(visible[0].student_id,student1);});
  check('student2 cannot read student1 but may save own',async()=>{await identity(student2); assert.equal((await rows()).length,0); assert.equal((await result(step1)).ok,true); assert.deepEqual((await rows()).map(r=>r.student_id),[student2]);});
  check('outsider cannot access or write to class1',async()=>{await identity(outsider); assert.equal((await rows()).length,0); assert.equal((await result(step1)).ok,false); assert.equal((await result(step2)).ok,true); assert.equal((await rows()).length,1);});
  check('step from another class, phase gate, unpublished or unknown are rejected',async()=>{await identity(student1); assert.equal((await result(step2)).ok,false); assert.equal((await result(locked)).ok,false); assert.equal((await result(later)).ok,false); assert.equal((await result(unpublished)).ok,false); assert.equal((await result('30000000-0000-0000-0000-000000000099')).ok,false);});
  check('no consent, free-form payload and direct impersonating inserts denied',async()=>{await identity(student1); assert.equal((await result(step1,payload,false,false)).ok,false); assert.equal((await result(step1,{...payload,full_name:'person'})).ok,false); for (const key of ['student_id','class_id','lesson_id','step_id']) assert.equal((await result(step1,{...payload,[key]:student2})).ok,false,`unexpected ${key} must be rejected`); await db.exec('SAVEPOINT denied_insert'); await assert.rejects(db.query('insert into public.half_life_classroom_progress(step_id,student_id,snapshot,consent_version) values ($1,$2,$3::jsonb,$4)',[step1,student2,JSON.stringify(payload),'half-life-classroom/1'])); await db.exec('ROLLBACK TO SAVEPOINT denied_insert');});
  check('teacher sees only own class; preview/teacher cannot write',async()=>{await identity(teacher1); assert.deepEqual((await rows()).map(r=>r.student_id),[student1,student2]); assert.equal((await result(step1)).ok,false); await identity(teacher2); assert.deepEqual((await rows()).map(r=>r.student_id),[outsider]);});
  check('repeat identical submission is idempotent; changed payload is rejected',async()=>{await identity(student1); assert.equal((await result(step1,full,true)).ok,true); const first=(await rows())[0]; const again=await result(step1,full,true); assert.equal(again.ok,true); assert.equal(again.replayed,true); const after=(await rows())[0]; assert.deepEqual(after,first); assert.equal((await result(step1,{...full,time:1},true)).ok,false); assert.equal((await result(step1,full,false)).ok,false); assert.equal((await rows()).length,1);});
  for(const {name,fn} of checks){await fn(); console.log('PASS',name);}
  await db.exec('ROLLBACK'); await db.exec('RESET ROLE');
  const enabled=(await db.query('select enabled from public.half_life_classroom_settings')).rows[0].enabled;
  assert.equal(enabled,false); console.log('PASS QA transaction rolled back; write flag remains disabled');
} finally { await db.close(); }
