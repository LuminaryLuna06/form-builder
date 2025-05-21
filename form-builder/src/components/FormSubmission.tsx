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
          .test("required", "This question is required", (value: unknown) => {
            if (question.type === "checkbox") {
              return Array.isArray(value) && value.length > 0;
            }
            if (question.type === "multiple_choice") {
              return typeof value === "string" && value.trim() !== "";
            }
            return value !== undefined && value !== "" && value !== null;
          });
      }
    });
  });

  return yup.object().shape(schema);
};

// Fisher-Yates shuffle algorithm with explicit type
const shuffleArray = (array: string[]): string[] => {
  if (!array || !Array.isArray(array)) return [];
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function FormSubmission() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [otherSelected, setOtherSelected] = useState<Record<string, boolean>>(
    {}
  );
  const [shuffledOptions, setShuffledOptions] = useState<
    Record<string, { options: string[]; indexMap: Record<number, number> }>
  >({});

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

          // Initialize form values
          const initialValues = data.pages
            .flatMap((page) => page.elements)
            .reduce((acc: FormResponses, question) => {
              acc[question.id] = question.type === "checkbox" ? [] : "";
              if (question.allowOtherAnswer) {
                acc[question.id + "_other"] = "";
              }
              return acc;
            }, {} as FormResponses);
          form.setValues(initialValues);

          // Initialize otherSelected
          const otherSelectedInit = data.pages
            .flatMap((page) => page.elements)
            .reduce((acc, question) => {
              if (question.allowOtherAnswer) {
                acc[question.id] = false;
              }
              return acc;
            }, {} as Record<string, boolean>);
          setOtherSelected(otherSelectedInit);

          // Shuffle options for quiz mode
          if (data.isQuiz) {
            const shuffled = data.pages
              .flatMap((page) => page.elements)
              .reduce((acc, question) => {
                if (
                  (question.type === "multiple_choice" ||
                    question.type === "checkbox") &&
                  question.options &&
                  Array.isArray(question.options)
                ) {
                  const shuffledOptions = shuffleArray(question.options);
                  const indexMap: Record<number, number> = {};
                  question.options.forEach((opt, originalIndex) => {
                    const shuffledIndex = shuffledOptions.indexOf(opt);
                    if (shuffledIndex >= 0) {
                      indexMap[shuffledIndex] = originalIndex;
                    }
                  });
                  acc[question.id] = { options: shuffledOptions, indexMap };
                }
                return acc;
              }, {} as Record<string, { options: string[]; indexMap: Record<number, number> }>);
            setShuffledOptions(shuffled);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải form từ Firestore:", error);
      }
    };

    fetchForm();
  }, [id]);

  const handleSubmit = async (values: FormResponses) => {
    if (!formData || !id) return;
    setSubmitting(true);

    try {
      const allQuestions = formData.pages.flatMap((page) => page.elements);

      let totalPossibleScore = 0;
      let userScore = 0;

      const orderedResponses = allQuestions
        .filter((q) => values[q.id] !== undefined)
        .map((q) => {
          let answer = values[q.id];
          let isCorrect = false;

          // Handle "other" for checkbox and multiple_choice
          if (
            q.type === "checkbox" &&
            q.allowOtherAnswer &&
            Array.isArray(answer) &&
            answer.includes("other")
          ) {
            answer = answer.filter((val) => val !== "other");
            if (values[q.id + "_other"]) {
              answer = [...answer, values[q.id + "_other"] as string];
            }
          } else if (
            q.type === "multiple_choice" &&
            q.allowOtherAnswer &&
            answer === "other" &&
            values[q.id + "_other"]
          ) {
            answer = values[q.id + "_other"] as string;
          }

          // Scoring logic
          if (
            q.correctAnswers &&
            q.correctAnswers.length > 0 &&
            formData.isQuiz
          ) {
            const questionScore = q.score ?? 1;
            totalPossibleScore += questionScore;

            if (q.type === "multiple_choice" && typeof answer === "string") {
              const shuffledData = shuffledOptions[q.id];
              if (shuffledData && q.options) {
                const selectedIndex = shuffledData.options.indexOf(answer);
                const originalIndex =
                  selectedIndex >= 0
                    ? shuffledData.indexMap[selectedIndex]
                    : -1;
                if (
                  q.correctAnswers[0] !== undefined &&
                  originalIndex === q.correctAnswers[0]
                ) {
                  isCorrect = true;
                  userScore += questionScore;
                }
              }
            } else if (q.type === "checkbox" && Array.isArray(answer)) {
              if (q.options && shuffledOptions[q.id]) {
                const shuffledData = shuffledOptions[q.id];
                const originalAnswerIndices = answer
                  .map((ans) => shuffledData.options.indexOf(ans))
                  .filter((idx) => idx >= 0)
                  .map((idx) => shuffledData.indexMap[idx])
                  .sort();
                const correctIndices = q.correctAnswers.sort();
                if (
                  correctIndices.length === originalAnswerIndices.length &&
                  correctIndices.every(
                    (opt, i) => opt === originalAnswerIndices[i]
                  )
                ) {
                  isCorrect = true;
                  userScore += questionScore;
                }
              }
            }
          }

          return {
            name: q.name,
            answer,
            type: q.type,
            isCorrect,
          };
        });

      // Calculate totalScore as a percentage
      const totalScore =
        totalPossibleScore > 0
          ? (userScore / totalPossibleScore).toFixed(2)
          : 0;

      const surveyResults = orderedResponses.reduce(
        (
          acc: Record<string, string | string[] | number | Date | null>,
          curr
        ) => {
          acc[curr.name] = curr.answer;
          return acc;
        },
        {} as Record<string, string | string[] | number | Date | null>
      );

      await addDoc(collection(db, "responses", id, "submissions"), {
        formTitle: formData.title,
        responses: surveyResults,
        totalScore,
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
                      <Radio.Group
                        {...form.getInputProps(q.id)}
                        onChange={(value) => {
                          form.setFieldValue(q.id, value);
                          setOtherSelected((prev) => ({
                            ...prev,
                            [q.id]: value === "other",
                          }));
                        }}
                      >
                        <Stack>
                          {(formData.isQuiz && shuffledOptions[q.id]?.options
                            ? shuffledOptions[q.id].options
                            : q.options
                          ).map((opt, idx) => (
                            <Radio
                              key={idx}
                              value={opt}
                              label={opt || `Option ${idx + 1}`}
                            />
                          ))}
                          {q.allowOtherAnswer && (
                            <Group align="center">
                              <Radio value="other" label="Khác" />
                              <TextInput
                                placeholder="Vui lòng nêu rõ"
                                {...form.getInputProps(q.id + "_other")}
                                disabled={!otherSelected[q.id]}
                              />
                            </Group>
                          )}
                        </Stack>
                      </Radio.Group>
                    )}

                    {q.type === "checkbox" && q.options && (
                      <Checkbox.Group {...form.getInputProps(q.id)}>
                        <Stack>
                          {(formData.isQuiz && shuffledOptions[q.id]?.options
                            ? shuffledOptions[q.id].options
                            : q.options
                          ).map((opt, idx) => (
                            <Checkbox
                              key={idx}
                              value={opt}
                              label={opt || `Option ${idx + 1}`}
                            />
                          ))}
                          {q.allowOtherAnswer && (
                            <Group align="center">
                              <Checkbox value="other" label="Khác" />
                              <TextInput
                                placeholder="Vui lòng nêu rõ"
                                {...form.getInputProps(q.id + "_other")}
                                disabled={
                                  !Array.isArray(form.values[q.id]) ||
                                  !(form.values[q.id] as string[]).includes(
                                    "other"
                                  )
                                }
                              />
                            </Group>
                          )}
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
                          form.values[q.id] instanceof Date
                            ? (form.values[q.id] as Date)
                            : typeof form.values[q.id] === "string" &&
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
