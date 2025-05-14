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
import { useForm, yupResolver } from "@mantine/form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import * as yup from "yup";

import { FormData, FormResponses } from "../types/form";
import { DateInput } from "@mantine/dates";
import "dayjs/locale/vi";
import dayjs from "dayjs";

const createValidationSchema = (formData: FormData | null) => {
  const schema: Record<string, yup.AnySchema> = {};

  formData?.pages?.forEach((page) => {
    page.elements.forEach((question) => {
      if (question.isRequired) {
        schema[question.id] = yup
          .mixed()
          .test("required", "This question is required", (value) => {
            if (question.type === "checkbox") {
              return Array.isArray(value) && value.length > 0;
            }
            return value !== undefined && value !== "" && value !== null;
          });
      }
    });
  });

  return yup.object().shape(schema);
};

export default function FormSubmissionTest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const form = useForm<FormResponses>({
    initialValues: {},
    validate: yupResolver(createValidationSchema(formData)),
  });

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, "forms", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as FormData;
          setFormData(data);

          const initialValues = data.pages
            .flatMap((page) => page.elements)
            .reduce((acc, question) => {
              acc[question.id] = question.type === "checkbox" ? [] : "";
              return acc;
            }, {} as Record<string, any>);
          form.setValues(initialValues);
        }
      } catch (error) {
        console.error("Lỗi khi tải form từ Firestore:", error);
      }
    };

    fetchForm();
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    if (!formData || !id) return;
    setSubmitting(true);

    try {
      // Flatten tất cả câu hỏi từ các page
      const allQuestions = formData.pages.flatMap((page) => page.elements);

      const orderedResponses = allQuestions
        .filter((q) => values[q.id] !== undefined)
        .map((q) => ({
          name: q.name,
          answer: values[q.id],
          type: q.type,
        }));

      // Convert to { name: answer } format
      const surveyResults = orderedResponses.reduce((acc, curr) => {
        acc[curr.name] = curr.answer;
        return acc;
      }, {} as Record<string, any>);

      await addDoc(collection(db, "responses", id, "submissions"), {
        formTitle: formData.title,
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

  if (!formData) return <Text>Form not found!</Text>;

  return (
    <Container size="sm" py="xl">
      <LoadingOverlay visible={submitting} />
      <Title order={2} mb="lg">
        {formData.title}
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {formData.pages.map((page, pageIndex) => (
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
                        {...form.getInputProps(q.id)}
                      />
                    )}

                    {q.type === "multiple_choice" && q.options && (
                      <Radio.Group {...form.getInputProps(q.id)}>
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
                      <Checkbox.Group {...form.getInputProps(q.id)}>
                        <Stack>
                          {q.options.map((opt, idx) => (
                            <Checkbox
                              key={idx}
                              value={opt}
                              label={opt || `Option ${idx + 1}`}
                            />
                          ))}
                        </Stack>
                      </Checkbox.Group>
                    )}

                    {q.type === "rating" && (
                      <Group>
                        {Array.from(
                          { length: q.ratingScale || 11 },
                          (_, idx) => {
                            const currentValue = form.values[q.id];
                            const numericValue =
                              typeof currentValue === "number"
                                ? currentValue
                                : typeof currentValue === "string"
                                ? parseInt(currentValue, 10)
                                : 0;
                            return (
                              <Box
                                key={idx}
                                onClick={() => form.setFieldValue(q.id, idx)}
                                style={{
                                  cursor: "pointer",
                                  opacity: numericValue >= idx ? 1 : 0.4,
                                  transition: "opacity 0.2s",
                                }}
                              >
                                <Text size="xl">
                                  {q.ratingCharacter || "⭐"}
                                </Text>
                                <Text size="xs" ta="center" c="dimmed">
                                  {idx}
                                </Text>
                              </Box>
                            );
                          }
                        )}
                      </Group>
                    )}

                    {q.type === "date" && (
                      <DateInput
                        placeholder="Select date (DD/MM/YYYY)"
                        valueFormat="DD/MM/YYYY"
                        locale="vi"
                        value={
                          form.values[q.id]
                            ? new Date(form.values[q.id] as string)
                            : null
                        }
                        onChange={(date) => {
                          try {
                            const value = date
                              ? dayjs(date).format("YYYY-MM-DD")
                              : null;
                            form.setFieldValue(q.id, value);
                          } catch (error) {
                            console.error("Date conversion error:", error);
                            form.setFieldValue(q.id, null);
                          }
                        }}
                        style={{ maxWidth: 200 }}
                      />
                    )}
                    {form.errors[q.id] && (
                      <Text size="sm" color="red">
                        {form.errors[q.id]}
                      </Text>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          ))}

          <Button size="lg" type="submit" loading={submitting}>
            Submit Form
          </Button>
        </Stack>
      </form>
    </Container>
  );
}
