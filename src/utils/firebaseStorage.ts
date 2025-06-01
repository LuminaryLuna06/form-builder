import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { FormData } from "../types/form";

// Lưu biểu mẫu vào Firestore
export async function saveFormToFirestore(form: FormData): Promise<void> {
  if (!form.id) {
    console.error("Form must have an ID to be saved.");
    return;
  }

  try {
    await setDoc(doc(db, "forms", form.id), form);
    console.log("Form saved to Firestore.");
  } catch (e) {
    console.error("Lỗi khi lưu form vào Firestore:", e);
  }
}

// Tải biểu mẫu từ Firestore theo ID
export async function loadFormFromFirestore(
  id: string
): Promise<FormData | null> {
  try {
    const docRef = doc(db, "forms", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as FormData;
    } else {
      console.warn("Không tìm thấy form với ID:", id);
      return null;
    }
  } catch (e) {
    console.error("Lỗi khi tải form từ Firestore:", e);
    return null;
  }
}
