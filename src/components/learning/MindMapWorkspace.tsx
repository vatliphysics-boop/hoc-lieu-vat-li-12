"use client";

/**
 * Không gian sơ đồ tư duy cộng tác (dùng chung một thiết bị).
 *
 * Học sinh chọn một chủ đề, thêm nhánh và ý phụ, rồi tải sản phẩm về máy.
 * Dữ liệu chỉ tồn tại trong phiên mở trang — ghi rõ để không hiểu nhầm là đã lưu.
 */

import { useMemo, useState } from "react";

type Branch = { id: string; label: string; ideas: string[] };

const TOPICS: Record<string, { title: string; branches: string[] }> = {
  "ung-dung-phong-xa": {
    title: "Ứng dụng của đồng vị phóng xạ trong thực tiễn",
    branches: ["Y học", "Nông nghiệp", "Công nghiệp", "Khảo cổ", "Môi trường"],
  },
  "an-toan-buc-xa": {
    title: "Nguyên tắc an toàn bức xạ",
    branches: ["Thời gian", "Khoảng cách", "Che chắn", "Biển báo", "Quản lý nguồn"],
  },
  "nang-luong-hat-nhan": {
    title: "Năng lượng hạt nhân và điện lực",
    branches: ["Phân hạch", "Dây chuyền", "Điều khiển", "Chất thải", "So sánh nguồn điện"],
  },
};

function newBranch(label: string): Branch {
  return { id: `b${Math.random().toString(36).slice(2, 8)}`, label, ideas: [] };
}

export function MindMapWorkspace() {
  const [topicId, setTopicId] = useState<string>("ung-dung-phong-xa");
  const [branches, setBranches] = useState<Branch[]>(() =>
    TOPICS["ung-dung-phong-xa"].branches.map(newBranch),
  );
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newBranchLabel, setNewBranchLabel] = useState("");

  const topic = TOPICS[topicId];
  const totalIdeas = useMemo(
    () => branches.reduce((n, b) => n + b.ideas.length, 0),
    [branches],
  );

  function changeTopic(id: string) {
    setTopicId(id);
    setBranches(TOPICS[id].branches.map(newBranch));
    setDraft({});
  }

  function addIdea(branchId: string) {
    const text = (draft[branchId] ?? "").trim();
    if (!text) return;
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, ideas: [...b.ideas, text] } : b)),
    );
    setDraft((prev) => ({ ...prev, [branchId]: "" }));
  }

  function removeIdea(branchId: string, index: number) {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === branchId ? { ...b, ideas: b.ideas.filter((_, i) => i !== index) } : b,
      ),
    );
  }

  function addBranch() {
    const label = newBranchLabel.trim();
    if (!label) return;
    setBranches((prev) => [...prev, newBranch(label)]);
    setNewBranchLabel("");
  }

  function exportMap() {
    const lines = [
      topic.title,
      "",
      ...branches.map(
        (b) => `${b.label}\n${b.ideas.length ? b.ideas.map((i) => `  - ${i}`).join("\n") : "  (chưa có ý)"}`,
      ),
    ];
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "so-do-tu-duy.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mindmap-workspace">
      <div className="mindmap-toolbar">
        <label>
          Chủ đề
          <select value={topicId} onChange={(e) => changeTopic(e.target.value)}>
            {Object.entries(TOPICS).map(([id, t]) => (
              <option key={id} value={id}>{t.title}</option>
            ))}
          </select>
        </label>
        <p className="mindmap-counter" role="status">
          {branches.length} nhánh · {totalIdeas} ý
        </p>
        <button type="button" className="btn" onClick={exportMap} disabled={totalIdeas === 0}>
          Tải sơ đồ về máy
        </button>
      </div>

      <div className="mindmap-canvas" aria-label={`Sơ đồ tư duy: ${topic.title}`}>
        <div className="mindmap-center">{topic.title}</div>
        <ul className="mindmap-branches">
          {branches.map((branch) => (
            <li key={branch.id} className="mindmap-branch">
              <h3>{branch.label}</h3>
              {branch.ideas.length > 0 ? (
                <ul className="mindmap-ideas">
                  {branch.ideas.map((idea, index) => (
                    <li key={`${branch.id}-${index}`}>
                      <span>{idea}</span>
                      <button
                        type="button"
                        className="mindmap-remove"
                        aria-label={`Xóa ý: ${idea}`}
                        onClick={() => removeIdea(branch.id, index)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mindmap-empty">Chưa có ý nào.</p>
              )}
              <div className="mindmap-add">
                <input
                  type="text"
                  value={draft[branch.id] ?? ""}
                  placeholder="Thêm một ý…"
                  aria-label={`Thêm ý cho nhánh ${branch.label}`}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [branch.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addIdea(branch.id);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn small"
                  onClick={() => addIdea(branch.id)}
                  disabled={!(draft[branch.id] ?? "").trim()}
                >
                  Thêm
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mindmap-add-branch">
        <input
          type="text"
          value={newBranchLabel}
          placeholder="Tên nhánh mới…"
          aria-label="Tên nhánh mới"
          onChange={(e) => setNewBranchLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addBranch();
            }
          }}
        />
        <button type="button" className="btn" onClick={addBranch} disabled={!newBranchLabel.trim()}>
          Thêm nhánh
        </button>
      </div>

      <p className="mindmap-note" role="note">
        Sơ đồ chỉ giữ trong phiên mở trang này. Hãy bấm {'"Tải sơ đồ về máy"'} trước khi đóng
        hoặc tải lại trang để giữ lại sản phẩm của nhóm.
      </p>
    </div>
  );
}
