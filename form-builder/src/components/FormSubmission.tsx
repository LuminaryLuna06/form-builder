// src/FormSubmission.tsx
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
import { useEffect, useState } from "react";
import { FormData } from "../types/form";
// import { loadFormFromLocalStorage } from "../utils/localStorage";
import { useNavigate, useParams } from "react-router-dom";
import { DateInput } from "@mantine/dates";
import "dayjs/locale/vi";
import "@mantine/dates/styles.css";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // chỉnh lại nếu cần

export default function FormSubmission() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

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

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form || !id) return;

    setSubmitting(true);

    try {
      // Flatten tất cả câu hỏi từ các page
      const allQuestions = form.pages.flatMap((page) => page.elements);

      // Tạo responses theo Q1, Q2...
      const orderedResponses = allQuestions.reduce((acc, question, index) => {
        if (responses[question.id] !== undefined) {
          acc[`Q${index + 1}`] = {
            title: question.title || `(Untitled question)`,
            answer: responses[question.id],
            type: question.type,
          };
        }
        return acc;
      }, {} as Record<string, { title: string; answer: any; type: string }>);

      await addDoc(collection(db, "responses", id, "submissions"), {
        formTitle: form.title,
        responses: orderedResponses,
        createdAt: serverTimestamp(),
      });

      navigate(`/form-submitted/${id}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return <Text>Form not found!</Text>;

  return (
    <Container size="sm" py="xl">
      <LoadingOverlay visible={submitting} />
      <Title order={2} mb="lg">
        {form.title}
      </Title>

      <Stack>
        {form.pages.map((page, pageIndex) => (
          <Stack key={page.name} mb="xl">
            <Title order={3}>{page.title || `Trang ${pageIndex + 1}`}</Title>

            {page.elements.map((q) => (
              <Card key={q.id} withBorder shadow="xs" radius="md">
                <Stack>
                  <Text fw={500}>{q.title || "(Untitled question)"}</Text>

                  {q.type === "short_text" && (
                    <TextInput
                      placeholder="Your answer"
                      value={responses[q.id] || ""}
                      onChange={(e) =>
                        handleResponseChange(q.id, e.target.value)
                      }
                    />
                  )}

                  {q.type === "multiple_choice" && q.options && (
                    <Radio.Group
                      value={responses[q.id]}
                      onChange={(value) => handleResponseChange(q.id, value)}
                    >
                      <Stack>
                        {q.options.map((opt, idx) => (
                          <Radio
                            key={idx}
                            value={opt}
                            label={opt || `Option ${idx + 1}`}
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
                          label={opt || `Option ${idx + 1}`}
                          checked={responses[q.id]?.includes(opt) || false}
                          onChange={(e) => {
                            const newValue = e.currentTarget.checked
                              ? [...(responses[q.id] || []), opt]
                              : (responses[q.id] || []).filter(
                                  (v: string) => v !== opt
                                );
                            handleResponseChange(q.id, newValue);
                          }}
                        />
                      ))}
                    </Stack>
                  )}

                  {q.type === "rating" && (
                    <Group>
                      {Array.from({ length: q.ratingScale || 11 }, (_, idx) => (
                        <Box
                          key={idx}
                          onClick={() => handleResponseChange(q.id, idx)}
                          style={{
                            cursor: "pointer",
                            opacity: responses[q.id] >= idx ? 1 : 0.4,
                            transition: "opacity 0.2s",
                          }}
                        >
                          <Text size="xl">{q.ratingCharacter || "⭐"}</Text>
                          <Text size="xs" ta="center" c="dimmed">
                            {idx}
                          </Text>
                        </Box>
                      ))}
                    </Group>
                  )}

                  {q.type === "date" && (
                    <DateInput
                      placeholder="Select date (DD/MM/YYYY)"
                      valueFormat="DD/MM/YYYY"
                      locale="vi"
                      value={responses[q.id] ? new Date(responses[q.id]) : null}
                      onChange={(date) => {
                        if (date) {
                          const formatted = date.toISOString().split("T")[0];
                          handleResponseChange(q.id, formatted);
                        } else {
                          handleResponseChange(q.id, null);
                        }
                      }}
                      style={{ maxWidth: 200 }}
                    />
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        ))}

        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          Submit Form
        </Button>
      </Stack>
    </Container>
  );
}
