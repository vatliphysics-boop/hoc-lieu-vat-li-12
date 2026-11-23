"use client";

/**
 * Trò chơi ôn tập hai đội trên cùng một thiết bị.
 * Câu hỏi lấy từ nội dung ôn tập có sẵn của năm bài; điểm chỉ giữ trong phiên.
 */

import { useMemo, useState } from "react";
import { NUCLEAR_LEARNING_CONTENT } from "@/lib/nuclear-learning-content";

type Turn = 0 | 1;

export function TeamReviewGame() {
  const questions = useMemo(
    () => NUCLEAR_LEARNING_CONTENT.flatMap((lesson) => lesson.quiz.map((q) => ({ ...q, code: lesson.code }))),
    [],
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [missed, setMissed] = useState<string[]>([]);
  const [questionsPerRound, setQuestionsPerRound] = useState(10);

  const round = questions.slice(0, Math.min(questionsPerRound, questions.length));
  const question = round[index];
  const turn: Turn = (index % 2) as Turn;
  const finished = index >= round.length;

  function check() {
    if (selected === null) return;
    setChecked(true);
    const correct = selected === question.answer;
    if (correct) {
      setScores((prev) => {
        const next: [number, number] = [...prev];
        next[turn] += 1;
        return next;
      });
    } else {
      setMissed((prev) => [...prev, `${question.code}: ${question.question}`]);
    }
  }

  function next() {
    setIndex((i) => i + 1);
    setSelected(null);
    setChecked(false);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setScores([0, 0]);
    setMissed([]);
  }

  return (
    <div className="team-game">
      <div className="team-game-scoreboard" aria-live="polite">
        <div className={turn === 0 && !finished ? "team-score is-turn" : "team-score"}>
          <span className="team-name">Đội A</span>
          <strong>{scores[0]}</strong>
        </div>
        <div className="team-game-progress">
          {finished ? "Kết thúc" : `Câu ${index + 1} / ${round.length}`}
          <span className="team-game-turn">{finished ? "" : `Lượt đội ${turn === 0 ? "A" : "B"}`}</span>
        </div>
        <div className={turn === 1 && !finished ? "team-score is-turn" : "team-score"}>
          <span className="team-name">Đội B</span>
          <strong>{scores[1]}</strong>
        </div>
      </div>

      {finished ? (
        <div className="team-game-summary" role="status">
          <h3>Kết quả vòng chơi</h3>
          <p>
            Đội A: <strong>{scores[0]}</strong> · Đội B: <strong>{scores[1]}</strong>
            {scores[0] === scores[1] ? " — Hoà." : ` — Đội ${scores[0] > scores[1] ? "A" : "B"} tạm dẫn.`}
          </p>
          {missed.length > 0 && (
            <>
              <p>Những câu cả lớp còn sai, nên ôn lại:</p>
              <ul>
                {missed.map((item, i) => (
                  <li key={`${item}-${i}`}>{item}</li>
                ))}
              </ul>
            </>
          )}
          <p className="team-game-note">
            Điểm chỉ tính trong phiên chơi này và không được lưu lại. Giáo viên ghi chú các
            câu sai để điều chỉnh tiết ôn tập.
          </p>
          <button type="button" className="btn primary" onClick={restart}>
            Chơi vòng mới
          </button>
        </div>
      ) : (
        <div className="team-game-question">
          <p className="team-game-topic">Bài {question.code}</p>
          <fieldset disabled={checked}>
            <legend>{question.question}</legend>
            {question.options.map((option, i) => (
              <label key={option} className={selected === i ? "team-game-option is-selected" : "team-game-option"}>
                <input
                  type="radio"
                  name={`team-game-${index}`}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {checked && (
            <div className="team-game-feedback" role="status">
              <p>
                <strong>{selected === question.answer ? "Đúng · +1 điểm" : "Chưa đúng"}</strong>
              </p>
              <p>{question.explanation}</p>
            </div>
          )}
          <div className="team-game-actions">
            {!checked ? (
              <button type="button" className="btn primary" disabled={selected === null} onClick={check}>
                Chốt đáp án
              </button>
            ) : (
              <button type="button" className="btn primary" onClick={next}>
                {index === round.length - 1 ? "Xem kết quả" : "Lượt tiếp theo"}
              </button>
            )}
          </div>
        </div>
      )}

      <label className="team-game-setup">
        Số câu mỗi vòng
        <select
          value={questionsPerRound}
          onChange={(e) => {
            setQuestionsPerRound(Number(e.target.value));
            restart();
          }}
        >
          {Array.from(new Set([6, 10, 15, questions.length])).sort((a, b) => a - b).map((n) => (
            <option key={n} value={n}>
              {n} câu
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
