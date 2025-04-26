import {
  Card,
  Text,
  TextInput,
  Radio,
  Checkbox,
  Stack,
  Title,
  Container,
  Button,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { FormData } from "../types/form";
import { loadFormFromLocalStorage } from "../utils/localStorage";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function PreviewForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<FormData | null>(null);

  useEffect(() => {
    if (!id) return;

    const saved = loadFormFromLocalStorage(id);
    if (saved) {
      setForm(saved);
    }
  }, [id]);
  if (!form) return <Text>Biểu mẫu không tồn tại!</Text>;

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        {form?.title || "Xem trước biểu mẫu"}
      </Title>

      <Stack>
        {Array.isArray(form.questions) && form.questions.length === 0 && (
          <Text>Không có câu hỏi nào.</Text>
        )}

        {Array.isArray(form.questions) &&
          form.questions.map((q) => (
            <Card key={q.id} withBorder shadow="xs" radius="md">
              <Stack>
                <Text fw={500}>{q.title || "(Câu hỏi không có tiêu đề)"}</Text>

                {q.type === "short_text" && (
                  <TextInput placeholder="Nhập câu trả lời..." />
                )}

                {q.type === "multiple_choice" && q.options && (
                  <Radio.Group name={q.id}>
                    <Stack>
                      {q.options.map((opt, idx) => (
                        <Radio
                          key={idx}
                          value={opt}
                          label={opt || `Lựa chọn ${idx + 1}`}
                        />
                      ))}
                    </Stack>
                  </Radio.Group>
                )}

                {q.type === "checkbox" && q.options && (
                  <Stack>
                    {q.options.map((opt, idx) => (
                      <Checkbox
                        key={idx}
                        label={opt || `Tuỳ chọn ${idx + 1}`}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          ))}

        <Button
          variant="outline"
          onClick={() => navigate(`/create-form/${id}`)}
        >
          ← Quay lại chỉnh sửa
        </Button>
      </Stack>
    </Container>
  );
}
