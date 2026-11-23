"use client";

/**
 * ĐẤU TRƯỜNG VẬT LÍ HẠT NHÂN — Game show UI
 *
 * Pure component wrapper around arena-game-engine.ts.
 * Manages local state (game engine state), renders according to phase.
 * Teacher controls: setup, pause/resume, confirm answer, next round, end match.
 * Distinctive game-show design, not worksheet layout.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArenaGameState,
  ArenaConfig,
  QuestionData,
  createArenaGame,
  startMatch,
  chooseQuestion,
  submitPrimaryAnswer,
  submitStealAnswer,
  advanceToNext,
  skipSteal,
  getWinner,
  getScores,
} from "@/lib/arena-game-engine";
import { ARENA_QUESTIONS, getQuestionsByDifficulty, getQuestionsByTopic, getAllTopics } from "@/lib/arena-question-bank";
import styles from "./ArenaGameShow.module.css";

type SetupMode = "teams" | "mode" | "ready";
type TeacherMode = "normal" | "paused";

interface GameSession {
  state: ArenaGameState;
  teacherMode: TeacherMode;
  setupPhase: SetupMode;
  teamAName: string;
  teamBName: string;
  selectedMode: "self" | "challenge" | null;
  timerSeconds: number;
}

export function ArenaGameShow() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showRules, setShowRules] = useState(false);

  // Initialize game
  const initGame = useCallback(() => {
    const config: ArenaConfig = {
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
    const initialState = createArenaGame(config);
    setSession({
      state: initialState,
      teacherMode: "normal",
      setupPhase: "teams",
      teamAName: config.teamAName,
      teamBName: config.teamBName,
      selectedMode: null,
      timerSeconds: config.answerTimeoutSeconds,
    });
  }, []);

  useEffect(() => {
    if (!session) initGame();
  }, [session, initGame]);

  if (!session) return null;

  const { state, setupPhase, teamAName, teamBName, selectedMode } = session;

  // Setup flow
  if (state.phase === "SETUP") {
    return (
      <div className={styles.arena}>
        <div className={styles.setupScreen}>
          <h2>⚛️ ĐẤU TRƯỜNG VẬT LÍ HẠT NHÂN</h2>

          {setupPhase === "teams" && (
            <>
              <p>Nhập tên đội:</p>
              <div className={styles.formField}>
                <label>Đội A</label>
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setSession({ ...session, teamAName: e.target.value })}
                  placeholder="Tên đội A"
                />
              </div>
              <div className={styles.formField}>
                <label>Đội B</label>
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setSession({ ...session, teamBName: e.target.value })}
                  placeholder="Tên đội B"
                />
              </div>
              <button
                className={styles.btn}
                data-variant="primary"
                onClick={() => {
                  const newConfig: ArenaConfig = {
                    ...state.config,
                    teamAName,
                    teamBName,
                  };
                  setSession({
                    ...session,
                    state: createArenaGame(newConfig),
                    setupPhase: "mode",
                  });
                }}
              >
                Tiếp tục
              </button>
            </>
          )}

          {setupPhase === "mode" && (
            <>
              <p>Chế độ chơi:</p>
              <div className={styles.modeSelector}>
                <div
                  className={styles.modeCard}
                  data-selected={selectedMode === "self"}
                  onClick={() => setSession({ ...session, selectedMode: "self" })}
                >
                  <h3>🎯 Tự Giải</h3>
                  <p>Đội chọn câu hỏi và tự trả lời</p>
                </div>
                <div
                  className={styles.modeCard}
                  data-selected={selectedMode === "challenge"}
                  onClick={() => setSession({ ...session, selectedMode: "challenge" })}
                >
                  <h3>⚔️ Thách Đấu</h3>
                  <p>Đội chọn câu cho đối thủ trả lời</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className={styles.btn} onClick={() => setSession({ ...session, setupPhase: "teams" })}>
                  Quay lại
                </button>
                <button
                  className={styles.btn}
                  data-variant="primary"
                  disabled={!selectedMode}
                  onClick={() => setSession({ ...session, setupPhase: "ready" })}
                >
                  Tiếp tục
                </button>
              </div>
            </>
          )}

          {setupPhase === "ready" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <p>
                  <strong>Đội A:</strong> {teamAName}
                </p>
                <p>
                  <strong>Đội B:</strong> {teamBName}
                </p>
                <p>
                  <strong>Chế độ:</strong> {selectedMode === "self" ? "Tự Giải" : "Thách Đấu"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className={styles.btn} onClick={() => setSession({ ...session, setupPhase: "mode" })}>
                  Quay lại
                </button>
                <button
                  className={styles.btn}
                  data-variant="primary"
                  onClick={() => {
                    const newState = startMatch(state);
                    setSession({ ...session, state: newState, setupPhase: "ready" });
                  }}
                >
                  Bắt đầu trò chơi
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main game UI
  const scores = getScores(state);
  return (
    <div className={styles.arena}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        <div className={styles.teamScore} data-id="A" data-active={state.selectingTeam === "A" && state.phase !== "MATCH_COMPLETE"}>
          <span className={styles.teamName}>{teamAName}</span>
          <span className={styles.teamPoints}>{scores.A}</span>
        </div>

        <div className={styles.matchStatus}>
          <div className={styles.roundLabel}>Vòng {state.currentRound}</div>
          <h2 className={styles.phaseLabel}>{getPhaseLabel(state.phase)}</h2>
          {state.phase === "SELECT_QUESTION" && (
            <div className={styles.roleIndicator}>
              <strong>{state.selectingTeam === "A" ? teamAName : teamBName}</strong> đang chọn câu
            </div>
          )}
          {state.phase === "PRIMARY_ANSWER" && (
            <div className={styles.roleIndicator}>
              <strong>{state.answeringTeam === "A" ? teamAName : teamBName}</strong> đang trả lời
            </div>
          )}
          {state.phase === "STEAL_OPPORTUNITY" && (
            <div className={styles.roleIndicator} style={{ color: "var(--arena-steal)" }}>
              <strong>{state.stealingTeam === "A" ? teamAName : teamBName}</strong> đang cướp
            </div>
          )}
        </div>

        <div className={styles.teamScore} data-id="B" data-active={state.selectingTeam === "B" && state.phase !== "MATCH_COMPLETE"}>
          <span className={styles.teamName}>{teamBName}</span>
          <span className={styles.teamPoints}>{scores.B}</span>
        </div>
      </div>

      {/* Phase: SELECT_QUESTION */}
      {state.phase === "SELECT_QUESTION" && (
        <QuestionBoardPhase state={state} onSelectQuestion={(q, mode) => {
          const newState = chooseQuestion(state, mode, q);
          setSession({ ...session, state: newState });
        }} />
      )}

      {/* Phase: PRIMARY_ANSWER */}
      {state.phase === "PRIMARY_ANSWER" && state.currentQuestion && (
        <AnsweringPhase
          question={state.currentQuestion}
          answeringTeam={state.selectingTeam === state.answeringTeam ? teamAName : teamBName}
          onSubmit={(answerIndex) => {
            const newState = submitPrimaryAnswer(state, answerIndex);
            setSession({ ...session, state: newState });
          }}
        />
      )}

      {/* Phase: STEAL_OPPORTUNITY */}
      {state.phase === "STEAL_OPPORTUNITY" && state.currentQuestion && (
        <StealPhase
          question={state.currentQuestion}
          stealingTeam={state.stealingTeam === "A" ? teamAName : teamBName}
          onSubmit={(answerIndex) => {
            const newState = submitStealAnswer(state, answerIndex);
            setSession({ ...session, state: newState });
          }}
          onSkip={() => {
            const newState = skipSteal(state);
            setSession({ ...session, state: newState });
          }}
        />
      )}

      {/* Phase: REVEAL_RESULT */}
      {state.phase === "REVEAL_RESULT" && state.currentQuestion && state.history.length > 0 && (
        <RevealPhase
          question={state.currentQuestion}
          turn={state.history[state.history.length - 1]}
          onNext={() => {
            const newState = advanceToNext(state);
            setSession({ ...session, state: newState });
          }}
        />
      )}

      {/* Phase: MATCH_COMPLETE */}
      {state.phase === "MATCH_COMPLETE" && (
        <MatchCompletePhase
          state={state}
          teamAName={teamAName}
          teamBName={teamBName}
          onRestart={() => {
            setSession({ ...session, state: createArenaGame(state.config), setupPhase: "teams" });
          }}
        />
      )}

      {/* Teacher controls */}
      <div className={styles.controls}>
        <button className={styles.btn} onClick={() => setShowRules(!showRules)}>
          {showRules ? "Ẩn quy tắc" : "Xem quy tắc"}
        </button>
        <button className={styles.btn} onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? "🔊 Âm thanh ON" : "🔇 Âm thanh OFF"}
        </button>
        <button
          className={styles.btn}
          onClick={() => {
            setSession({
              ...session,
              state: createArenaGame(state.config),
              setupPhase: "teams",
            });
          }}
        >
          Đặt lại trò chơi
        </button>
      </div>

      {/* Rules modal */}
      {showRules && (
        <div style={{ marginTop: "2rem", padding: "2rem", background: "var(--arena-surface)", borderRadius: "12px" }}>
          <h3>📖 Quy tắc ĐẤU TRƯỜNG</h3>
          <ul>
            <li>Đội A chọn vòng 1 & 3, Đội B chọn vòng 2 & 4</li>
            <li><strong>Tự Giải:</strong> Đội chọn trả lời, đúng +100%, sai → đối thủ cướp +60%</li>
            <li><strong>Thách Đấu:</strong> Đội chọn gán câu cho đối thủ, sai → quyền cướp +60%</li>
            <li>Điểm: Dễ 100 | Trung bình 200 | Khó 300</li>
            <li>Hòa → Vòng phụ (tiebreaker)</li>
          </ul>
          <button className={styles.btn} onClick={() => setShowRules(false)}>
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    SETUP: "Chuẩn bị",
    SELECT_QUESTION: "Chọn câu hỏi",
    PRIMARY_ANSWER: "Trả lời",
    STEAL_OPPORTUNITY: "Cơ hội cướp",
    REVEAL_RESULT: "Kết quả",
    ROUND_COMPLETE: "Vòng hoàn thành",
    MATCH_COMPLETE: "Kết thúc trận đấu",
    TIEBREAKER: "Vòng phụ",
  };
  return labels[phase] || phase;
}

interface QuestionBoardPhaseProps {
  state: ArenaGameState;
  onSelectQuestion: (question: QuestionData, mode: "self" | "challenge") => void;
}

function QuestionBoardPhase({ state, onSelectQuestion }: QuestionBoardPhaseProps) {
  const questions = ARENA_QUESTIONS.filter((q) => !state.usedQuestions.has(q.id));

  return (
    <div className={styles.questionView}>
      <h3>📋 Chọn câu hỏi</h3>
      <div className={styles.questionBoard}>
        {questions.slice(0, 12).map((q) => (
          <button
            key={q.id}
            className={styles.questionCard}
            onClick={() => onSelectQuestion(q, "self")}
            title={`${q.topic} · ${q.difficulty}`}
          >
            <div className={styles.questionTopic}>{q.topic}</div>
            <div className={styles.questionDifficulty} data-level={q.difficulty}>
              {q.difficulty.toUpperCase()}
            </div>
            <div className={styles.questionPoints}>
              {q.difficulty === "easy" ? "100" : q.difficulty === "medium" ? "200" : "300"}
            </div>
          </button>
        ))}
      </div>
      {state.config.enableChallenge && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255, 255, 255, 0.03)", borderRadius: "9px" }}>
          <p>💡 <strong>Hoặc chọn "Thách Đấu"</strong> để gán câu cho đội kia:</p>
          {questions.slice(0, 6).map((q) => (
            <button
              key={`challenge-${q.id}`}
              className={styles.btn}
              style={{ marginRight: "0.5rem", marginBottom: "0.5rem" }}
              onClick={() => onSelectQuestion(q, "challenge")}
            >
              ⚔️ {q.difficulty} · {q.topic}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface AnsweringPhaseProps {
  question: QuestionData;
  answeringTeam: string;
  onSubmit: (answerIndex: number) => void;
}

function AnsweringPhase({ question, answeringTeam, onSubmit }: AnsweringPhaseProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className={styles.questionView}>
      <div style={{ marginBottom: "1rem", color: "var(--arena-muted)" }}>
        <strong>{answeringTeam}</strong> trả lời:
      </div>
      <h3 className={styles.questionText}>{question.question}</h3>
      <div className={styles.optionsList}>
        {question.options.map((option, i) => (
          <button
            key={i}
            className={styles.optionButton}
            data-selected={selected === i}
            onClick={() => setSelected(i)}
          >
            <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
            <span className={styles.optionText}>{option}</span>
          </button>
        ))}
      </div>
      <div className={styles.controls}>
        <button
          className={styles.btn}
          data-variant="primary"
          disabled={selected === null}
          onClick={() => onSubmit(selected!)}
        >
          Chốt đáp án
        </button>
      </div>
    </div>
  );
}

interface StealPhaseProps {
  question: QuestionData;
  stealingTeam: string;
  onSubmit: (answerIndex: number) => void;
  onSkip: () => void;
}

function StealPhase({ question, stealingTeam, onSubmit, onSkip }: StealPhaseProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className={styles.questionView}>
      <div style={{ marginBottom: "1rem", color: "var(--arena-steal)" }}>
        <strong>{stealingTeam}</strong> có cơ hội cướp:
      </div>
      <h3 className={styles.questionText}>{question.question}</h3>
      <div className={styles.optionsList}>
        {question.options.map((option, i) => (
          <button
            key={i}
            className={styles.optionButton}
            data-selected={selected === i}
            onClick={() => setSelected(i)}
          >
            <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
            <span className={styles.optionText}>{option}</span>
          </button>
        ))}
      </div>
      <div className={styles.controls}>
        <button
          className={styles.btn}
          data-variant="primary"
          disabled={selected === null}
          onClick={() => onSubmit(selected!)}
        >
          Cướp với đáp án này
        </button>
        <button className={styles.btn} onClick={onSkip}>
          Bỏ cuộc
        </button>
      </div>
    </div>
  );
}

interface RevealPhaseProps {
  question: QuestionData;
  turn: any;
  onNext: () => void;
}

function RevealPhase({ question, turn, onNext }: RevealPhaseProps) {
  const isCorrect = turn.primaryCorrect;
  const wasSteal = turn.stealCorrect !== null;

  return (
    <div className={styles.questionView}>
      <h3 className={styles.questionText}>{question.question}</h3>
      <div className={styles.optionsList}>
        {question.options.map((option, i) => (
          <div
            key={i}
            className={styles.optionButton}
            style={{ cursor: "default", padding: "1rem" }}
            data-correct={i === question.answer}
            data-wrong={i === (isCorrect ? -1 : i)}
          >
            <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
            <span className={styles.optionText}>{option}</span>
          </div>
        ))}
      </div>

      <div
        className={styles.feedback}
        data-correct={wasSteal ? turn.stealCorrect : isCorrect}
        data-steal={wasSteal}
      >
        <p className={styles.feedbackTitle} data-correct={wasSteal ? turn.stealCorrect : isCorrect}>
          {wasSteal
            ? turn.stealCorrect
              ? "✅ Cướp đúng +60%"
              : "❌ Cướp sai, 0 điểm"
            : isCorrect
              ? "✅ Trả lời đúng +100%"
              : "❌ Sai, đối thủ có cơ hội cướp"}
        </p>
        <p className={styles.feedbackText}>{question.explanation}</p>
      </div>

      <div className={styles.controls}>
        <button className={styles.btn} data-variant="primary" onClick={onNext}>
          Vòng tiếp theo →
        </button>
      </div>
    </div>
  );
}

interface MatchCompletePaseProps {
  state: ArenaGameState;
  teamAName: string;
  teamBName: string;
  onRestart: () => void;
}

function MatchCompletePhase({ state, teamAName, teamBName, onRestart }: MatchCompletePaseProps) {
  const winner = getWinner(state);
  const scores = getScores(state);

  return (
    <div className={styles.matchSummary}>
      <h2>🏆 KẾT THÚC TRÂN ĐẤU</h2>

      <div className={styles.winnerAnnouncement} data-team={winner === "A" ? "A" : winner === "B" ? "B" : undefined}>
        {winner === "tie" ? "🤝 HOÀ ĐIỂM" : `🎉 ${winner === "A" ? teamAName : teamBName} CHIẾN THẮNG`}
      </div>

      <table className={styles.statsTable}>
        <thead>
          <tr>
            <th>Đội</th>
            <th>Điểm</th>
            <th>Câu đúng</th>
            <th>Cướp thành</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>{teamAName}</strong></td>
            <td>{scores.A}</td>
            <td>{state.history.filter((t) => t.awardedTo === "A" && t.primaryCorrect).length}</td>
            <td>{state.history.filter((t) => t.awardedTo === "A" && t.stealCorrect).length}</td>
          </tr>
          <tr>
            <td><strong>{teamBName}</strong></td>
            <td>{scores.B}</td>
            <td>{state.history.filter((t) => t.awardedTo === "B" && t.primaryCorrect).length}</td>
            <td>{state.history.filter((t) => t.awardedTo === "B" && t.stealCorrect).length}</td>
          </tr>
        </tbody>
      </table>

      <div className={styles.controls}>
        <button className={styles.btn} data-variant="primary" onClick={onRestart}>
          Chơi lại
        </button>
      </div>
    </div>
  );
}
