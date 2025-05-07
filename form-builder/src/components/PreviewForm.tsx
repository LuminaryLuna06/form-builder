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
  Group,
  Box,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { FormData } from "../types/form";
// import { loadFormFromLocalStorage } from "../utils/localStorage";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { DateInput } from "@mantine/dates";
import "dayjs/locale/vi"; // Optional: for Vietnamese locale
import "@mantine/dates/styles.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // chỉnh lại nếu cần

export default function PreviewForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<FormData | null>(null);
  const [selectedRatings, setSelectedRatings] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, "forms", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as FormData;
          setForm(data);
        } else {
          console.warn("Form không tồn tại.");
        }
      } catch (error) {
        console.error("Lỗi khi tải form từ Firestore:", error);
      }
    };

    fetchForm();
  }, [id]);

  const handleRatingClick = (questionId: string, value: number) => {
    setSelectedRatings((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  if (!form) return <Text>Biểu mẫu không tồn tại!</Text>;

  return (
    <Container size="sm" py="xl" style={{ marginTop: -120 }}>
      <Button
        variant="outline"
        onClick={() => navigate(`/create-form/${id}`)}
        mb="lg"
      >
        ← Quay lại chỉnh sửa
      </Button>
      <Title order={2} mb="lg">
        {form?.title || "Xem trước biểu mẫu"}
      </Title>

      <Stack>
        {Array.isArray(form.pages) && form.pages.length === 0 && (
          <Text>Không có câu hỏi nào.</Text>
        )}

        {Array.isArray(form.pages) &&
          form.pages.map((page, pageIndex) => (
            <Stack key={page.name} mb="xl">
              {/* Tiêu đề và mô tả trang */}
              <Stack>
                <Title order={3}>
                  {page.title || `Trang ${pageIndex + 1}`}
                </Title>
                {page.description && (
                  <Text size="sm" c="dimmed">
                    {page.description}
                  </Text>
                )}
              </Stack>

              {/* Câu hỏi trong trang */}
              {page.elements.map((q) => (
                <Card key={q.id} withBorder shadow="xs" radius="md">
                  <Stack>
                    <Text fw={500}>
                      {q.title || "(Câu hỏi không có tiêu đề)"}
                    </Text>

                    {q.type === "short_text" && (
                      <TextInput placeholder="Nhập câu trả lời của bạn" />
                    )}

                    {q.type === "multiple_choice" && q.options && (
                      <Radio.Group>
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

                    {q.type === "rating" && (
                      <Group>
                        {Array.from(
                          { length: q.ratingScale || 11 },
                          (_, idx) => (
                            <Box
                              key={idx}
                              onClick={() => handleRatingClick(q.id, idx)}
                              style={{
                                cursor: "pointer",
                                opacity: selectedRatings[q.id] >= idx ? 1 : 0.4,
                                transition: "opacity 0.2s",
                              }}
                            >
                              <Text size="xl">{q.ratingCharacter || "⭐"}</Text>
                              <Text size="xs" ta="center" c="dimmed">
                                {idx}
                              </Text>
                            </Box>
                          )
                        )}
                      </Group>
                    )}

                    {q.type === "date" && (
                      <DateInput
                        placeholder="Vui lòng chọn ngày (ngày/tháng/năm)"
                        valueFormat="DD/MM/YYYY"
                        locale="vi"
                        style={{ maxWidth: 400 }}
                      />
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          ))}
      </Stack>
    </Container>
  );
}
