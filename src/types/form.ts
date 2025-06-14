import { Timestamp } from "firebase/firestore";

export type QuestionType =
  | "short_text"
  | "multiple_choice"
  | "checkbox"
  | "rating"
  | "date";

export interface Question {
  id: string;
  type: QuestionType;
  name: string;
  description?: string;
  title: string;
  options?: string[];
  correctAnswers?: number[];
  ratingCharacter?: string;
  ratingScale?: number;
  isRequired?: boolean;
  isScored?: boolean;
  score?: number;
  allowOtherAnswer?: boolean;
}

export interface Page {
  name: string;
  title?: string;
  description?: string;
  elements: Question[];
}

export type FormData = {
  id: string;
  title: string;
  pages: Page[];
  isQuiz: boolean;
  userUID: string;
};

export type FormResponses = Record<
  string,
  string | string[] | number | Date | null
>;

export type ResponseData = {
  id: string;
  createdAt: Timestamp;
  responses: FormResponses;
  totalScore: number;
  formTitle: string;
};
