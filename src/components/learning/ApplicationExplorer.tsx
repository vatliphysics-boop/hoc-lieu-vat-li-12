"use client";

/**
 * Hoạt động 3.3 — Vận dụng & mở rộng.
 * Học sinh chọn một ứng dụng thực tiễn của phóng xạ, xem gợi ý nội dung và
 * lập dàn ý báo cáo ngắn. Dàn ý chỉ lưu trong phiên và có thể tải về dạng .txt.
 */

import { useState } from "react";

interface ApplicationCase {
  id: string;
  field: string;
  title: string;
  physics: string;
  questions: string[];
  caution: string;
}

const CASES: ApplicationCase[] = [
  {
    id: "medical",
    field: "Y tế",
    title: "Chẩn đoán hình ảnh bằng đồng vị phóng xạ",
    physics:
      "Đồng vị có chu kì bán rã ngắn được gắn vào hợp chất sinh học; máy ghi nhận tia phát ra để dựng ảnh. Chu kì bán rã ngắn giúp liều chiếu vào cơ thể thấp.",
    questions: [
      "Vì sao chọn đồng vị có chu kì bán rã vài giờ thay vì vài năm?",
      "Loại bức xạ nào đi ra khỏi cơ thể để máy ghi nhận được, loại nào bị giữ lại?",
      "Sau 24 giờ, một đồng vị có T = 6 giờ còn lại bao nhiêu phần?",
    ],
    caution: "Bài chỉ nêu nguyên lí vật lí, không thay thế hướng dẫn của cơ sở y tế.",
  },
  {
    id: "energy",
    field: "Năng lượng",
    title: "Điện hạt nhân và phản ứng phân hạch",
    physics:
      "Hạt nhân nặng bị chia thành các mảnh nhẹ hơn, giải phóng năng lượng do độ hụt khối. Phản ứng dây chuyền được kiểm soát để lò phát nhiệt ổn định.",
    questions: [
      "Năng lượng giải phóng trong một phân hạch được tính từ đại lượng nào?",
      "Điều kiện nào để phản ứng dây chuyền duy trì ổn định mà không bùng nổ?",
      "Chất thải phóng xạ của lò cần được quản lí trong bao lâu và vì sao?",
    ],
    caution: "Cần so sánh cả lợi ích và rủi ro; tránh kết luận một chiều.",
  },
  {
    id: "food",
    field: "Bảo quản",
    title: "Chiếu xạ bảo quản thực phẩm",
    physics:
      "Tia bức xạ ion hoá làm tổn thương vi sinh vật trên thực phẩm. Thực phẩm được chiếu không trở thành nguồn phóng xạ khi dùng bức xạ và mức năng lượng phù hợp.",
    questions: [
      "Bức xạ ion hoá tác động lên tế bào vi sinh vật như thế nào?",
      "Vì sao thực phẩm sau chiếu xạ không tự phát ra phóng xạ?",
      "Quy định về liều chiếu nhằm bảo vệ ai và bảo vệ điều gì?",
    ],
    caution: "Nên dẫn nguồn quy chuẩn chính thức khi trích số liệu về liều.",
  },
  {
    id: "dating",
    field: "Khảo cổ & địa chất",
    title: "Định tuổi bằng carbon-14",
    physics:
      "Tỉ lệ C-14 trong sinh vật sống gần như không đổi; khi chết, C-14 giảm theo quy luật bán rã. Đo tỉ lệ còn lại suy ra thời gian đã trôi qua.",
    questions: [
      "Từ tỉ lệ C-14 còn lại một nửa, suy ra tuổi mẫu là bao nhiêu chu kì bán rã?",
      "Phương pháp này không dùng được với mẫu bao nhiêu tuổi và vì sao?",
      "Những sai số nào có thể xuất hiện khi đo tỉ lệ C-14?",
    ],
    caution: "Kết quả định tuổi luôn đi kèm khoảng sai số, không phải một con số chắc chắn.",
  },
];

export function ApplicationExplorer() {
  const [activeId, setActiveId] = useState(CASES[0].id);
  const [claim, setClaim] = useState("");
  const [evidence, setEvidence] = useState("");
  const [limits, setLimits] = useState("");
  const [sources, setSources] = useState("");
  const [saved, setSaved] = useState(false);

  const active = CASES.find((c) => c.id === activeId) ?? CASES[0];
  const filled = [claim, evidence, limits, sources].filter((v) => v.trim()).length;

  function selectCase(id: string) {
    setActiveId(id);
    setSaved(false);
  }

  function exportOutline() {
    const text = [
      `BÁO CÁO VẬN DỤNG — ${active.title}`,
      `Lĩnh vực: ${active.field}`,
      "",
      "1. Nội dung chính em muốn trình bày:",
      claim || "(chưa viết)",
      "",
      "2. Kiến thức vật lí hạt nhân làm cơ sở:",
      evidence || "(chưa viết)",
      "",
      "3. Giới hạn, rủi ro hoặc điều chưa chắc chắn:",
      limits || "(chưa viết)",
      "",
      "4. Nguồn tham khảo (em tự tìm và kiểm chứng):",
      sources || "(chưa viết)",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `van-dung-${active.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  return (
    <div className="application-explorer">
      <div className="application-tabs" role="tablist" aria-label="Chọn ứng dụng thực tiễn">
        {CASES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            id={`application-tab-${c.id}`}
            aria-selected={c.id === activeId}
            aria-controls="application-panel"
            className={c.id === activeId ? "application-tab is-active" : "application-tab"}
            onClick={() => selectCase(c.id)}
          >
            {c.field}
          </button>
        ))}
      </div>

      <section
        id="application-panel"
        role="tabpanel"
        aria-labelledby={`application-tab-${active.id}`}
        className="application-case"
      >
        <h2>{active.title}</h2>
        <p>{active.physics}</p>
        <h3>Câu hỏi gợi ý để tìm hiểu</h3>
        <ul>
          {active.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <p className="application-caution">{active.caution}</p>
      </section>

      <section className="application-outline" aria-labelledby="application-outline-title">
        <h2 id="application-outline-title">Lập dàn ý báo cáo ngắn</h2>
        <label>
          Nội dung chính em muốn trình bày
          <textarea value={claim} onChange={(e) => { setClaim(e.target.value); setSaved(false); }} rows={3} />
        </label>
        <label>
          Kiến thức vật lí hạt nhân làm cơ sở
          <textarea value={evidence} onChange={(e) => { setEvidence(e.target.value); setSaved(false); }} rows={3} />
        </label>
        <label>
          Giới hạn, rủi ro hoặc điều chưa chắc chắn
          <textarea value={limits} onChange={(e) => { setLimits(e.target.value); setSaved(false); }} rows={3} />
        </label>
        <label>
          Nguồn tham khảo em tự tìm và kiểm chứng
          <textarea value={sources} onChange={(e) => { setSources(e.target.value); setSaved(false); }} rows={2} />
        </label>
        <div className="application-actions">
          <span className="application-progress">Đã điền {filled}/4 phần</span>
          <button type="button" className="btn primary" onClick={exportOutline} disabled={filled === 0}>
            Tải dàn ý về máy
          </button>
        </div>
        <p className="application-note" role="note">
          {saved
            ? "Đã tạo tệp .txt trên máy em."
            : "Dàn ý chỉ giữ trong phiên mở trang này. Trang chưa nộp bài cho giáo viên; hãy tải về và gửi qua kênh lớp đang dùng."}
        </p>
      </section>
    </div>
  );
}
