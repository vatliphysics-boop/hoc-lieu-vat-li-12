/**
 * Shared material catalog list component.
 *
 * Renders a paginated list of materials with search-first layout.
 * Used by public, student, and teacher catalog views.
 *
 * Phase 1: search and filters are applied client-side over a result set
 * returned by the unified server query. Server-side pagination is wired
 * through `onLoadMore` for role-aware, DB-backed paging.
 */

"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { MaterialItem, MaterialType } from "@/lib/material-bank";
import { removeDiacritics } from "@/lib/material-query-service";
import { LearningResourcePreview } from "./LearningResourcePreview";

export const TYPE_LABELS: Record<MaterialType, string> = {
  simulation: "Mô phỏng 3D",
  image: "Ảnh & Sơ đồ",
  animation: "Minh họa động",
  real_video: "Video thực tế",
  lecture_video: "Video bài giảng",
  document: "PDF & Phiếu",
  colab: "Câu hỏi & Hoạt động",
  assessment: "Đề tự luyện",
};

const LESSON_OPTIONS = [
  { value: "all", label: "Tất cả bài" },
  { value: "B21", label: "B21 · Cấu trúc hạt nhân" },
  { value: "B22", label: "B22 · Phản ứng hạt nhân" },
  { value: "B23", label: "B23 · Phóng xạ" },
  { value: "B24", label: "B24 · Công nghiệp hạt nhân" },
  { value: "B25", label: "B25 · Bài tập" },
  { value: "general", label: "Dùng chung" },
];

const SAVED_KEY = "physics-saved-materials-v1";
const EMPTY_SNAPSHOT = () => "";

export type MaterialCatalogProps = {
  materials: MaterialItem[];
  total?: number;
  hasMore?: boolean;
  isLoading?: boolean;
  error?: string;
  role: "public" | "student" | "teacher";
  onLoadMore?: () => void;
  onSearch?: (query: string) => void;
  onFilterType?: (type: MaterialType | "all") => void;
  onFilterLesson?: (lesson: string) => void;
  showLessonCards?: boolean;
};

export function MaterialCatalog({
  materials,
  total,
  hasMore = false,
  isLoading = false,
  error,
  role,
  onLoadMore,
  showLessonCards = true,
}: MaterialCatalogProps) {
  const [type, setType] = useState<MaterialType | "all">("all");
  const [lesson, setLesson] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [showAllFilters, setShowAllFilters] = useState(false);

  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener("storage", notify);
    window.addEventListener("materials-saved", notify);
    return () => {
      window.removeEventListener("storage", notify);
      window.removeEventListener("materials-saved", notify);
    };
  }, []);

  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(SAVED_KEY) ?? "";
      } catch {
        return "";
      }
    },
    EMPTY_SNAPSHOT
  );

  const saved = useMemo<string[]>(() => {
    try {
      const value: unknown = JSON.parse(snapshot || "[]");
      return Array.isArray(value)
        ? value.filter((id): id is string => typeof id === "string").slice(0, 200)
        : [];
    } catch {
      return [];
    }
  }, [snapshot]);

  function toggleSaved(id: string) {
    try {
      localStorage.setItem(
        SAVED_KEY,
        JSON.stringify(
          saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id]
        )
      );
      window.dispatchEvent(new Event("materials-saved"));
      setNotice(
        saved.includes(id) ? "Đã bỏ khỏi học liệu đã lưu." : "Đã lưu học liệu trên thiết bị này."
      );
    } catch {
      setNotice("Trình duyệt chưa lưu được. Có thể dùng liên kết chia sẻ của học liệu.");
    }
  }

  // Client-side filtering over the current result page
  const visible = useMemo(() => {
    const q = search.trim();
    const nq = removeDiacritics(q.toLowerCase());
    return materials.filter((m) => {
      if (type !== "all" && m.material_type !== type) return false;
      if (lesson !== "all" && m.lesson_tag !== lesson) return false;
      if (!q) return true;
      const text = `${m.title} ${m.description ?? ""} ${m.lesson_tag ?? ""}`.toLowerCase();
      return text.includes(q.toLowerCase()) || removeDiacritics(text).includes(nq);
    });
  }, [materials, type, lesson, search]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: materials.length };
    for (const m of materials) counts[m.material_type] = (counts[m.material_type] ?? 0) + 1;
    return counts;
  }, [materials]);

  const resetFilters = () => {
    setType("all");
    setLesson("all");
    setSearch("");
    setOpen(null);
  };

  return (
    <section className="material-catalog">
      {/* Search bar — dominant entry point */}
      <div className="material-catalog-search">
        <label className="material-catalog-search-field">
          <span className="sr-only">Tìm học liệu</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(null);
            }}
            placeholder="Tìm học liệu: tên, bài, công thức, hiện tượng…"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="btn small"
          aria-expanded={showAllFilters}
          onClick={() => setShowAllFilters((v) => !v)}
        >
          {showAllFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
        </button>
      </div>

      {/* Quick filters: lesson first, then type */}
      <div className="material-catalog-quickfilters" role="group" aria-label="Lọc nhanh">
        <label>
          <span className="sr-only">Bài học</span>
          <select value={lesson} onChange={(e) => { setLesson(e.target.value); setOpen(null); }}>
            {LESSON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        {showAllFilters && (
          <div className="material-catalog-types" aria-label="Lọc theo loại học liệu">
            {(["all", ...Object.keys(TYPE_LABELS)] as (MaterialType | "all")[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`btn small ${type === value ? "primary" : ""}`}
                aria-pressed={type === value}
                onClick={() => { setType(value); setOpen(null); }}
              >
                {value === "all" ? "Tất cả" : TYPE_LABELS[value as MaterialType]}
                {typeCounts[value] ? ` (${typeCounts[value]})` : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status line */}
      <p role="status" className="material-catalog-status">
        {isLoading
          ? "Đang tải học liệu…"
          : `${visible.length}${total !== undefined && total > materials.length ? ` / ${total}` : ""} học liệu phù hợp.`}
      </p>

      {notice && <p role="status" className="physics-note">{notice}</p>}

      {error && (
        <div role="alert" className="form-alert form-alert-error">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && materials.length === 0 && (
        <div className="material-catalog-skeleton" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="material-catalog-skeleton-row" />
          ))}
        </div>
      )}

      {/* Result rows — compact, one dominant action */}
      <div className="material-catalog-items">
        {visible.map((m) => (
          <article className="material-row" key={m.id}>
            <button
              type="button"
              className="material-row-main"
              aria-expanded={open === m.id}
              aria-controls={`resource-${m.id}`}
              onClick={() => setOpen(open === m.id ? null : m.id)}
            >
              <span className="material-row-meta">
                <span className="material-row-type">{TYPE_LABELS[m.material_type] ?? m.material_type}</span>
                {m.lesson_tag && (
                  <span className="material-row-lesson">
                    {m.lesson_tag === "general" ? "Dùng chung" : m.lesson_tag}
                  </span>
                )}
              </span>
              <strong className="material-row-title">{m.title}</strong>
            </button>

            <div className="material-row-actions">
              {role !== "public" && (
                <button
                  type="button"
                  className="material-row-save"
                  aria-label={`${saved.includes(m.id) ? "Bỏ lưu" : "Lưu"} ${m.title}`}
                  aria-pressed={saved.includes(m.id)}
                  onClick={() => toggleSaved(m.id)}
                >
                  {saved.includes(m.id) ? "★" : "☆"}
                </button>
              )}
              <button
                type="button"
                className="btn small primary"
                onClick={() => setOpen(open === m.id ? null : m.id)}
              >
                {open === m.id ? "Đóng" : "Mở"}
              </button>
            </div>

            {open === m.id && (
              <div id={`resource-${m.id}`} className="material-row-detail">
                {/* Supporting text lives here, not on the card */}
                {m.description && <p>{m.description}</p>}

                <LearningResourcePreview material={m} />

                {m.metadata?.sourceBook && (
                  <p className="physics-note">Nguồn: {m.metadata.sourceBook}</p>
                )}
                {m.metadata?.author && (
                  <p className="physics-note">
                    Tác giả: {m.metadata.author}
                    {m.metadata.language === "en" ? " · Tài liệu tiếng Anh, hướng dẫn tiếng Việt trong mô tả." : ""}
                    {m.metadata.verifiedAt
                      ? ` · Kiểm tra liên kết ngày ${m.metadata.verifiedAt.split("-").reverse().join("/")}.`
                      : ""}
                  </p>
                )}

                <div className="material-row-links">
                  {m.lesson_tag && /^B2[1-5]$/.test(m.lesson_tag) && m.material_type !== "assessment" && (
                    <Link className="btn small" href={`/hoc-lieu/ai?bai=${m.lesson_tag}`}>
                      Hỏi AI về bài {m.lesson_tag} ↗
                    </Link>
                  )}
                  <Link
                    className="btn small"
                    href={`/hoc-lieu/soan-ke-hoach?material=${encodeURIComponent(m.id)}`}
                  >
                    Đưa vào kế hoạch dạy học
                  </Link>
                  <Link
                    className="btn small"
                    href={`/hoc-lieu?bai=${m.lesson_tag === "general" || !m.lesson_tag ? "all" : m.lesson_tag}&resource=${encodeURIComponent(m.id)}`}
                  >
                    Liên kết chia sẻ ↗
                  </Link>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && visible.length === 0 && (
        <div className="material-catalog-empty">
          <p>Chưa tìm thấy học liệu phù hợp.</p>
          <button className="btn small" onClick={resetFilters}>Xóa bộ lọc</button>
        </div>
      )}

      {/* Pagination / load more */}
      {hasMore && (
        <div className="material-catalog-more">
          <button type="button" className="btn" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? "Đang tải…" : "Tải thêm học liệu"}
          </button>
        </div>
      )}

      {showLessonCards && (
        <nav className="material-catalog-lessons" aria-label="Mở học liệu theo bài">
          {["B21", "B22", "B23", "B24", "B25"].map((code) => (
            <Link key={code} href={`/hoc-lieu/truc-quan?bai=${code}`}>
              <span>{code}</span>
              <small>Hình · 3D · Video ↗</small>
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}
