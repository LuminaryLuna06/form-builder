export type QuestionType = "short_text" | "multiple_choice" | "checkbox";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[]; // Chỉ dùng nếu là multiple_choice hoặc checkbox
}
export type FormData = {
  id: string;
  title: string;
  questions: Question[];
};
