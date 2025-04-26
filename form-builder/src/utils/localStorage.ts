// import { Question, FormData } from "../types/form";

// const FORM_KEY = "my_form_data";

// export function saveFormToLocalStorage(form: FormData) {
//   localStorage.setItem(FORM_KEY, JSON.stringify(form));
// }

// export function loadFormFromLocalStorage(): FormData | null {
//   try {
//     const data = localStorage.getItem(FORM_KEY);
//     return data ? JSON.parse(data) : null;
//   } catch (e) {
//     console.error("Lỗi khi đọc localStorage:", e);
//     return null;
//   }
// }

import { Question, FormData } from "../types/form";

// Lưu biểu mẫu theo ID
export function saveFormToLocalStorage(form: FormData) {
  if (!form.id) {
    console.error("Form must have an ID to be saved.");
    return;
  }
  localStorage.setItem("form_" + form.id, JSON.stringify(form));
}

// Tải biểu mẫu theo ID
export function loadFormFromLocalStorage(id: string): FormData | null {
  try {
    const data = localStorage.getItem("form_" + id);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Lỗi khi đọc localStorage:", e);
    return null;
  }
}
