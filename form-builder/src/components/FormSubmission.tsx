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
import { useNavigate, useParams } from "react-router-dom";
import { DateInput } from "@mantine/dates";
import "dayjs/locale/vi";
import "@mantine/dates/styles.css";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
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
      const errors: string[] = [];

      // Validate required questions
      form.pages.forEach((page) => {
        page.elements.forEach((q) => {
          if (q.isRequired) {
            const answer = responses[q.id]; // Access the answer by question ID
            const isEmpty =
              answer === undefined ||
              answer === "" ||
              (Array.isArray(answer) && answer.length === 0);

            if (isEmpty) {
              errors.push(`Bạn chưa trả lời câu hỏi: ${q.title}`);
            }
          }
        });
      });

      if (errors.length > 0) {
        alert(errors.join("\n")); // Show all errors in an alert
        setSubmitting(false);
        return;
      }
      // Flatten tất cả câu hỏi từ các page
      const allQuestions = form.pages.flatMap((page) => page.elements);

      const orderedResponses = allQuestions
        .filter((q) => responses[q.id] !== undefined)
        .map((q) => ({
          name: q.name,
          answer: responses[q.id],
          type: q.type,
        }));

      // Convert to { name: answer } format
      const surveyResults = orderedResponses.reduce((acc, curr) => {
        (acc as Record<string, any>)[curr.name] = curr.answer;
        return acc;
      }, {});

      await addDoc(collection(db, "responses", id, "submissions"), {
        formTitle: form.title,
        responses: surveyResults,
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
            <Group mt="xs">
              <Text size="sm" color="red" fw={500}>
                *
              </Text>
              <Text size="sm" color="white">
                Is Required
              </Text>
            </Group>
            {page.elements.map((q) => (
              <Card key={q.id} withBorder shadow="xs" radius="md">
                <Stack>
                  <Group align="center">
                    <Text fw={500}>{q.title || "(Untitled question)"}</Text>
                    {q.isRequired && (
                      <Text size="md" color="red" fw={500}>
                        *
                      </Text>
                    )}
                  </Group>

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
