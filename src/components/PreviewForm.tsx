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
  LoadingOverlay,
} from "@mantine/core";
import { useState } from "react";
import { FormData } from "../types/form";
import { useNavigate, useParams } from "react-router-dom";
import { DateInput } from "@mantine/dates";
import "dayjs/locale/vi";
import "@mantine/dates/styles.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useQuery } from "@tanstack/react-query";

const fetchFormData = async (id: string) => {
  const docRef = doc(db, "forms", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Form not found");
  }

  return docSnap.data() as FormData;
};

export default function PreviewForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedRatings, setSelectedRatings] = useState<
    Record<string, number>
  >({});

  const {
    data: form,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["form", id],
    queryFn: () => fetchFormData(id!),
    enabled: !!id,
  });

  const handleRatingClick = (questionId: string, value: number) => {
    setSelectedRatings((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  if (isLoading) {
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay visible />
      </Box>
    );
  }

  if (error || !form) {
    return (
      <Container size="sm" py="xl">
        <Text c="red" size="lg" ta="center">
          {error instanceof Error ? error.message : "Form not found!"}
        </Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl" style={{ marginTop: 0 }}>
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
                    <Stack gap={2}>
                      <Text fw={500} size="lg">
                        {q.title || "(Câu hỏi không có tiêu đề)"}
                      </Text>
                      <Text>{q.description || ""}</Text>
                    </Stack>

                    {q.type === "short_text" && (
                      <TextInput
                        placeholder="Nhập câu trả lời của bạn"
                        disabled
                      />
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
                          {q.allowOtherAnswer && (
                            <Group align="center">
                              <Radio value="other" label="Khác" />
                              <TextInput
                                placeholder="Vui lòng nêu rõ"
                                disabled
                              />
                            </Group>
                          )}
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
                        {q.allowOtherAnswer && (
                          <Group align="center">
                            <Checkbox value="other" label="Khác" />
                            <TextInput placeholder="Vui lòng nêu rõ" disabled />
                          </Group>
                        )}
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
                        disabled
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
