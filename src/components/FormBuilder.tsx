import {
  TextInput,
  Button,
  Container,
  Stack,
  Title,
  Group,
  Paper,
  Menu,
  Modal,
  Text,
  CopyButton,
  Tooltip,
  ActionIcon,
  rem,
} from "@mantine/core";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";
import { Question, FormData, QuestionType } from "../types/form";
import QuestionItem from "./QuestionItem";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { saveFormToFirestore } from "../utils/firebaseStorage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useForm, yupResolver } from "@mantine/form";
import * as yup from "yup";
import { useAuth } from "../context/authContext";

const formSchema = yup.object().shape({
  title: yup.string().required("Form title is required"),
  pages: yup.array().of(
    yup.object().shape({
      title: yup.string().required("Page title is required"),
      description: yup.string().optional(),
      elements: yup.array().of(
        yup.object().shape({
          title: yup.string().required("Question title is required"),
          name: yup.string(),
          type: yup.string().required(),
          isRequired: yup.boolean(),
          allowOtherAnswer: yup.boolean(),
          options: yup.array().when("type", {
            is: (type: string) =>
              ["multiple_choice", "checkbox"].includes(type),
            then: (schema) =>
              schema
                .of(yup.string().required("Option cannot be empty"))
                .min(1, "Add at least one option"),
          }),
        })
      ),
    })
  ),
});

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, setOpened] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { currentUser } = useAuth();
  const submissionLink = `${
    window.location.origin
  }/form-builder/#/form-submit/${id || ""}`;

  const queryParams = new URLSearchParams(location.search);
  const isQuiz = queryParams.get("isQuiz") === "true";
  console.log(isQuiz);

  const form = useForm<FormData>({
    initialValues: {
      id: id || uuidv4(),
      title: "",
      isQuiz: isQuiz,
      pages: [
        {
          name: `page_${uuidv4()}`,
          title: "",
          description: "",
          elements: [
            {
              id: uuidv4(),
              name: `question_${uuidv4()}`,
              type: isQuiz ? "multiple_choice" : ("short_text" as QuestionType),
              title: "",
              description: "",
              options: isQuiz ? ["Option 1", "Option 2"] : [],
              correctAnswers: [],
              score: isQuiz ? 1 : 0,
              ratingCharacter: "",
              ratingScale: 0,
              isRequired: false,
              allowOtherAnswer: false,
              isScored: isQuiz,
            },
          ],
        },
      ],
      userUID: currentUser?.uid || "",
    },
    validate: yupResolver(formSchema),
  });

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;

      try {
        if (!currentUser?.uid || !id) {
          console.warn("User UID hoặc Form ID không xác định!");
          return;
        }
        const docRef = doc(db, "forms", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const formData = docSnap.data() as FormData;
          form.reset();
          form.setValues(formData);
          console.log(form.values);
        } else {
          console.warn("Form không tồn tại!");
        }
      } catch (error) {
        console.error("Lỗi khi tải form từ Firestore:", error);
      }
    };

    fetchForm();
  }, [id]);

  const addQuestion = (type: QuestionType, pageIndex: number) => {
    const newQuestion: Question = {
      id: uuidv4(),
      name: `question_${uuidv4()}`,
      type,
      description: "",
      title: "",
      options: form.values.isQuiz ? ["Option 1", "Option 2"] : [],
      correctAnswers: [],
      score: form.values.isQuiz ? 1 : 0,
      ratingCharacter: type === "rating" ? "★" : "",
      ratingScale: type === "rating" ? 11 : 0,
      isRequired: false,
      allowOtherAnswer: false,
      isScored: form.values.isQuiz,
    };

    form.insertListItem(`pages.${pageIndex}.elements`, newQuestion);
  };

  const saveForm = async () => {
    const isValid = form.validate();
    if (!isValid.hasErrors) {
      console.log("Saving form data:", form.values);
      await saveFormToFirestore(form.values);
      setShowSaveModal(true);
    } else {
      console.log("Validation errors:", form.errors);

      Object.entries(form.errors).forEach(([field, error]) => {
        console.log(`Error in "${field}": ${error}`);
      });
    }
  };

  const handlePreview = () => {
    saveForm();
    navigate(`/preview/${id}`);
  };

  const handleAnalyze = () => {
    saveForm();
    navigate(`/form-responses/${id}`);
  };

  const addPage = () => {
    form.insertListItem("pages", {
      name: `page_${uuidv4()}`,
      elements: [],
      title: "",
      description: "",
    });
  };

  const moveQuestion = (
    pageIndex: number,
    questionId: string,
    direction: "up" | "down"
  ) => {
    if (!form.values.pages) return;

    form.setValues((prev) => {
      const newPages = [...(prev.pages || [])];
      const page = { ...newPages[pageIndex] };
      const questionIndex = page.elements.findIndex((q) => q.id === questionId);

      if (questionIndex === -1) return prev;
      const newIndex =
        direction === "up" ? questionIndex - 1 : questionIndex + 1;
      if (newIndex < 0 || newIndex >= page.elements.length) return prev;

      const newElements = [...page.elements];
      [newElements[questionIndex], newElements[newIndex]] = [
        newElements[newIndex],
        newElements[questionIndex],
      ];

      newPages[pageIndex] = { ...page, elements: newElements };
      return { ...prev, pages: newPages };
    });
  };

  return (
    <>
      {/* HEADER */}
      <Paper
        shadow="xs"
        p="md"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          marginTop: -120,
        }}
      >
        <Group justify="right">
          <Title order={4}>
            Biểu mẫu: {form.values.title || "(Chưa đặt tiêu đề)"}
          </Title>

          <Group>
            <Button variant="light" color="green" onClick={saveForm}>
              💾 Lưu
            </Button>
            <Button variant="outline" color="blue" onClick={handlePreview}>
              👀 Xem trước
            </Button>
            <Button
              variant="outline"
              color="orange"
              onClick={() => setOpened(true)}
            >
              📊 Thu thập câu trả lời
            </Button>
            <Button variant="outline" color="blue" onClick={handleAnalyze}>
              📊 Xem phản hồi
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* BODY */}
      <Container size="sm" py="xl">
        <Title order={2} mb="lg">
          Trình tạo {form.values.isQuiz ? "bài trắc nghiệm" : "biểu mẫu"}
        </Title>

        <Stack>
          <TextInput
            label="Tên biểu mẫu"
            placeholder="Nhập tiêu đề biểu mẫu..."
            {...form.getInputProps("title")}
            required
          />

          <DragDropContext
            onDragEnd={({ destination, source }) => {
              if (!destination) return;

              const sourcePageIndex = parseInt(
                source.droppableId.split("-")[1]
              );
              const destPageIndex = parseInt(
                destination.droppableId.split("-")[1]
              );

              if (sourcePageIndex === destPageIndex) {
                // Same page drag-and-drop
                form.reorderListItem(`pages.${sourcePageIndex}.elements`, {
                  from: source.index,
                  to: destination.index,
                });
              } else {
                // Cross-page drag-and-drop
                form.setValues((prev) => {
                  const newPages = [...(prev.pages || [])];
                  const sourcePage = { ...newPages[sourcePageIndex] };
                  const destPage = { ...newPages[destPageIndex] };

                  // Remove question from source page
                  const [movedQuestion] = sourcePage.elements.splice(
                    source.index,
                    1
                  );

                  // Insert question into destination page
                  destPage.elements.splice(destination.index, 0, movedQuestion);

                  // Update pages
                  newPages[sourcePageIndex] = { ...sourcePage };
                  newPages[destPageIndex] = { ...destPage };

                  return { ...prev, pages: newPages };
                });
              }
            }}
          >
            {form.values.pages.map((page, pageIndex) => (
              <Paper key={page.name} shadow="xs" p="md" radius="md" withBorder>
                <Group justify="space-between" align="center">
                  <Title order={4}>Trang {pageIndex + 1}</Title>
                  {form.values.pages.length > 1 && (
                    <Button
                      color="red"
                      variant="light"
                      size="xs"
                      onClick={() => form.removeListItem("pages", pageIndex)}
                    >
                      Xoá trang
                    </Button>
                  )}
                </Group>
                <Stack>
                  <Stack gap="xs">
                    <TextInput
                      label={`Tiêu đề trang ${pageIndex + 1}`}
                      placeholder="Ví dụ: Thông tin chung"
                      {...form.getInputProps(`pages.${pageIndex}.title`)}
                      required
                    />

                    <TextInput
                      label="Mô tả trang"
                      placeholder="Thêm mô tả ngắn cho trang này..."
                      {...form.getInputProps(`pages.${pageIndex}.description`)}
                    />
                  </Stack>

                  <Droppable droppableId={`page-${pageIndex}`}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{ marginBottom: 16 }}
                      >
                        {page.elements.map((q, qIndex) => (
                          <Draggable
                            key={q.id}
                            draggableId={q.id}
                            index={qIndex}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  marginBottom: 16,
                                }}
                              >
                                <QuestionItem
                                  question={q}
                                  index={qIndex}
                                  pageIndex={pageIndex}
                                  dragHandleProps={provided.dragHandleProps}
                                  onChange={(updated) => {
                                    form.setFieldValue(
                                      `pages.${pageIndex}.elements.${qIndex}`,
                                      updated
                                    );
                                  }}
                                  onDelete={() => {
                                    form.removeListItem(
                                      `pages.${pageIndex}.elements`,
                                      qIndex
                                    );
                                  }}
                                  onDuplicate={() => {
                                    const duplicated = {
                                      ...q,
                                      id: uuidv4(),
                                      title: q.title + " (copy)",
                                    };
                                    form.insertListItem(
                                      `pages.${pageIndex}.elements`,
                                      duplicated,
                                      qIndex + 1
                                    );
                                  }}
                                  isFirstQuestion={qIndex === 0}
                                  isLastQuestion={
                                    qIndex === page.elements.length - 1
                                  }
                                  onMoveQuestion={(direction) =>
                                    moveQuestion(pageIndex, q.id, direction)
                                  }
                                  form={form}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <Menu shadow="md" width={690}>
                    <Menu.Target>
                      <Button>+ Thêm câu hỏi</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        onClick={() => addQuestion("short_text", pageIndex)}
                      >
                        ✍️ Trả lời ngắn
                      </Menu.Item>
                      <Menu.Item
                        onClick={() =>
                          addQuestion("multiple_choice", pageIndex)
                        }
                      >
                        📝 Trắc nghiệm
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => addQuestion("checkbox", pageIndex)}
                      >
                        ✅ Checkbox nhiều lựa chọn
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => addQuestion("rating", pageIndex)}
                      >
                        🌟 Đánh giá
                      </Menu.Item>
                      <Menu.Item onClick={() => addQuestion("date", pageIndex)}>
                        📅 Ngày tháng
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Stack>
              </Paper>
            ))}
          </DragDropContext>

          <Button variant="light" color="gray" onClick={addPage}>
            ➕ Tạo trang mới
          </Button>
        </Stack>
      </Container>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Đường dẫn thu thập câu trả lời"
        centered
      >
        <Stack>
          <Text>Chia sẻ đường dẫn này để thu thập câu trả lời:</Text>
          <Group>
            <TextInput value={submissionLink} readOnly style={{ flex: 1 }} />
            <CopyButton value={submissionLink} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? "Đã sao chép" : "Sao chép"}
                  withArrow
                  position="right"
                >
                  <ActionIcon
                    color={copied ? "teal" : "gray"}
                    variant="subtle"
                    onClick={copy}
                  >
                    {copied ? (
                      <IconCheck style={{ width: rem(16) }} />
                    ) : (
                      <IconCopy style={{ width: rem(16) }} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <Text size="sm" c="dimmed">
            Mọi người có thể truy cập đường dẫn này để điền biểu mẫu của bạn.
          </Text>
        </Stack>
      </Modal>
      <Modal
        opened={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Đã lưu thành công"
      >
        <Text>Biểu mẫu của bạn đã được lưu.</Text>
        <Button mt="md" onClick={() => setShowSaveModal(false)}>
          Đóng
        </Button>
      </Modal>
    </>
  );
}
