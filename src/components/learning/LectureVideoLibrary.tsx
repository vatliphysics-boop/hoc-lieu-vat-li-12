"use client";

/**
 * Thư viện video bài giảng — phát video đã có sẵn theo từng bài,
 * kèm nhiệm vụ xem và danh sách câu hỏi gợi ý.
 */

import { useState } from "react";
import { NuclearLessonVideo } from "./NuclearLessonVideo";
import { NUCLEAR_LAB_LESSONS, NUCLEAR_VIDEO_METADATA } from "@/lib/nuclear-lab-lessons";

function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LectureVideoLibrary() {
  const [activeCode, setActiveCode] = useState<string>(NUCLEAR_LAB_LESSONS[0].code);
  const active = NUCLEAR_LAB_LESSONS.find((l) => l.code === activeCode) ?? NUCLEAR_LAB_LESSONS[0];
  const meta = NUCLEAR_VIDEO_METADATA[active.code];

  return (
    <div className="lecture-video-library">
      <div className="lecture-video-layout">
        <nav className="lecture-video-list" aria-label="Danh sách video bài giảng">
          {NUCLEAR_LAB_LESSONS.map((lesson) => {
            const m = NUCLEAR_VIDEO_METADATA[lesson.code];
            const isActive = lesson.code === active.code;
            return (
              <button
                key={lesson.code}
                type="button"
                className={isActive ? "lecture-video-item is-active" : "lecture-video-item"}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActiveCode(lesson.code)}
              >
                <span className="lecture-video-code">{lesson.code}</span>
                <span className="lecture-video-title">{lesson.title}</span>
                <span className="lecture-video-meta">
                  {formatDuration(m.durationSeconds)} · {m.captions} phụ đề
                </span>
              </button>
            );
          })}
        </nav>

        <div className="lecture-video-player">
          <h2>
            {active.code} · {active.title}
          </h2>
          <p className="lecture-video-sub">
            Trang {active.pages} · Thời lượng {formatDuration(meta.durationSeconds)} · Lời
            thuyết minh tiếng Việt, có phụ đề.
          </p>
          <NuclearLessonVideo key={active.code} lesson={active} />
          <div className="lecture-video-task">
            <h3>Nhiệm vụ khi xem</h3>
            <p>{active.videoTask}</p>
          </div>
          <div className="lecture-video-question">
            <h3>Câu hỏi để mang đến lớp</h3>
            <p>{active.question}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
