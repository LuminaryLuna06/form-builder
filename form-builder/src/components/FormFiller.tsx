import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Title,
  Stack,
  TextInput,
  Radio,
  Checkbox,
  Button,
} from "@mantine/core";
import { loadFormFromLocalStorage } from "../utils/localStorage";
import { FormData } from "../types/form";

export default function FormFiller() {
  const { id } = useParams();
  const [form, setForm] = useState<FormData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (id) {
      const form = loadFormFromLocalStorage(id);
      if (form) setForm(form);
    }
  }, [id]);

  const handleSubmit = () => {
    console.log("Câu trả lời người dùng:", answers);
    alert("Gửi thành công!");
    // Có thể save vào localStorage hoặc gửi API ở đây
  };

  if (!form) return <div>Không tìm thấy biểu mẫu</div>;

  return (
    <Container size="sm" py="xl">
      <Title order={2}>{form.title}</Title>

      <Stack>
        {form.questions.map((q) => (
          <div key={q.id}>
            <div>
              <strong>{q.title}</strong>
            </div>

            {q.type === "short_text" && (
              <TextInput
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [q.id]: e.target.value })
                }
                placeholder="Nhập câu trả lời..."
              />
            )}

            {q.type === "multiple_choice" && q.options && (
              <Radio.Group
                value={answers[q.id] || ""}
                onChange={(value) => setAnswers({ ...answers, [q.id]: value })}
              >
                <Stack>
                  {q.options.map((opt, idx) => (
                    <Radio key={idx} value={opt} label={opt} />
                  ))}
                </Stack>
              </Radio.Group>
            )}

            {q.type === "checkbox" && q.options && (
              <Stack>
                {q.options.map((opt, idx) => (
                  <Checkbox
                    key={idx}
                    label={opt}
                    checked={answers[q.id]?.includes(opt) || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const prev = answers[q.id] || [];
                      if (checked) {
                        setAnswers({ ...answers, [q.id]: [...prev, opt] });
                      } else {
                        setAnswers({
                          ...answers,
                          [q.id]: prev.filter((o: string) => o !== opt),
                        });
                      }
                    }}
                  />
                ))}
              </Stack>
            )}
          </div>
        ))}

        <Button onClick={handleSubmit} color="green">
          Gửi biểu mẫu
        </Button>
      </Stack>
    </Container>
  );
}
