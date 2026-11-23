-- B23 pilot: opt-in snapshots, scoped to an assigned step. Do not apply to production
-- without reviewing consent, retention, migration order and RLS integration tests.
begin;

-- Fail closed until a database administrator has run integration tests and
-- explicitly enabled this isolated feature. No client role can change the flag.
create table public.half_life_classroom_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false
);
insert into public.half_life_classroom_settings(singleton, enabled) values (true, false);
alter table public.half_life_classroom_settings enable row level security;
revoke all on public.half_life_classroom_settings from public, anon, authenticated;

create table public.half_life_classroom_progress (
  step_id uuid not null references public.lesson_pathway_steps(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) <= 262144),
  consent_version text not null check (consent_version = 'half-life-classroom/1'),
  consent_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  primary key (step_id, student_id)
);
alter table public.half_life_classroom_progress enable row level security;

-- A helper uses the authenticated user only, never an externally supplied student ID.
-- It mirrors the prior phase/required step gates in complete_pathway_step.
create function public.can_access_half_life_step(p_step_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.lesson_pathway_steps s
    join public.lessons l on l.id = s.lesson_id
    join public.classes c on c.id = l.class_id
    join public.class_members cm on cm.class_id = l.class_id and cm.student_id = auth.uid()
    join public.profiles p on p.id = auth.uid() and p.role = 'student'
    left join public.material_bank m on m.id = s.material_id
    where (select enabled from public.half_life_classroom_settings where singleton = true) = true
      and s.id = p_step_id and s.is_published and s.step_type = 'simulation'
      and l.status = 'published' and l.deleted_at is null and c.deleted_at is null
      and ((s.material_id is null and s.config->>'canonical_material_id' = 'system-sim-half-life')
           or (s.material_id is not null and m.is_published and m.content_url = 'activity:radioactive_decay_half_life'))
      and (s.phase = 'before_class'
        or (s.phase = 'in_class' and exists (select 1 from public.student_phase_progress pp where pp.lesson_id = l.id and pp.student_id = auth.uid() and pp.phase = 'before_class' and pp.is_completed))
        or (s.phase = 'after_class' and exists (select 1 from public.student_phase_progress pp where pp.lesson_id = l.id and pp.student_id = auth.uid() and pp.phase = 'in_class' and pp.is_completed)))
      and not exists (
        select 1 from public.lesson_pathway_steps prev
        left join public.student_step_progress progress on progress.step_id = prev.id and progress.student_id = auth.uid()
        where prev.lesson_id = s.lesson_id and prev.phase = s.phase and prev.is_required and prev.is_published
          and prev.step_order < s.step_order and coalesce(progress.is_completed, false) = false
      )
  );
$$;
revoke all on function public.can_access_half_life_step(uuid) from public;
grant execute on function public.can_access_half_life_step(uuid) to authenticated;

create policy half_life_student_read on public.half_life_classroom_progress for select to authenticated
using (student_id = auth.uid() and public.can_access_half_life_step(step_id));
create policy half_life_teacher_read on public.half_life_classroom_progress for select to authenticated
using (public.is_teacher() and exists (
  select 1 from public.lesson_pathway_steps s join public.lessons l on l.id = s.lesson_id
  where s.id = half_life_classroom_progress.step_id and l.teacher_id = auth.uid()
));
-- No direct writes. The authenticated RPC below verifies consent and assignment on every write.
revoke insert, update, delete on public.half_life_classroom_progress from anon, authenticated;
grant select on public.half_life_classroom_progress to authenticated;

-- Reject free-form content even when the authenticated PostgREST RPC is called
-- directly. The app additionally replays answers and checks numerical samples.
-- Whitelisting does not prove that a person actually performed an interaction.
create function public.valid_half_life_payload(p_value jsonb)
returns boolean language sql immutable set search_path = public as $$
  with recursive nodes(key, value, depth) as (
    select null::text, p_value, 0
    union all
    select child.key, child.value, parent.depth + 1
    from nodes parent
    cross join lateral (
      select entry.key, entry.value from jsonb_each(case when jsonb_typeof(parent.value) = 'object' then parent.value else '{}'::jsonb end) entry
      union all
      select null::text, item.value from jsonb_array_elements(case when jsonb_typeof(parent.value) = 'array' then parent.value else '[]'::jsonb end) item
    ) child
    where parent.depth < 9
  )
  select not exists (
    select 1 from nodes n where
      (n.key is not null and n.key not in ('version','inquiry','parameters','time','measurements','events','taskIndex','questionIndex','actions','attempts','hintsUsed','feedback','questionId','answerId','correct','observe','predict','measure','compare','repeat','initialCount','halfLifeSeconds','seed','remaining','expected','n','halfLife','schema','sessionId','at','type','data','running','taskCompleted','task','question','answer','level','seconds','automaticHints'))
      or (n.depth = 9 and jsonb_typeof(n.value) in ('object','array'))
      or (case when jsonb_typeof(n.value) = 'array' then jsonb_array_length(n.value) > 2000 else false end)
      or (case when jsonb_typeof(n.value) = 'number' then n.value::text::numeric < 0 or n.value::text::numeric > 1000000 else false end)
      or (jsonb_typeof(n.value) = 'string' and not (
        n.value #>> '{}' in ('','half-life-event/1','rotate','accessible_observation','observe_2t','change_half_life','repeat','measure',
          'observe','predict','compare','individual','rotation','two_periods','reference','expectation','difference','control','larger_t','repeat_reason','apply',
          'yes','no','view','decay','100','50','25','12.5','initial','remaining','expected','exact','random','invalid','fixed','none','more','less','variability','force','possible','impossible',
          'session_started','parameter_changed','simulation_started','simulation_reset','measurement','camera_rotated','prediction_or_answer','hint_requested','task_completed','active_seconds')
        or (n.key = 'sessionId' and n.value #>> '{}' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        or (n.key = 'at' and n.value #>> '{}' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z$')
      ))
      or jsonb_typeof(n.value) = 'null'
  );
$$;
revoke all on function public.valid_half_life_payload(jsonb) from public;

create function public.save_half_life_classroom(p_step_id uuid, p_consent boolean, p_snapshot jsonb, p_submit boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if auth.uid() is null or p_consent is distinct from true or not public.can_access_half_life_step(p_step_id) then
    return jsonb_build_object('ok', false, 'error', 'Không có quyền hoặc chưa đồng ý lưu dữ liệu.');
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' or octet_length(p_snapshot::text) > 262144
     or not public.valid_half_life_payload(p_snapshot)
     or p_snapshot->>'version' is distinct from '1' or jsonb_typeof(p_snapshot->'inquiry') is distinct from 'object'
     or jsonb_typeof(p_snapshot->'parameters') is distinct from 'object' or jsonb_typeof(p_snapshot->'measurements') is distinct from 'array'
     or jsonb_typeof(p_snapshot->'events') is distinct from 'array'
     or jsonb_typeof(p_snapshot->'time') is distinct from 'number'
     or p_snapshot->'inquiry'->>'version' is distinct from '1'
     or jsonb_typeof(p_snapshot->'inquiry'->'taskIndex') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'inquiry'->'questionIndex') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'inquiry'->'actions') is distinct from 'array'
     or jsonb_typeof(p_snapshot->'inquiry'->'attempts') is distinct from 'array'
     or jsonb_typeof(p_snapshot->'inquiry'->'hintsUsed') is distinct from 'object'
     or p_snapshot->'inquiry'->>'feedback' is distinct from ''
     or jsonb_typeof(p_snapshot->'parameters'->'initialCount') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'parameters'->'halfLifeSeconds') is distinct from 'number'
     or jsonb_typeof(p_snapshot->'parameters'->'seed') is distinct from 'number' then
    return jsonb_build_object('ok', false, 'error', 'Dữ liệu lưu không hợp lệ.');
  end if;
  if jsonb_array_length(p_snapshot->'measurements') > 30 or jsonb_array_length(p_snapshot->'inquiry'->'attempts') > 500 then
    return jsonb_build_object('ok', false, 'error', 'Dữ liệu lưu vượt giới hạn.');
  end if;
  if p_submit is null or (p_submit and p_snapshot->'inquiry'->>'taskIndex' is distinct from '5') then
    return jsonb_build_object('ok', false, 'error', 'Chưa hoàn thành năm nhiệm vụ.');
  end if;
  insert into public.half_life_classroom_progress(step_id, student_id, snapshot, consent_version, consent_at, updated_at, submitted_at)
  values (p_step_id, auth.uid(), p_snapshot, 'half-life-classroom/1', now(), now(), case when p_submit then now() end)
  on conflict (step_id, student_id) do update set snapshot = excluded.snapshot, updated_at = now(),
    submitted_at = case when p_submit then now() else null end
  where half_life_classroom_progress.submitted_at is null;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    -- A lost response may cause an identical submission to be retried. Report
    -- the already-committed result without modifying it or its timestamps.
    if p_submit and exists (
      select 1 from public.half_life_classroom_progress
      where step_id = p_step_id and student_id = auth.uid()
        and submitted_at is not null and snapshot = p_snapshot
    ) then
      return jsonb_build_object('ok', true, 'submitted', true, 'replayed', true);
    end if;
    return jsonb_build_object('ok', false, 'error', 'Kết quả đã nộp và không thể ghi đè.');
  end if;
  return jsonb_build_object('ok', true, 'submitted', p_submit);
end;
$$;
revoke all on function public.save_half_life_classroom(uuid, boolean, jsonb, boolean) from public;
grant execute on function public.save_half_life_classroom(uuid, boolean, jsonb, boolean) to authenticated;
commit;
