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
import { Question, FormData, QuestionType } from "../types/form";
import QuestionItem from "./QuestionItem";
import { saveFormToLocalStorage } from "../utils/localStorage";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";
import { IconCopy, IconCheck } from "@tabler/icons-react";

export default function FormBuilder() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();

  const submissionLink = `${window.location.origin}/#/form-submit/${id || ""}`;
  useEffect(() => {
    if (!id) return;

    const saved = localStorage.getItem("form_" + id);
    if (saved) {
      const parsed: FormData = JSON.parse(saved);
      setTitle(parsed.title);
      setQuestions(parsed.questions || []);
    }
  }, [id]);

  // const addQuestion = () => {
  //   setQuestions((prev) => [
  //     ...prev,
  //     { id: uuidv4(), type: "short_text", title: "" },
  //   ]);
  // };

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        title: "",
        options: type === "short_text" ? undefined : [""],
      },
    ]);
  };

  const saveForm = () => {
    const formData = {
      title,
      questions,
      id: id || uuidv4(),
    };
    saveFormToLocalStorage(formData);
  };

  const handlePreview = () => {
    saveForm();
    navigate(`/preview/${id}`);
  };
  const handleAnalyze = () => {
    saveForm();
    navigate(`/form-responses/${id}`);
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
        </Group>{" "}
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
          {questions.map((q, index) => (
            <QuestionItem
              key={q.id}
              question={q}
              index={index}
              onChange={(updated) => {
                const updatedQuestions = [...questions];
                updatedQuestions[index] = updated;
                setQuestions(updatedQuestions);
              }}
              onDelete={() => {
                const updatedQuestions = questions.filter(
                  (_, i) => i !== index
                );
                setQuestions(updatedQuestions);
              }}
            />
          ))}
          {/* NÚT THÊM CÂU HỎI */}
          <Menu shadow="md" width={690}>
            <Menu.Target>
              <Button>+ Thêm câu hỏi</Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item onClick={() => addQuestion("short_text")}>
                ✍️ Trả lời ngắn
              </Menu.Item>
              <Menu.Item onClick={() => addQuestion("multiple_choice")}>
                📝 Trắc nghiệm
              </Menu.Item>
              <Menu.Item onClick={() => addQuestion("checkbox")}>
                ✅ Checkbox nhiều lựa chọn
              </Menu.Item>
              <Menu.Item onClick={() => addQuestion("rating")}>
                🌟 Đánh giá
              </Menu.Item>
              <Menu.Item onClick={() => addQuestion("date")}>
                📅 Ngày tháng
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>{" "}
        </Stack>
      </Container>
      {/* Responses Modal */}
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
