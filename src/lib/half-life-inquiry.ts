/** B23 inquiry configuration and deterministic transition logic. No rendering or storage. */
export type InquiryAction = "rotate" | "accessible_observation" | "observe_2t" | "change_half_life" | "repeat" | "measure";
export type InquiryOption = { id: string; text: string };
export type InquiryQuestion = {
  id: string;
  prompt: string;
  options: readonly InquiryOption[];
  correct: string;
  feedback: string;
  /** A physical interaction required before this question can be answered. */
  requires?: InquiryAction;
  actionPrompt?: string;
  misconceptions?: Readonly<Record<string, string>>;
};
export type InquiryTask = {
  id: string;
  title: string;
  objective: string;
  prerequisite: string;
  background: string;
  action: string;
  observation: string;
  completion: string;
  hints: readonly [string, string, string];
  questions: readonly InquiryQuestion[];
};

export const INQUIRY_TASKS: readonly InquiryTask[] = [
  {
    id: "observe", title: "Quan sát mẫu hạt nhân",
    objective: "Phân biệt hình minh họa với thời điểm phân rã của từng hạt.", prerequisite: "Bắt đầu hoạt động.",
    background: "Mỗi điểm là một hạt nhân mẹ trong mẫu giả định.", action: "Xoay mẫu để quan sát từ góc khác hoặc đọc mô tả thay thế khi không có WebGL.", observation: "Góc nhìn đổi, trạng thái phân rã không đổi.",
    completion: "Trả lời hai câu và xoay mẫu hoặc xác nhận đã đọc mô tả thay thế.",
    hints: ["Hãy xem cùng một mẫu từ góc nhìn khác.", "Đổi góc nhìn có làm thay đổi tuổi thọ được lấy ngẫu nhiên không?", "Mô hình biểu diễn từng hạt, nhưng không tiên đoán thời điểm phân rã của một hạt thật."],
    questions: [
      { id: "individual", prompt: "Có thể biết chính xác một hạt nhân phóng xạ thật sẽ phân rã lúc nào không?", options: [{id:"yes",text:"Có, nếu biết chu kì bán rã"},{id:"no",text:"Không, chỉ có thể mô tả xác suất"}], correct:"no", feedback:"Đúng: phân rã của từng hạt có tính ngẫu nhiên." },
      { id: "rotation", prompt: "Nếu đổi góc nhìn của mẫu, điều gì thay đổi?", options: [{id:"view",text:"Góc nhìn mẫu"},{id:"decay",text:"Thời điểm phân rã của các hạt"}], correct:"view", requires:"rotate", actionPrompt:"Hãy xoay mẫu và quan sát lại, hoặc đọc và xác nhận mô tả thay thế nếu WebGL không khả dụng.", feedback:"Góc nhìn đổi không thay đổi kết quả vật lí." },
    ],
  },
  {
    id:"predict", title:"Dự đoán sau hai chu kì", objective:"Dự đoán và giải thích tỉ lệ kỳ vọng còn lại sau 2T.", prerequisite:"Hoàn thành quan sát.",
    background:"Sau mỗi chu kì, số hạt mẹ còn lại theo kì vọng giảm một nửa so với đầu khoảng đó.", action:"Chạy đến ít nhất 2T và quan sát hai mốc.", observation:"So sánh giá trị một lượt và giá trị kỳ vọng tại T, 2T.", completion:"Trả lời hai câu và quan sát đủ 2T.",
    hints:["So sánh hai khoảng liên tiếp, mỗi khoảng dài T.","Sau T còn một nửa ban đầu theo kỳ vọng; khoảng tiếp theo bắt đầu với lượng còn lại đó.","Một nửa của một nửa là một phần tư; một lượt riêng có thể khác."],
    questions:[
      {id:"two_periods",prompt:"Theo kì vọng, sau hai chu kì bán rã còn bao nhiêu phần trăm số hạt ban đầu?", options:[{id:"100",text:"100%"},{id:"50",text:"50%"},{id:"25",text:"25%"},{id:"12.5",text:"12,5%"}],correct:"25", feedback:"Đúng: kì vọng lần lượt là 1/2 rồi 1/4 ban đầu.", misconceptions:{"50":"Hãy so sánh số hạt sau chu kì thứ nhất và thứ hai: ở chu kì thứ hai, số hạt giảm một nửa so với số lượng nào? Em có thể điều chỉnh dự đoán."}},
      {id:"reference",prompt:"Ở chu kì thứ hai, mức giảm một nửa tính so với lượng nào?", options:[{id:"initial",text:"Lượng ban đầu"},{id:"remaining",text:"Lượng còn lại ở đầu chu kì thứ hai"}],correct:"remaining",requires:"observe_2t", actionPrompt:"Hãy chạy đến 2T và so sánh số liệu ở T và 2T.",feedback:"Mỗi chu kì tính trên lượng còn lại ở đầu khoảng đó."},
    ],
  },
  {
    id:"measure",title:"Đo và so sánh",objective:"Phân biệt dữ liệu một lượt với đường kỳ vọng.",prerequisite:"Hoàn thành dự đoán.",background:"Lượt thử là một mẫu ngẫu nhiên hữu hạn.",action:"Đo số hạt ở một mốc trên đồ thị.",observation:"Đọc số thực tế và giá trị kỳ vọng tại cùng thời điểm.",completion:"Có hành động đo và trả lời hai câu.",
    hints:["Đọc cả hai số tại cùng một thời điểm.","Đường lí thuyết là giá trị trung bình dự kiến qua nhiều mẫu.","Một lượt có thể lệch kỳ vọng vì từng hạt phân rã ngẫu nhiên."],
    questions:[
      {id:"expectation",prompt:"Đường lí thuyết biểu diễn đại lượng nào?",options:[{id:"expected",text:"Giá trị kỳ vọng của số hạt còn lại"},{id:"exact",text:"Kết quả chính xác bắt buộc của mọi lượt"}],correct:"expected",feedback:"Đường lí thuyết là kỳ vọng, không ép từng lượt khớp."},
      {id:"difference",prompt:"Nếu số đo mô phỏng khác đường lí thuyết, giải thích nào phù hợp?",options:[{id:"random",text:"Dao động ngẫu nhiên của mẫu hữu hạn"},{id:"invalid",text:"Luôn chứng tỏ định luật sai"}],correct:"random",requires:"measure",actionPrompt:"Hãy chọn một mốc thời gian và đo hai giá trị.",feedback:"Sai khác có thể do dao động ngẫu nhiên của mẫu."},
    ],
  },
  {
    id:"compare",title:"So sánh chu kì",objective:"Khảo sát ảnh hưởng của T khi giữ các điều kiện so sánh.",prerequisite:"Hoàn thành phép đo.",background:"Giữ N₀ và thời điểm t > 0 khi so sánh.",action:"Thay chu kì bán rã và quan sát lại.",observation:"So sánh kỳ vọng tại cùng N₀ và thời gian.",completion:"Thay tham số và trả lời hai câu.",
    hints:["Giữ N₀ và thời gian như cũ.","T lớn hơn nghĩa là cùng một thời gian tương ứng ít chu kì hơn.","Theo kỳ vọng, T lớn hơn cho số hạt còn lại lớn hơn tại cùng t > 0."],
    questions:[
      {id:"control",prompt:"Muốn tìm ảnh hưởng của T, nên giữ đại lượng nào như nhau?",options:[{id:"fixed",text:"N₀ và thời điểm quan sát"},{id:"none",text:"Thay đồng thời N₀, T và thời điểm"}],correct:"fixed",feedback:"Giữ các điều kiện khác giúp so sánh ảnh hưởng của T."},
      {id:"larger_t",prompt:"Tại cùng N₀ và t > 0, T lớn hơn làm giá trị kỳ vọng còn lại thế nào?",options:[{id:"more",text:"Lớn hơn"},{id:"less",text:"Nhỏ hơn"}],correct:"more",requires:"change_half_life",actionPrompt:"Hãy thay chu kì bán rã rồi so sánh tại cùng thời điểm.",feedback:"T lớn hơn tương ứng phân rã chậm hơn theo kỳ vọng."},
    ],
  },
  {
    id:"repeat",title:"Lặp lại và vận dụng",objective:"Dùng các lượt lặp giải thích giới hạn của kết quả một mẫu.",prerequisite:"Hoàn thành so sánh chu kì.",background:"Seed khác tạo lượt ngẫu nhiên có thể khác; cùng seed và tham số tái lập lượt cũ.",action:"Chạy lại với seed khác và đo.",observation:"So sánh các lượt tại cùng điều kiện.",completion:"Chạy lặp và trả lời hai câu giải thích.",
    hints:["So sánh các lượt tại cùng thời điểm và tham số.","Một lượt là một kết quả trong phân bố các kết quả có thể.","Đừng kết luận mô hình sai chỉ vì một mẫu không bằng kỳ vọng."],
    questions:[
      {id:"repeat_reason",prompt:"Vì sao cần chạy nhiều lượt với seed khác?",options:[{id:"variability",text:"Quan sát sự biến thiên giữa các mẫu"},{id:"force",text:"Ép từng lượt về đúng đường lý thuyết"}],correct:"variability",feedback:"Các lượt độc lập cho thấy độ biến thiên của kết quả."},
      {id:"apply",prompt:"Mẫu 64 hạt, sau 2T một lượt còn 19 hạt thay vì 16. Kết luận nào hợp lí?",options:[{id:"possible",text:"19 là kết quả có thể; 16 là giá trị kỳ vọng"},{id:"impossible",text:"Không thể xảy ra vì mọi lượt phải còn 16"}],correct:"possible",requires:"repeat",actionPrompt:"Hãy chạy lại với seed khác rồi so sánh các lượt.",feedback:"16 là kì vọng, 19 có thể xuất hiện trong một lượt hữu hạn."},
    ],
  },
];

export type InquiryAttempt = { questionId: string; answerId: string; correct: boolean };
export type InquiryState = {
  version: 1;
  taskIndex: number;
  questionIndex: number;
  actions: InquiryAction[];
  attempts: InquiryAttempt[];
  hintsUsed: Record<string, number>;
  feedback: string;
};
export type InquiryPrompt = { task: InquiryTask; question: InquiryQuestion; blocked: boolean } | null;

export function createInquiryState(): InquiryState {
  return { version: 1, taskIndex: 0, questionIndex: 0, actions: [], attempts: [], hintsUsed: {}, feedback: "" };
}
export function getInquiryPrompt(state: InquiryState): InquiryPrompt {
  const task = INQUIRY_TASKS[state.taskIndex];
  const question = task?.questions[state.questionIndex];
  if (!task || !question) return null;
  const requirementMet = !question.requires || state.actions.includes(question.requires) ||
    (question.requires === "rotate" && state.actions.includes("accessible_observation"));
  return { task, question, blocked: !requirementMet };
}
export function recordInquiryAction(state: InquiryState, action: InquiryAction): InquiryState {
  return { ...state, actions: state.actions.includes(action) ? state.actions : [...state.actions, action] };
}
export function requestInquiryHint(state: InquiryState): { state: InquiryState; hint: string } {
  const prompt = getInquiryPrompt(state);
  if (!prompt) return { state, hint: "Hoạt động đã hoàn thành." };
  const level = Math.min(state.hintsUsed[prompt.task.id] ?? 0, 2);
  return { state: { ...state, hintsUsed: { ...state.hintsUsed, [prompt.task.id]: level + 1 } }, hint: prompt.task.hints[level] };
}
export function answerInquiryQuestion(state: InquiryState, questionId: string, answerId: string): InquiryState {
  const prompt = getInquiryPrompt(state);
  if (!prompt || prompt.blocked || prompt.question.id !== questionId || !prompt.question.options.some(option => option.id === answerId)) return state;
  const correct = answerId === prompt.question.correct;
  const attempts = [...state.attempts, { questionId, answerId, correct }];
  if (!correct) {
    const feedback = prompt.question.misconceptions?.[answerId] ?? "Hãy xem lại điều kiện và thử giải thích theo dữ liệu; em có thể dùng gợi ý.";
    const wrongAttempts = attempts.filter(attempt => attempt.questionId === questionId && !attempt.correct).length;
    const hintsUsed = state.hintsUsed[prompt.task.id] ?? 0;
    // A first incorrect prediction receives its own scaffold; further difficulty
    // reveals at most one new hint per attempt, up to the three configured levels.
    if (wrongAttempts >= 2 && hintsUsed < prompt.task.hints.length) {
      return { ...state, attempts, hintsUsed: { ...state.hintsUsed, [prompt.task.id]: hintsUsed + 1 }, feedback: `${feedback} Gợi ý ${hintsUsed + 1}: ${prompt.task.hints[hintsUsed]}` };
    }
    return { ...state, attempts, feedback };
  }
  const lastQuestion = state.questionIndex + 1 >= prompt.task.questions.length;
  return { ...state, attempts, feedback: prompt.question.feedback,
    taskIndex: lastQuestion ? state.taskIndex + 1 : state.taskIndex,
    questionIndex: lastQuestion ? 0 : state.questionIndex + 1 };
}
