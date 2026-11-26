import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_PHASE2_ACTIVITY_KEYS } from "@/lib/curriculum";
import { validateTeachingPlan } from "@/lib/teaching-plan";
import {
  CHAPTER4_LESSONS,
  CHAPTER4_PHASES,
  convertLessonDraftToTeachingPlan,
  createDraftFromSample,
  getChapter4Lesson,
  isVerifiedVideoUrl,
  resolveLessonWithDraft,
} from "@/lib/chapter4-lessons";

test("CHAPTER4_LESSONS trình bày đủ 5 bài theo đúng thứ tự SGK B21–B25 và đủ 3 pha", () => {
  assert.deepEqual(
    CHAPTER4_LESSONS.map((l) => l.code),
    ["B21", "B22", "B23", "B24", "B25"]
  );
  assert.deepEqual(
    CHAPTER4_LESSONS.map((l) => l.number),
    [21, 22, 23, 24, 25]
  );

  for (const lesson of CHAPTER4_LESSONS) {
    assert.ok(lesson.title.length > 0);
    assert.ok(lesson.guidingQuestion.length > 0);
    for (const phase of CHAPTER4_PHASES) {
      const inPhase = lesson.sections.filter((s) => s.phase === phase.id);
      assert.ok(
        inPhase.length >= 1,
        `Bài ${lesson.code} phải có ít nhất 1 mục trong pha ${phase.id}`
      );
    }
  }
});

test("Bài 21 có đúng tiêu đề, câu hỏi mở đầu và 4 mục nội dung cốt lõi độc lập", () => {
  const b21 = getChapter4Lesson("B21");
  assert.equal(b21.title, "Cấu trúc hạt nhân");
  assert.equal(
    b21.guidingQuestion,
    "Từ những đốm sáng trên màn, làm sao biết nguyên tử có một hạt nhân rất nhỏ?"
  );

  const ids = b21.sections.map((s) => s.id);
  assert.ok(ids.includes("b21-rutherford-v3"));
  assert.ok(ids.includes("b21-atomic-models"));
  assert.ok(ids.includes("b21-structure-size"));
  assert.ok(ids.includes("b21-symbol-isotopes"));
  assert.ok(
    b21.sections.some((s) => s.title.includes("Kiểm tra, đánh giá")),
    "Bài 21 có mục Kiểm tra, đánh giá ở pha Sau giờ học"
  );
});

test("Toàn bộ 17 mã hoạt động CanonicalActivityKey của Chương IV đều được bảo toàn", () => {
  const referencedKeys = new Set(
    CHAPTER4_LESSONS.flatMap((l) =>
      l.sections
        .map((s) => s.activityKey)
        .filter((k): k is NonNullable<typeof k> => Boolean(k))
    )
  );

  for (const key of CANONICAL_PHASE2_ACTIVITY_KEYS) {
    assert.ok(
      referencedKeys.has(key),
      `Thiếu kết nối mã hoạt động chuẩn: ${key}`
    );
  }
});

test("Bản riêng của giáo viên chuyển đổi thành TeachingPlan hợp lệ cho cả B21–B25", () => {
  for (const lesson of CHAPTER4_LESSONS) {
    const draft = createDraftFromSample(lesson);
    const customized = {
      ...draft,
      customTitle: `${lesson.title} — Lớp 12A1`,
      sections: draft.sections.map((s, idx) =>
        idx === 0
          ? { ...s, title: `${s.title} (Nhiệm vụ ở nhà 12A1)` }
          : s
      ),
    };

    const resolved = resolveLessonWithDraft(lesson, customized, true);
    assert.equal(resolved.isCustom, true);
    assert.equal(resolved.title, `${lesson.title} — Lớp 12A1`);
    assert.ok(resolved.sections[0]?.title.includes("12A1"));

    const plan = convertLessonDraftToTeachingPlan(lesson, customized);
    const checked = validateTeachingPlan(plan);
    assert.equal(
      checked.error,
      undefined,
      `Kế hoạch đồng bộ của ${lesson.code} phải đạt validateTeachingPlan`
    );
    assert.ok(checked.plan);
    assert.equal(checked.plan.activities.length, lesson.sections.length);
  }
});

test("isVerifiedVideoUrl chỉ cho phép hiện nút phát Video Flow khi có tệp hoặc URL thật", () => {
  assert.equal(isVerifiedVideoUrl(undefined), false);
  assert.equal(isVerifiedVideoUrl(""), false);
  assert.equal(isVerifiedVideoUrl("   "), false);
  assert.equal(isVerifiedVideoUrl("chua-co-video"), false);
  assert.equal(isVerifiedVideoUrl("/videos/nuclear-lessons/b21.mp4"), true);
  assert.equal(isVerifiedVideoUrl("https://example.com/flow-b21.mp4"), true);
});

test("SGK_TABLE_21_1 có đủ 8 dòng đúng nguyên tố và đơn vị Bảng 21.1 SGK tr. 94", async () => {
  const { SGK_TABLE_21_1, EMPTY_STUDENT_NOTEBOOK, recordPreClassPrediction } = await import(
    "@/lib/chapter4-lessons"
  );
  assert.equal(SGK_TABLE_21_1.length, 8);
  assert.deepEqual(
    SGK_TABLE_21_1.map((r) => `${r.symbol}-${r.massNumberA}`),
    ["H-1", "He-4", "O-16", "Si-28", "Fe-56", "Cd-114", "Au-197", "U-238"],
  );
  const si = SGK_TABLE_21_1.find((r) => r.symbol === "Si");
  assert.ok(si);
  assert.equal(si.z, 14);
  assert.equal(si.atomicRadius10m10, "2,1");
  assert.equal(si.nuclearRadius10m15, "3,1");

  const firstLock = recordPreClassPrediction(
    EMPTY_STUDENT_NOTEBOOK,
    "straight",
    "Theo Thomson điện tích dương trải đều nên hạt α đi thẳng.",
  );
  assert.equal(firstLock.initialPredictionChoice, "straight");
  assert.equal(
    firstLock.initialPredictionReason,
    "Theo Thomson điện tích dương trải đều nên hạt α đi thẳng.",
  );

  const afterSecondEdit = recordPreClassPrediction(
    firstLock,
    "rare_bounce",
    "Sau khi xem thí nghiệm em muốn đổi sang có tia bật ngược.",
  );
  assert.equal(afterSecondEdit.preClassPredictionChoice, "rare_bounce");
  assert.equal(afterSecondEdit.initialPredictionChoice, "straight");
  assert.equal(
    afterSecondEdit.initialPredictionReason,
    "Theo Thomson điện tích dương trải đều nên hạt α đi thẳng.",
  );
});

