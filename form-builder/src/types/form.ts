export type QuestionType =
  | "short_text"
  | "multiple_choice"
  | "checkbox"
  | "rating"
  | "date";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[]; // Chỉ dùng nếu là multiple_choice hoặc checkbox
  ratingCharacter?: string; // Chỉ dùng nếu là rating
  ratingScale?: number; // Add this line
}
export type FormData = {
  id: string;
  title: string;
  questions: Question[];
};
