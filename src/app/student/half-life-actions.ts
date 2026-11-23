"use server";

import { createClient } from "@/lib/supabase/server";
import { INQUIRY_TASKS } from "@/lib/half-life-inquiry";
import { halfLifeStorageSnapshot, validateHalfLifeSnapshot, type HalfLifeSnapshot } from "@/lib/half-life-classroom";

const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
type Failure = { ok: false; error: string; uncertain?: boolean };
type Loaded = { ok: true; snapshot: HalfLifeSnapshot | null; submitted: boolean } | Failure;
type Saved = { ok: true; submitted: boolean } | Failure;

export async function loadHalfLifeClassroomAction(input: { stepId: string; consent: true }): Promise<Loaded> {
  if (!uuid(input?.stepId) || input.consent !== true) return { ok: false, error: "Cần đồng ý và chọn bước học hợp lệ." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Em cần đăng nhập." };
  const access = await supabase.rpc("can_access_half_life_step", { p_step_id: input.stepId });
  if (access.error || access.data !== true) return { ok: false, error: "Không thể mở bước này; hãy kiểm tra quyền truy cập hoặc báo giáo viên." };
  const { data, error } = await supabase.from("half_life_classroom_progress").select("snapshot, submitted_at").eq("step_id", input.stepId).eq("student_id", user.id).maybeSingle();
  if (error) return { ok: false, error: "Không tải được bản lưu lớp học; dữ liệu trên thiết bị vẫn còn." };
  if (!data) return { ok: true, snapshot: null, submitted: false };
  const snapshot = validateHalfLifeSnapshot(data.snapshot);
  if (!snapshot) return { ok: false, error: "Bản lưu lớp học không hợp lệ; dữ liệu trên thiết bị vẫn còn." };
  return { ok: true, snapshot, submitted: Boolean(data.submitted_at) };
}

export async function saveHalfLifeClassroomAction(input: { stepId: string; consent: true; snapshot: HalfLifeSnapshot; submit: boolean }): Promise<Saved> {
  if (!uuid(input?.stepId) || input.consent !== true || typeof input.submit !== "boolean") return { ok: false, error: "Cần đồng ý và chọn bước học hợp lệ." };
  const snapshot = validateHalfLifeSnapshot(input.snapshot);
  if (!snapshot) return { ok: false, error: "Dữ liệu thí nghiệm không hợp lệ; hãy kiểm tra và thử lưu lại." };
  if (input.submit && snapshot.inquiry.taskIndex !== INQUIRY_TASKS.length) return { ok: false, error: "Em cần hoàn thành năm nhiệm vụ trước khi nộp." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Em cần đăng nhập." };
  const { data, error } = await supabase.rpc("save_half_life_classroom", { p_step_id: input.stepId, p_consent: true, p_snapshot: halfLifeStorageSnapshot(snapshot), p_submit: input.submit });
  if (error || !data) return { ok: false, uncertain: true, error: "Chưa nhận được xác nhận từ máy chủ. Bản hiện tại vẫn được giữ; hãy thử lại." };
  if (data.ok !== true) return { ok: false, error: typeof data.error === "string" ? data.error : "Chưa lưu được bản lớp học; dữ liệu trên thiết bị vẫn còn." };
  return { ok: true, submitted: data.submitted === true };
}
