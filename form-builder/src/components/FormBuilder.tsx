import { TextInput, Button, Container, Stack, Title } from "@mantine/core";
import { useState, useEffect } from "react";
import { Question, FormData } from "../types/form";
import QuestionItem from "./QuestionItem";
import {
  saveFormToLocalStorage,
  loadFormFromLocalStorage,
} from "../utils/localStorage";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";

export default function FormBuilder() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const saved = localStorage.getItem("form_" + id);
    if (saved) {
      const parsed: FormData = JSON.parse(saved);
      setTitle(parsed.title);
      setQuestions(parsed.questions || []);
    }
  }, [id]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: uuidv4(), type: "short_text", title: "" },
    ]);
  };

  const saveForm = () => {
    const formData = {
      title,
      questions,
      id: id || uuidv4(), // Dùng ID từ URL nếu có
    };

    saveFormToLocalStorage(formData); // Lưu form vào LocalStorage
    navigate(`/preview/${formData.id}`); // Điều hướng đến preview với ID
  };

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        Trình tạo biểu mẫu
      </Title>

      <Stack>
        <TextInput
          label="Tên biểu mẫu"
          placeholder="Nhập tiêu đề biểu mẫu..."
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />

        {Array.isArray(questions) &&
          questions.map((q, index) => (
            <QuestionItem
              key={q.id}
              question={q}
              onChange={(updated) => {
                const updatedQuestions = [...questions];
                updatedQuestions[index] = updated;
                setQuestions(updatedQuestions);
              }}
              onDelete={() => {
                setQuestions((prev) => prev.filter((_, i) => i !== index));
              }}
            />
          ))}

        <Button onClick={addQuestion}>+ Thêm câu hỏi</Button>

        <Button variant="light" color="green" onClick={saveForm}>
          💾 Lưu biểu mẫu
        </Button>

        <Button
          variant="outline"
          color="blue"
          onClick={() => {
            const formData = {
              title,
              questions,
              id: id || uuidv4(),
            };
            saveFormToLocalStorage(formData);
            navigate(`/preview/${formData.id}`);
          }}
        >
          Xem trước biểu mẫu
        </Button>
      </Stack>
    </Container>
  );
}
