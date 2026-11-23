"use client";

/**
 * Phòng đóng vai: chọn vai, đọc lập luận mẫu, ghi phản biện của nhóm,
 * và tự đối chiếu với tiêu chí đánh giá. Nội dung tải được về máy để nộp.
 */

import { useState } from "react";
import { RichPhysicsText } from "./RichPhysicsText";

type Persona = {
  id: string;
  role: string;
  stance: string;
  arguments: string[];
  question: string;
};

const SITUATION =
  "Chính quyền địa phương đang cân nhắc xây dựng một nhà máy điện hạt nhân. Các nhóm đại diện cho những quan điểm khác nhau trong xã hội, chuẩn bị tranh biện và bảo vệ quan điểm bằng kiến thức Vật lí đã học.";

const PERSONAS: Persona[] = [
  {
    id: "scientist",
    role: "Nhà khoa học Vật lí hạt nhân",
    stance: "Hiệu suất năng lượng liên kết và cơ chế tự ổn định của lò phản ứng nước áp lực.",
    arguments: [
      "Mật độ năng lượng hạt nhân vượt trội: phân hạch hoàn toàn 1 kg U-235 giải phóng năng lượng tương đương khoảng 2,7 triệu kg than đá, không phát thải CO₂.",
      "Thanh điều khiển chứa Boron hoặc Cadmium giữ hệ số nhân neutron k = 1; hệ số phản hồi nhiệt độ âm giúp lò tự giảm công suất khi quá nóng.",
      "Che chắn nhiều lớp bằng bê tông cốt thép và chì ngăn tia gamma và neutron thoát ra ngoài.",
    ],
    question: "Vì sao nhiên liệu làm giàu 3–5% không thể gây nổ hạt nhân như vũ khí?",
  },
  {
    id: "resident",
    role: "Người dân địa phương",
    stance: "Yêu cầu minh bạch về quan trắc phóng xạ và vùng đệm an toàn.",
    arguments: [
      "Cần giám sát nguy cơ rò rỉ các đồng vị như I-131 (T = 8 ngày) và Cs-137 (T ≈ 30 năm) đối với nguồn nước và nông sản.",
      "Đề nghị công khai số đo từ các trạm quan trắc phóng xạ quanh khu dân cư theo thời gian thực.",
      "Vùng an toàn nên dựa trên quy luật giảm cường độ bức xạ theo bình phương khoảng cách.",
    ],
    question: "Những chỉ số an toàn bức xạ nào cần được công khai hàng ngày cho cộng đồng?",
  },
  {
    id: "economist",
    role: "Chuyên gia kinh tế và năng lượng",
    stance: "Đánh giá nguồn điện nền ổn định và chi phí nhiên liệu dài hạn.",
    arguments: [
      "Điện hạt nhân cung cấp công suất nền liên tục với hệ số khả dụng cao, không phụ thuộc thời tiết như điện gió hay mặt trời.",
      "Vốn đầu tư ban đầu lớn, nhưng chi phí nhiên liệu chiếm tỉ trọng nhỏ nên giá điện ổn định trong chu kì vận hành dài.",
      "Kéo theo phát triển công nghệ đồng vị phóng xạ cho y tế và chiếu xạ nông sản xuất khẩu.",
    ],
    question: "Nhà máy 1000 MW (hiệu suất 33%) cần bao nhiêu kg U-235 mỗi năm?",
  },
  {
    id: "environmentalist",
    role: "Chuyên gia môi trường",
    stance: "So sánh phát thải khí nhà kính và bài toán lưu trữ chất thải dài hạn.",
    arguments: [
      "Xét toàn vòng đời, phát thải CO₂ của điện hạt nhân rất thấp so với điện than và khí.",
      "Thách thức chính là đóng rắn và lưu trữ địa chất sâu đối với nhiên liệu đã qua sử dụng chứa đồng vị sống hàng nghìn năm.",
      "Cần kiểm soát chênh lệch nhiệt độ nước làm mát trước khi hoàn trả ra môi trường.",
    ],
    question: "Vì sao cần cô lập chất thải vài chu kì bán rã dài trước khi coi là an toàn?",
  },
];

const CRITERIA = [
  "Lập luận đúng khoa học: giải thích cơ chế, không khẳng định lợi ích hay rủi ro tuyệt đối.",
  "Bằng chứng truy nguyên được: ghi nguồn cho từng nhận định, phân biệt dữ kiện với giả định.",
  "Nêu giới hạn: điều kiện để đạt lợi ích, rủi ro cần kiểm soát, điều chưa có dữ liệu.",
  "Phản biện và tự điều chỉnh: trả lời câu hỏi của vai khác bằng căn cứ, nêu điều cần kiểm chứng.",
];

export function RolePlayStudio() {
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const [claim, setClaim] = useState("");
  const [evidence, setEvidence] = useState("");
  const [limit, setLimit] = useState("");
  const [response, setResponse] = useState("");
  const [checkedCriteria, setCheckedCriteria] = useState<Record<number, boolean>>({});

  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const doneCount = CRITERIA.filter((_, i) => checkedCriteria[i]).length;
  const canExport = Boolean(claim.trim() || evidence.trim());

  function exportBrief() {
    const lines = [
      "BIÊN BẢN ĐÓNG VAI",
      "",
      "Tình huống: " + SITUATION,
      "",
      `Vai nhóm đảm nhận: ${persona.role}`,
      `Lập trường: ${persona.stance}`,
      "",
      "1. Nhận định của nhóm",
      claim || "(chưa ghi)",
      "",
      "2. Bằng chứng và nguồn",
      evidence || "(chưa ghi)",
      "",
      "3. Giới hạn và điều kiện",
      limit || "(chưa ghi)",
      "",
      "4. Phản biện và trả lời vai khác",
      response || "(chưa ghi)",
      "",
      `Tự đối chiếu tiêu chí: ${doneCount}/${CRITERIA.length} mục được đánh dấu.`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dong-vai-${persona.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="roleplay-studio">
      <section className="roleplay-situation">
        <h2>Tình huống giả định</h2>
        <p>{SITUATION}</p>
        <p className="roleplay-disclaimer">
          Đây là tình huống dựng cho việc học, không phải dự án có thật. Mọi con số nêu ra
          phải là dữ kiện hoặc nguồn em kiểm chứng được — không tự dựng số liệu.
        </p>
      </section>

      <section className="roleplay-roles" aria-labelledby="roleplay-roles-title">
        <h2 id="roleplay-roles-title">Chọn vai của nhóm</h2>
        <div className="roleplay-role-grid">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.id === persona.id ? "roleplay-role is-active" : "roleplay-role"}
              aria-pressed={p.id === persona.id}
              onClick={() => setPersonaId(p.id)}
            >
              <strong>{p.role}</strong>
              <span>{p.stance}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="roleplay-brief" aria-labelledby="roleplay-brief-title">
        <h2 id="roleplay-brief-title">Gợi ý lập luận cho vai {persona.role}</h2>
        <ul>
          {persona.arguments.map((arg) => (
            <li key={arg}>
              <RichPhysicsText content={arg} compact />
            </li>
          ))}
        </ul>
        <p className="roleplay-question">
          <strong>Câu hỏi then chốt:</strong> {persona.question}
        </p>
        <p className="roleplay-note">
          Các gợi ý trên là mẫu để tham khảo. Nhóm cần tự kiểm tra lại số liệu, ghi nguồn và
          bổ sung quan điểm riêng; không chép nguyên văn.
        </p>
      </section>

      <section className="roleplay-worksheet" aria-labelledby="roleplay-worksheet-title">
        <h2 id="roleplay-worksheet-title">Biên bản của nhóm</h2>
        <label>
          1. Nhận định chính của nhóm
          <textarea
            rows={3}
            value={claim}
            maxLength={3000}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Nhóm đồng ý hay phản đối, và vì sao — nêu ngắn gọn."
          />
        </label>
        <label>
          2. Bằng chứng và nguồn
          <textarea
            rows={4}
            value={evidence}
            maxLength={3000}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Mỗi nhận định nên kèm công thức, số liệu hoặc nguồn cụ thể."
          />
        </label>
        <label>
          3. Giới hạn và điều kiện
          <textarea
            rows={3}
            value={limit}
            maxLength={3000}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Lợi ích đạt được khi nào? Rủi ro nào cần kiểm soát?"
          />
        </label>
        <label>
          4. Phản biện vai khác
          <textarea
            rows={3}
            value={response}
            maxLength={3000}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Vai khác có thể phản biện thế nào, nhóm trả lời ra sao?"
          />
        </label>
      </section>

      <section className="roleplay-criteria" aria-labelledby="roleplay-criteria-title">
        <h2 id="roleplay-criteria-title">Tự đối chiếu tiêu chí ({doneCount}/{CRITERIA.length})</h2>
        <ul>
          {CRITERIA.map((criterion, i) => (
            <li key={criterion}>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(checkedCriteria[i])}
                  onChange={(e) =>
                    setCheckedCriteria((prev) => ({ ...prev, [i]: e.target.checked }))
                  }
                />
                <span>{criterion}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="roleplay-note">
          Đây là bảng tự đối chiếu, không phải điểm chính thức. Giáo viên dùng biên bản để góp
          ý và ghi nhận nội dung cần sửa.
        </p>
      </section>

      <div className="roleplay-actions">
        <button type="button" className="btn primary" disabled={!canExport} onClick={exportBrief}>
          Tải biên bản về máy
        </button>
        <span className="roleplay-save-note">
          Nội dung chỉ giữ trong phiên mở này — tải về trước khi đóng trang.
        </span>
      </div>
    </div>
  );
}
