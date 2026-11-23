/**
 * Engine cho game show hai đội: ĐẤU TRƯỜNG VẬT LÍ HẠT NHÂN
 *
 * Nguyên tắc thiết kế:
 * 1. TUYỆT ĐỐI tách biệt ba vai trò: selectingTeam (chọn câu), answeringTeam
 *    (trả lời chính), stealingTeam (cướp điểm). Không dùng một biến chung.
 * 2. Không có setTimeout rải rác trong engine. Mọi chuyển trạng thái là hàm
 *    thuần (state + action → state). Đồng hồ đếm ngược thuộc về UI và chỉ gọi
 *    timeoutPrimary() / timeoutSteal() khi hết giờ.
 * 3. Điểm số KHÔNG lưu thành hai biến cộng dồn. Bảng điểm luôn tính lại từ
 *    `history` (xem getScores) nên không thể cộng hai lần.
 * 4. Mọi bước chuyển phase đều có phase-guard: gọi sai thứ tự là no-op.
 */

export type TeamId = "A" | "B";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionId = string;

export interface QuestionData {
  id: QuestionId;
  topic: string; // "B21 · Cấu trúc hạt nhân", ...
  difficulty: Difficulty;
  question: string;
  options: string[];
  answer: number; // index đáp án đúng
  explanation: string;
}

export type GamePhase =
  | "SETUP"
  | "SELECT_QUESTION"
  | "PRIMARY_ANSWER"
  | "STEAL_OPPORTUNITY"
  | "REVEAL_RESULT"
  | "ROUND_COMPLETE"
  | "TIEBREAKER"
  | "MATCH_COMPLETE";

export type SelectMode = "self" | "challenge";

export interface ArenaConfig {
  teamAName: string;
  teamBName: string;
  totalRounds: number;
  answerTimeoutSeconds: number;
  enableChallenge: boolean;
  enableSteal: boolean;
  pointsEasy: number;
  pointsMedium: number;
  pointsHard: number;
  stealMultiplier: number; // 0.6 = 60%
}

export interface TurnRecord {
  roundNumber: number;
  isTiebreaker: boolean;
  selectingTeam: TeamId;
  selectMode: SelectMode;
  answeringTeam: TeamId;
  questionId: QuestionId;
  primaryCorrect: boolean;
  primaryTimedOut: boolean;
  stealAttempted: boolean;
  stealCorrect: boolean | null;
  stealTimedOut: boolean;
  pointsAwarded: number;
  awardedTo: TeamId | null;
}

export interface TeacherLogEntry {
  roundNumber: number;
  from: TeamId;
  to: TeamId;
  reason: string;
}

export interface ArenaGameState {
  phase: GamePhase;
  config: ArenaConfig;
  usedQuestions: Set<QuestionId>;
  currentRound: number;
  isTiebreaker: boolean;
  tiebreakerRoundNumber: number;
  selectingTeam: TeamId;
  selectMode: SelectMode | null;
  answeringTeam: TeamId | null;
  stealingTeam: TeamId | null;
  currentQuestion: QuestionData | null;
  primaryCorrect: boolean | null;
  primaryTimedOut: boolean;
  primaryAnswer: number | null;
  stealCorrect: boolean | null;
  stealTimedOut: boolean;
  stealAnswer: number | null;
  history: TurnRecord[];
  teacherLog: TeacherLogEntry[];
}

function opponentOf(team: TeamId): TeamId {
  return team === "A" ? "B" : "A";
}

function selectingTeamForRound(round: number): TeamId {
  return round % 2 === 1 ? "A" : "B";
}

export function createArenaGame(config: ArenaConfig): ArenaGameState {
  return {
    phase: "SETUP",
    config,
    usedQuestions: new Set(),
    currentRound: 0,
    isTiebreaker: false,
    tiebreakerRoundNumber: 0,
    selectingTeam: "A",
    selectMode: null,
    answeringTeam: null,
    stealingTeam: null,
    currentQuestion: null,
    primaryCorrect: null,
    primaryTimedOut: false,
    primaryAnswer: null,
    stealCorrect: null,
    stealTimedOut: false,
    stealAnswer: null,
    history: [],
    teacherLog: [],
  };
}

export function startMatch(state: ArenaGameState): ArenaGameState {
  if (state.phase !== "SETUP") return state;
  return {
    ...state,
    phase: "SELECT_QUESTION",
    currentRound: 1,
    isTiebreaker: false,
    selectingTeam: selectingTeamForRound(1),
    selectMode: null,
    answeringTeam: null,
    stealingTeam: null,
    currentQuestion: null,
  };
}

/**
 * Đội chọn quyết định chế độ TRƯỚC khi lộ câu hỏi.
 * - self: chọn cho mình → answeringTeam = selectingTeam
 * - challenge: gán cho đối thủ → answeringTeam = đối thủ
 */
export function chooseQuestion(
  state: ArenaGameState,
  mode: SelectMode,
  question: QuestionData,
): ArenaGameState {
  if (state.phase !== "SELECT_QUESTION") return state;
  if (state.usedQuestions.has(question.id)) return state;
  if (mode === "challenge" && !state.config.enableChallenge) return state;
  const answering = mode === "self" ? state.selectingTeam : opponentOf(state.selectingTeam);
  const stealing = opponentOf(answering);
  return {
    ...state,
    phase: "PRIMARY_ANSWER",
    selectMode: mode,
    answeringTeam: answering,
    stealingTeam: stealing,
    currentQuestion: question,
    usedQuestions: new Set([...state.usedQuestions, question.id]),
    primaryCorrect: null,
    primaryTimedOut: false,
    primaryAnswer: null,
    stealCorrect: null,
    stealTimedOut: false,
    stealAnswer: null,
  };
}

function pointsFor(state: ArenaGameState, difficulty: Difficulty): number {
  switch (difficulty) {
    case "easy":
      return state.config.pointsEasy;
    case "medium":
      return state.config.pointsMedium;
    case "hard":
      return state.config.pointsHard;
  }
}

/** Ghi nhận kết quả câu hỏi vào history rồi chuyển sang REVEAL_RESULT. */
function finishTurn(
  state: ArenaGameState,
  primaryCorrect: boolean,
  primaryTimedOut: boolean,
  stealAttempted: boolean,
  stealCorrect: boolean | null,
  stealTimedOut: boolean,
  pointsAwarded: number,
  awardedTo: TeamId | null,
): ArenaGameState {
  const record: TurnRecord = {
    roundNumber: state.currentRound,
    isTiebreaker: state.isTiebreaker,
    selectingTeam: state.selectingTeam,
    selectMode: state.selectMode ?? "self",
    answeringTeam: state.answeringTeam ?? state.selectingTeam,
    questionId: state.currentQuestion?.id ?? "",
    primaryCorrect,
    primaryTimedOut,
    stealAttempted,
    stealCorrect,
    stealTimedOut,
    pointsAwarded,
    awardedTo,
  };
  return {
    ...state,
    phase: "REVEAL_RESULT",
    history: [...state.history, record],
  };
}

export function submitPrimaryAnswer(state: ArenaGameState, answerIndex: number): ArenaGameState {
  if (state.phase !== "PRIMARY_ANSWER" || !state.currentQuestion || state.answeringTeam === null) {
    return state;
  }
  const correct = answerIndex === state.currentQuestion.answer;
  if (correct) {
    const points = pointsFor(state, state.currentQuestion.difficulty);
    return {
      ...finishTurn(state, true, false, false, null, false, points, state.answeringTeam),
      primaryAnswer: answerIndex,
      primaryCorrect: true,
      primaryTimedOut: false,
    };
  }
  if (state.config.enableSteal) {
    return {
      ...state,
      phase: "STEAL_OPPORTUNITY",
      primaryAnswer: answerIndex,
      primaryCorrect: false,
      primaryTimedOut: false,
    };
  }
  return {
    ...finishTurn(state, false, false, false, null, false, 0, null),
    primaryAnswer: answerIndex,
    primaryCorrect: false,
    primaryTimedOut: false,
  };
}

/** Hết giờ trả lời chính → coi như trả lời sai. */
export function timeoutPrimary(state: ArenaGameState): ArenaGameState {
  if (state.phase !== "PRIMARY_ANSWER" || !state.currentQuestion || state.answeringTeam === null) {
    return state;
  }
  if (state.config.enableSteal) {
    return {
      ...state,
      phase: "STEAL_OPPORTUNITY",
      primaryAnswer: null,
      primaryCorrect: false,
      primaryTimedOut: true,
    };
  }
  return {
    ...finishTurn(state, false, true, false, null, false, 0, null),
    primaryAnswer: null,
    primaryCorrect: false,
    primaryTimedOut: true,
  };
}

export function submitStealAnswer(state: ArenaGameState, answerIndex: number): ArenaGameState {
  if (state.phase !== "STEAL_OPPORTUNITY" || !state.currentQuestion || state.stealingTeam === null) {
    return state;
  }
  const correct = answerIndex === state.currentQuestion.answer;
  const points = correct
    ? Math.round(pointsFor(state, state.currentQuestion.difficulty) * state.config.stealMultiplier)
    : 0;
  return {
    ...finishTurn(state, false, state.primaryTimedOut, true, correct, false, points, correct ? state.stealingTeam : null),
    stealAnswer: answerIndex,
    stealCorrect: correct,
    stealTimedOut: false,
  };
}

/** Hết giờ cướp → không có điểm. */
export function timeoutSteal(state: ArenaGameState): ArenaGameState {
  if (state.phase !== "STEAL_OPPORTUNITY" || !state.currentQuestion || state.stealingTeam === null) {
    return state;
  }
  return {
    ...finishTurn(state, false, state.primaryTimedOut, true, false, true, 0, null),
    stealAnswer: null,
    stealCorrect: false,
    stealTimedOut: true,
  };
}

/** Bỏ quyền cướp (chủ động) → không có điểm. */
export function skipSteal(state: ArenaGameState): ArenaGameState {
  if (state.phase !== "STEAL_OPPORTUNITY" || !state.currentQuestion) return state;
  return finishTurn(state, false, state.primaryTimedOut, true, null, false, 0, null);
}

export function advanceToNext(state: ArenaGameState): ArenaGameState {
  if (state.phase !== "REVEAL_RESULT") return state;

  if (state.isTiebreaker) {
    const { A, B } = getScores(state);
    if (A !== B) {
      return { ...state, phase: "MATCH_COMPLETE" };
    }
    return { ...state, phase: "TIEBREAKER" };
  }

  if (state.currentRound >= state.config.totalRounds) {
    const { A, B } = getScores(state);
    if (A === B) return { ...state, phase: "TIEBREAKER" };
    return { ...state, phase: "MATCH_COMPLETE" };
  }

  const nextRound = state.currentRound + 1;
  return {
    ...state,
    phase: "SELECT_QUESTION",
    currentRound: nextRound,
    selectingTeam: selectingTeamForRound(nextRound),
    selectMode: null,
    answeringTeam: null,
    stealingTeam: null,
    currentQuestion: null,
    primaryCorrect: null,
    primaryTimedOut: false,
    primaryAnswer: null,
    stealCorrect: null,
    stealTimedOut: false,
    stealAnswer: null,
  };
}

/**
 * Bắt đầu vòng phụ. Mỗi đội luân phiên chọn câu, mỗi lần một câu.
 * Vòng phụ kết thúc ngay khi có đội dẫn điểm.
 */
export function startTiebreaker(state: ArenaGameState): ArenaGameState {
  if (state.phase !== "TIEBREAKER") return state;
  const tbRound = state.tiebreakerRoundNumber + 1;
  return {
    ...state,
    phase: "SELECT_QUESTION",
    isTiebreaker: true,
    tiebreakerRoundNumber: tbRound,
    currentRound: state.config.totalRounds + tbRound,
    selectingTeam: selectingTeamForRound(tbRound),
    selectMode: null,
    answeringTeam: null,
    stealingTeam: null,
    currentQuestion: null,
    primaryCorrect: null,
    primaryTimedOut: false,
    primaryAnswer: null,
    stealCorrect: null,
    stealTimedOut: false,
    stealAnswer: null,
  };
}

/**
 * Giáo viên đổi lượt chọn thủ công (ví dụ bấm nhầm đội, hoặc muốn cân bằng).
 * Chỉ được phép khi đang chọn câu; mọi lần đổi đều ghi log để kiểm chứng.
 */
export function overrideSelectingTeam(
  state: ArenaGameState,
  team: TeamId,
  reason: string,
): ArenaGameState {
  if (state.phase !== "SELECT_QUESTION" || state.selectingTeam === team) return state;
  return {
    ...state,
    selectingTeam: team,
    teacherLog: [
      ...state.teacherLog,
      { roundNumber: state.currentRound, from: state.selectingTeam, to: team, reason },
    ],
  };
}

/** Bảng điểm LUÔN suy ra từ history — không có biến cộng dồn riêng. */
export function getScores(state: ArenaGameState): { A: number; B: number } {
  let A = 0;
  let B = 0;
  for (const turn of state.history) {
    if (turn.awardedTo === "A") A += turn.pointsAwarded;
    if (turn.awardedTo === "B") B += turn.pointsAwarded;
  }
  return { A, B };
}

export function getWinner(state: ArenaGameState): TeamId | "tie" | null {
  if (state.phase !== "MATCH_COMPLETE") return null;
  const { A, B } = getScores(state);
  if (A > B) return "A";
  if (B > A) return "B";
  return "tie";
}

export function remainingQuestions(state: ArenaGameState, bank: QuestionData[]): QuestionData[] {
  return bank.filter((q) => !state.usedQuestions.has(q.id));
}
