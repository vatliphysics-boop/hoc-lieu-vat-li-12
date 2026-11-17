/**
 * Shared material catalog list component.
 *
 * Search-first layout, compact rows, one dominant action per row.
 * Used by the public, student and teacher catalogue views.
 *
 * Data flow: the server component (`MaterialCatalogRoute`) runs the real query
 * and passes a paginated page here. This component refines that page instantly
 * as the user types or changes filters — no network round-trip — while page
 * navigation is a real URL change that re-runs the server query.
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

/** Short label used inside the compact type chips. */
const TYPE_SHORT: Record<MaterialType, string> = {
  simulation: "Mô phỏng",
  image: "Ảnh",
  animation: "Minh họa",
  real_video: "Video thực tế",
  lecture_video: "Bài giảng",
  document: "PDF",
  colab: "Hoạt động",
  assessment: "Đề",
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
  /** Exact total over the whole filtered set, not just this page. */
  total?: number;
  hasMore?: boolean;
  isLoading?: boolean;
  error?: string;
  role: "public" | "student" | "teacher";
  /** Server reported that the scan hit its guard; catalogue may be partial. */
  truncated?: boolean;
  /** 1-based page number, used for the pager. */
  page?: number;
  /** Base path (e.g. "/hoc-lieu"), without query string. */
  basePath: string;
  /** Query string (e.g. "type=simulation&bai=B22"), no leading `?`. Client builds URLs. */
  baseQuery?: string;
  initialType?: string;
  initialLesson?: string;
  initialSearch?: string;
  showLessonCards?: boolean;
};

export function MaterialCatalog({
  materials,
  total,
  hasMore = false,
  isLoading = false,
  error,
  role,
  truncated = false,
  page = 1,
  basePath,
  baseQuery = "",
  initialType = "all",
  initialLesson = "all",
  initialSearch = "",
  showLessonCards = true,
}: MaterialCatalogProps) {
  const [type, setType] = useState<MaterialType | "all">(
    (initialType as MaterialType | "all") ?? "all"
  );
  const [lesson, setLesson] = useState(initialLesson);
  const [search, setSearch] = useState(initialSearch);
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
        JSON.stringify(saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id])
      );
      window.dispatchEvent(new Event("materials-saved"));
      setNotice(
        saved.includes(id) ? "Đã bỏ khỏi học liệu đã lưu." : "Đã lưu học liệu trên thiết bị này."
      );
    } catch {
      setNotice("Trình duyệt chưa lưu được. Có thể dùng liên kết chia sẻ của học liệu.");
    }
  }

  // Instant client-side refinement over the page already loaded.
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

  const refined = Boolean(search.trim()) || type !== "all" || lesson !== "all";
  const shownTotal = total ?? materials.length;

  const resetFilters = () => {
    setType("all");
    setLesson("all");
    setSearch("");
    setOpen(null);
  };

  const buildHref = (nextPage: number): string => {
    const params = new URLSearchParams(baseQuery);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <section className="material-catalog" aria-labelledby="material-catalog-heading">
      <h2 id="material-catalog-heading" className="sr-only">
        Kho học liệu
      </h2>

      {/* Search bar — dominant entry point */}
      <div className="material-catalog-search">
        <label className="material-catalog-search-field">
          <span className="sr-only">Tìm học liệu</span>
          <span className="material-catalog-search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(null);
            }}
            placeholder="Tìm theo tên, bài học, hiện tượng hoặc công thức…"
            autoComplete="off"
            enterKeyHint="search"
          />
          {search && (
            <button
              type="button"
              className="material-catalog-search-clear"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => {
                setSearch("");
                setOpen(null);
              }}
            >
              ×
            </button>
          )}
        </label>
        <button
          type="button"
          className="btn small"
          aria-expanded={showAllFilters}
          aria-controls="material-catalog-typefilters"
          onClick={() => setShowAllFilters((v) => !v)}
        >
          {showAllFilters ? "Ẩn loại" : "Loại học liệu"}
        </button>
      </div>

      {/* Quick filters: lesson first, then type */}
      <div className="material-catalog-quickfilters">
        <label className="material-catalog-lessonselect">
          <span className="sr-only">Bài học</span>
          <select
            value={lesson}
            onChange={(e) => {
              setLesson(e.target.value);
              setOpen(null);
            }}
          >
            {LESSON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {refined && (
          <button type="button" className="btn small" onClick={resetFilters}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {showAllFilters && (
        <div
          className="material-catalog-types"
          id="material-catalog-typefilters"
          role="group"
          aria-label="Lọc theo loại học liệu"
        >
          {(["all", ...Object.keys(TYPE_LABELS)] as (MaterialType | "all")[]).map((value) => (
            <button
              key={value}
              type="button"
              className={`material-catalog-typechip ${type === value ? "is-active" : ""}`}
              aria-pressed={type === value}
              onClick={() => {
                setType(value);
                setOpen(null);
              }}
            >
              {value === "all" ? "Tất cả" : TYPE_SHORT[value as MaterialType]}
              {typeCounts[value] ? (
                <span className="material-catalog-typechip-count">{typeCounts[value]}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {/* Status line */}
      <p role="status" className="material-catalog-status">
        {isLoading ? (
          "Đang tải học liệu…"
        ) : (
          <>
            <strong>{refined ? visible.length : shownTotal}</strong>
            {refined && shownTotal !== visible.length ? <> trên {shownTotal}</> : null} học liệu
            {page > 1 ? ` · trang ${page}` : ""}.
          </>
        )}
      </p>

      {truncated && (
        <p role="status" className="form-alert form-alert-warning">
          Kho học liệu vượt giới hạn quét an toàn. Một số học liệu cũ nhất có thể chưa hiển thị —
          hãy dùng bộ lọc theo bài hoặc loại để thu hẹp.
        </p>
      )}

      {notice && (
        <p role="status" className="physics-note">
          {notice}
        </p>
      )}

      {error && (
        <div role="alert" className="form-alert form-alert-error">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && materials.length === 0 && (
        <div className="material-catalog-skeleton" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="material-catalog-skeleton-row" />
          ))}
        </div>
      )}

      {/* Result rows — compact, one dominant action */}
      <div className="material-catalog-items">
        {visible.map((m) => {
          const expanded = open === m.id;
          return (
            <article className={`material-row ${expanded ? "is-open" : ""}`} key={m.id}>
              <button
                type="button"
                className="material-row-main"
                aria-expanded={expanded}
                aria-controls={`resource-${m.id}`}
                onClick={() => setOpen(expanded ? null : m.id)}
              >
                <span className="material-row-meta">
                  <span className={`material-row-type is-${m.material_type}`}>
                    {TYPE_LABELS[m.material_type] ?? m.material_type}
                  </span>
                  {m.lesson_tag && (
                    <span className="material-row-lesson">
                      {m.lesson_tag === "general" ? "Dùng chung" : m.lesson_tag}
                    </span>
                  )}
                  {m.metadata?.durationMinutes ? (
                    <span className="material-row-duration">{m.metadata.durationMinutes} phút</span>
                  ) : null}
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
                  className={`btn small ${expanded ? "" : "primary"}`}
                  onClick={() => setOpen(expanded ? null : m.id)}
                >
                  {expanded ? "Đóng" : "Mở"}
                </button>
              </div>

              {expanded && (
                <div id={`resource-${m.id}`} className="material-row-detail">
                  {/* Supporting text lives here, not on the row */}
                  {m.description && <p>{m.description}</p>}

                  <LearningResourcePreview material={m} />

                  {m.metadata?.sourceBook && (
                    <p className="physics-note">Nguồn: {m.metadata.sourceBook}</p>
                  )}
                  {m.metadata?.author && (
                    <p className="physics-note">
                      Tác giả: {m.metadata.author}
                      {m.metadata.language === "en"
                        ? " · Tài liệu tiếng Anh, hướng dẫn tiếng Việt trong mô tả."
                        : ""}
                      {m.metadata.verifiedAt
                        ? ` · Kiểm tra liên kết ngày ${m.metadata.verifiedAt
                            .split("-")
                            .reverse()
                            .join("/")}.`
                        : ""}
                    </p>
                  )}

                  <div className="material-row-links">
                    {m.lesson_tag &&
                      /^B2[1-5]$/.test(m.lesson_tag) &&
                      m.material_type !== "assessment" && (
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
                      href={`/hoc-lieu?bai=${
                        m.lesson_tag === "general" || !m.lesson_tag ? "all" : m.lesson_tag
                      }&resource=${encodeURIComponent(m.id)}`}
                    >
                      Liên kết chia sẻ ↗
                    </Link>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Empty state */}
      {!isLoading && !error && visible.length === 0 && (
        <div className="material-catalog-empty">
          <p>
            {search.trim()
              ? <>Không tìm thấy học liệu cho “{search.trim()}”.</>
              : "Chưa có học liệu phù hợp với bộ lọc này."}
          </p>
          <button type="button" className="btn small" onClick={resetFilters}>
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Pagination */}
      {(hasMore || page > 1) && (
        <nav className="material-catalog-more" aria-label="Phân trang học liệu">
          {page > 1 ? (
            <Link className="btn" href={buildHref(page - 1)} rel="prev">
              ← Trang trước
            </Link>
          ) : null}
          <span className="material-catalog-pagenum">Trang {page}</span>
          {hasMore ? (
            <Link className="btn primary" href={buildHref(page + 1)} rel="next">
              Trang sau →
            </Link>
          ) : null}
        </nav>
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
