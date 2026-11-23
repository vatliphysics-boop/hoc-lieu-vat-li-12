import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node loads TypeScript directly.
import {
  createArenaGame,
  startMatch,
  chooseQuestion,
  submitPrimaryAnswer,
  submitStealAnswer,
  advanceToNext,
  getWinner,
  getScores,
  skipSteal,
  timeoutPrimary,
  timeoutSteal,
  overrideSelectingTeam,
  startTiebreaker,
  remainingQuestions,
} from "../src/lib/arena-game-engine.ts";

type Difficulty = "easy" | "medium" | "hard";

function makeQ(id: string, difficulty: Difficulty = "easy", answer = 0) {
  return {
    id,
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty,
    question: `Câu ${id}`,
    options: ["A", "B", "C", "D"],
    answer,
    explanation: "Giải thích",
  };
}

const cfg = {
  teamAName: "Đội A",
  teamBName: "Đội B",
  totalRounds: 4,
  answerTimeoutSeconds: 30,
  enableChallenge: true,
  enableSteal: true,
  pointsEasy: 100,
  pointsMedium: 200,
  pointsHard: 300,
  stealMultiplier: 0.6,
};

function playRound(state: ReturnType<typeof createArenaGame>, qid: string, mode: "self" | "challenge" = "self", correct = true) {
  let s = chooseQuestion(state, mode, makeQ(qid));
  s = submitPrimaryAnswer(s, correct ? 0 : 1);
  if (s.phase === "STEAL_OPPORTUNITY") s = skipSteal(s);
  return advanceToNext(s);
}

test("luân phiên lượt chọn: A vòng 1 & 3, B vòng 2 & 4", () => {
  let s = startMatch(createArenaGame(cfg));
  assert.equal(s.selectingTeam, "A");
  assert.equal(s.currentRound, 1);
  s = playRound(s, "q1");
  assert.equal(s.selectingTeam, "B");
  assert.equal(s.currentRound, 2);
  s = playRound(s, "q2");
  assert.equal(s.selectingTeam, "A");
  assert.equal(s.currentRound, 3);
  s = playRound(s, "q3");
  assert.equal(s.selectingTeam, "B");
  assert.equal(s.currentRound, 4);
});

test("ba vai trò tách biệt: self vs challenge", () => {
  let s = startMatch(createArenaGame(cfg));
  const self = chooseQuestion(s, "self", makeQ("q1"));
  assert.equal(self.selectingTeam, "A");
  assert.equal(self.answeringTeam, "A");
  assert.equal(self.stealingTeam, "B");

  const challenge = chooseQuestion(s, "challenge", makeQ("q2"));
  assert.equal(challenge.selectingTeam, "A");
  assert.equal(challenge.answeringTeam, "B");
  assert.equal(challenge.stealingTeam, "A");
});

test("thách đấu ở vòng 2: B chọn, A trả lời", () => {
  let s = startMatch(createArenaGame(cfg));
  s = playRound(s, "q1");
  const c = chooseQuestion(s, "challenge", makeQ("q2"));
  assert.equal(c.selectingTeam, "B");
  assert.equal(c.answeringTeam, "A");
  assert.equal(c.stealingTeam, "B");
});

test("tự giải đúng: +100% điểm theo độ khó", () => {
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "self", makeQ("q1", "hard"));
  s = submitPrimaryAnswer(s, 0);
  assert.equal(getScores(s).A, 300);
  assert.equal(getScores(s).B, 0);
  assert.equal(s.phase, "REVEAL_RESULT");
});

test("tự giải sai → đối thủ cướp đúng: +60%", () => {
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "self", makeQ("q1", "medium"));
  s = submitPrimaryAnswer(s, 1);
  assert.equal(s.phase, "STEAL_OPPORTUNITY");
  assert.equal(s.stealingTeam, "B");
  s = submitStealAnswer(s, 0);
  assert.equal(getScores(s).A, 0);
  assert.equal(getScores(s).B, 120);
});

test("cả hai cùng sai: không ai được điểm", () => {
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "self", makeQ("q1", "easy", 0));
  s = submitPrimaryAnswer(s, 1);
  s = submitStealAnswer(s, 2);
  const { A, B } = getScores(s);
  assert.equal(A, 0);
  assert.equal(B, 0);
});

test("6 kịch bản thắng/thua đầy đủ", () => {
  // 1. self đúng
  let s1 = startMatch(createArenaGame(cfg));
  s1 = chooseQuestion(s1, "self", makeQ("q1", "easy"));
  s1 = submitPrimaryAnswer(s1, 0);
  assert.equal(getScores(s1).A, 100);

  // 2. self sai, cướp đúng
  let s2 = startMatch(createArenaGame(cfg));
  s2 = chooseQuestion(s2, "self", makeQ("q1", "easy"));
  s2 = submitPrimaryAnswer(s2, 1);
  s2 = submitStealAnswer(s2, 0);
  assert.equal(getScores(s2).B, 60);

  // 3. self sai, cướp sai
  let s3 = startMatch(createArenaGame(cfg));
  s3 = chooseQuestion(s3, "self", makeQ("q1", "easy"));
  s3 = submitPrimaryAnswer(s3, 1);
  s3 = submitStealAnswer(s3, 1);
  assert.equal(getScores(s3).A + getScores(s3).B, 0);

  // 4. challenge, đối thủ đúng
  let s4 = startMatch(createArenaGame(cfg));
  s4 = chooseQuestion(s4, "challenge", makeQ("q1", "easy"));
  s4 = submitPrimaryAnswer(s4, 0);
  assert.equal(getScores(s4).B, 100);

  // 5. challenge, đối thủ sai, người chọn cướp đúng
  let s5 = startMatch(createArenaGame(cfg));
  s5 = chooseQuestion(s5, "challenge", makeQ("q1", "hard"));
  s5 = submitPrimaryAnswer(s5, 1);
  s5 = submitStealAnswer(s5, 0);
  assert.equal(getScores(s5).A, 180);

  // 6. challenge, đối thủ sai, người chọn cướp sai
  let s6 = startMatch(createArenaGame(cfg));
  s6 = chooseQuestion(s6, "challenge", makeQ("q1", "easy"));
  s6 = submitPrimaryAnswer(s6, 1);
  s6 = submitStealAnswer(s6, 1);
  assert.equal(getScores(s6).A + getScores(s6).B, 0);
});

test("hết giờ trả lời chính → coi như sai, mở cơ hội cướp", () => {
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "self", makeQ("q1", "medium"));
  s = timeoutPrimary(s);
  assert.equal(s.phase, "STEAL_OPPORTUNITY");
  assert.equal(s.primaryTimedOut, true);
  s = submitStealAnswer(s, 0);
  assert.equal(getScores(s).B, 120);
});

test("hết giờ cướp → không điểm", () => {
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "self", makeQ("q1", "easy"));
  s = timeoutPrimary(s);
  s = timeoutSteal(s);
  assert.equal(s.phase, "REVEAL_RESULT");
  assert.equal(getScores(s).A + getScores(s).B, 0);
  assert.equal(s.history[0].stealTimedOut, true);
});

test("bấm chốt đáp án hai lần không cộng điểm hai lần", () => {
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "self", makeQ("q1", "hard"));
  const once = submitPrimaryAnswer(s, 0);
  const twice = submitPrimaryAnswer(once, 0);
  assert.equal(twice, once); // phase-guard trả nguyên state
  assert.equal(getScores(twice).A, 300);
  assert.equal(twice.history.length, 1);
});

test("bấm cướp hai lần không cộng điểm hai lần", () => {
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "self", makeQ("q1", "medium"));
  s = submitPrimaryAnswer(s, 1);
  const once = submitStealAnswer(s, 0);
  const twice = submitStealAnswer(once, 0);
  assert.equal(getScores(twice).B, 120);
  assert.equal(twice.history.length, 1);
});

test("câu đã dùng không chọn lại được", () => {
  let s = startMatch(createArenaGame(cfg));
  const q = makeQ("q1");
  s = chooseQuestion(s, "self", q);
  s = submitPrimaryAnswer(s, 0);
  s = advanceToNext(s);
  const retry = chooseQuestion(s, "self", q);
  assert.equal(retry, s);
});

test("không dùng lại câu hỏi trong cả trận", () => {
  const bank = [makeQ("q1"), makeQ("q2"), makeQ("q3")];
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "self", bank[0]);
  assert.equal(remainingQuestions(s, bank).length, 2);
  s = submitPrimaryAnswer(s, 0);
  s = advanceToNext(s);
  s = chooseQuestion(s, "self", bank[1]);
  assert.equal(remainingQuestions(s, bank).length, 1);
  assert.deepEqual(
    remainingQuestions(s, bank).map((q) => q.id),
    ["q3"],
  );
});

test("tắt cướp: trả lời sai đi thẳng tới kết quả", () => {
  let s = startMatch(createArenaGame({ ...cfg, enableSteal: false }));
  s = chooseQuestion(s, "self", makeQ("q1"));
  s = submitPrimaryAnswer(s, 1);
  assert.equal(s.phase, "REVEAL_RESULT");
  assert.equal(getScores(s).A + getScores(s).B, 0);
});

test("tắt thách đấu: không chọn được challenge", () => {
  let s = startMatch(createArenaGame({ ...cfg, enableChallenge: false }));
  const retry = chooseQuestion(s, "challenge", makeQ("q1"));
  assert.equal(retry.phase, "SELECT_QUESTION");
});

test("kết thúc trận khi đủ số vòng", () => {
  let s = startMatch(createArenaGame({ ...cfg, totalRounds: 1 }));
  s = chooseQuestion(s, "self", makeQ("q1"));
  s = submitPrimaryAnswer(s, 0);
  s = advanceToNext(s);
  assert.equal(s.phase, "MATCH_COMPLETE");
  assert.equal(getWinner(s), "A");
});

test("hòa điểm cuối trận → vòng phụ, ai dẫn điểm thắng", () => {
  let s = startMatch(createArenaGame({ ...cfg, totalRounds: 1 }));
  s = chooseQuestion(s, "self", makeQ("q1"));
  s = submitPrimaryAnswer(s, 1);
  s = submitStealAnswer(s, 1);
  s = advanceToNext(s);
  assert.equal(s.phase, "TIEBREAKER");

  s = startTiebreaker(s);
  assert.equal(s.phase, "SELECT_QUESTION");
  assert.equal(s.isTiebreaker, true);
  assert.equal(s.tiebreakerRoundNumber, 1);
  assert.equal(s.selectingTeam, "A");

  s = chooseQuestion(s, "self", makeQ("tb1"));
  s = submitPrimaryAnswer(s, 0);
  s = advanceToNext(s);
  assert.equal(s.phase, "MATCH_COMPLETE");
  assert.equal(getWinner(s), "A");
});

test("giáo viên đổi lượt chọn thủ công có ghi log", () => {
  let s = startMatch(createArenaGame(cfg));
  assert.equal(s.selectingTeam, "A");
  s = overrideSelectingTeam(s, "B", "Bấm nhầm đội");
  assert.equal(s.selectingTeam, "B");
  assert.equal(s.teacherLog.length, 1);
  assert.equal(s.teacherLog[0].from, "A");
  assert.equal(s.teacherLog[0].to, "B");
  assert.equal(s.teacherLog[0].reason, "Bấm nhầm đội");

  // Đổi sang cùng đội = no-op
  const same = overrideSelectingTeam(s, "B", "lặp");
  assert.equal(same, s);

  // Không được đổi khi đang trả lời
  const answering = chooseQuestion(s, "self", makeQ("q1"));
  const blocked = overrideSelectingTeam(answering, "A", "muộn");
  assert.equal(blocked, answering);
});

test("bảng điểm suy ra từ history, không cộng dồn riêng", () => {
  let s = startMatch(createArenaGame(cfg));
  for (let i = 0; i < 4; i += 1) {
    s = playRound(s, `q${i}`, "self", true);
  }
  const { A, B } = getScores(s);
  const manual = s.history
    .filter((h) => h.awardedTo === "A")
    .reduce((sum, h) => sum + h.pointsAwarded, 0);
  assert.equal(A, manual);
  assert.equal(s.history.length, 4);
  assert.equal(A + B, 400);
});

test("history ghi đúng kịch bản cướp", () => {
  let s = startMatch(createArenaGame(cfg));
  s = chooseQuestion(s, "challenge", makeQ("q1", "medium"));
  s = submitPrimaryAnswer(s, 1);
  s = submitStealAnswer(s, 0);
  const rec = s.history[0];
  assert.equal(rec.selectMode, "challenge");
  assert.equal(rec.selectingTeam, "A");
  assert.equal(rec.answeringTeam, "B");
  assert.equal(rec.primaryCorrect, false);
  assert.equal(rec.stealAttempted, true);
  assert.equal(rec.stealCorrect, true);
  assert.equal(rec.awardedTo, "A");
  assert.equal(rec.pointsAwarded, 120);
});

test("khôi phục sau khi tải lại trang: state là dữ liệu thuần", () => {
  let s = startMatch(createArenaGame(cfg));
  s = playRound(s, "q1");
  // Serialize bỏ Set (JSON) — chỉ dùng để mô phỏng
  const plain = {
    ...s,
    usedQuestions: [...s.usedQuestions],
  };
  const roundTrip = JSON.parse(JSON.stringify(plain));
  assert.equal(roundTrip.currentRound, s.currentRound);
  assert.equal(roundTrip.selectingTeam, "B");
  assert.deepEqual(roundTrip.usedQuestions, ["q1"]);
  assert.equal(roundTrip.history.length, 1);
});
