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
import { useState, useEffect } from "react";
import { Question, FormData, QuestionType, Page } from "../types/form";
import QuestionItem from "./QuestionItem";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { saveFormToFirestore } from "../utils/firebaseStorage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function FormBuilder() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();

  const submissionLink = `${window.location.origin}/#/form-submit/${id || ""}`;

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, "forms", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const formData = docSnap.data() as FormData;
          setTitle(formData.title);
          setPages(formData.pages || []);
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
      title: "",
      options: [],
      ratingCharacter: type === "rating" ? "★" : "",
      ratingScale: type === "rating" ? 11 : 0,
      isRequired: false,
    };

    const updatedPages = [...pages];
    updatedPages[pageIndex].elements.push(newQuestion);
    setPages(updatedPages);
  };

  const saveForm = async () => {
    const formData: FormData = {
      id: id || uuidv4(),
      title,
      pages,
    };
    console.log("Saving form data:", formData);
    await saveFormToFirestore(formData);
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
    const newPage: Page = {
      name: `page_${uuidv4()}`,
      elements: [],
    };
    setPages([...pages, newPage]);
  };

  return (
    <>
      {/* HEADER */}
      <Paper
        shadow="xs"
        p="md"
        bg="dark.7"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: "1px solid #2c2e33",
          color: "white",
          marginTop: -120,
        }}
      >
        <Group justify="right">
          <Title order={4}>Biểu mẫu: {title || "(Chưa đặt tiêu đề)"}</Title>

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
          Trình tạo biểu mẫu
        </Title>

        <Stack>
          <TextInput
            label="Tên biểu mẫu"
            placeholder="Nhập tiêu đề biểu mẫu..."
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          {pages.map((page, pageIndex) => (
            <Paper
              key={page.name}
              shadow="xs"
              p="md"
              radius="md"
              withBorder
              style={{ backgroundColor: "#1a1b1e" }}
            >
              <Stack>
                <Stack gap="xs">
                  <TextInput
                    label={`Tiêu đề trang ${pageIndex + 1}`}
                    placeholder="Ví dụ: Thông tin chung"
                    value={page.title || ""}
                    onChange={(e) => {
                      const updatedPages = [...pages];
                      updatedPages[pageIndex].title = e.currentTarget.value;
                      setPages(updatedPages);
                    }}
                  />

                  <TextInput
                    label="Mô tả trang"
                    placeholder="Thêm mô tả ngắn cho trang này..."
                    value={page.description || ""}
                    onChange={(e) => {
                      const updatedPages = [...pages];
                      updatedPages[pageIndex].description =
                        e.currentTarget.value;
                      setPages(updatedPages);
                    }}
                  />
                </Stack>

                {page.elements.map((q, qIndex) => (
                  <QuestionItem
                    key={q.id}
                    question={q}
                    index={qIndex}
                    onChange={(updated) => {
                      const updatedPages = [...pages];
                      updatedPages[pageIndex].elements[qIndex] = updated;
                      setPages(updatedPages);
                    }}
                    onDelete={() => {
                      const updatedPages = [...pages];
                      updatedPages[pageIndex].elements = updatedPages[
                        pageIndex
                      ].elements.filter((_, i) => i !== qIndex);
                      setPages(updatedPages);
                    }}
                  />
                ))}
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
                      onClick={() => addQuestion("multiple_choice", pageIndex)}
                    >
                      📝 Trắc nghiệm
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => addQuestion("checkbox", pageIndex)}
                    >
                      ✅ Checkbox nhiều lựa chọn
                    </Menu.Item>
                    <Menu.Item onClick={() => addQuestion("rating", pageIndex)}>
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
    </>
  );
}
