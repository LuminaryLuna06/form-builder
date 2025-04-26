import {
  Card,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  CloseButton,
} from "@mantine/core";
import { Question, QuestionType } from "../types/form";

interface QuestionItemProps {
  question: Question;
  onChange: (updated: Question) => void;
  onDelete?: () => void;
}

const typeOptions = [
  { value: "short_text", label: "Trả lời ngắn" },
  { value: "multiple_choice", label: "Trắc nghiệm" },
  { value: "checkbox", label: "Checkbox nhiều lựa chọn" },
];

export default function QuestionItem({
  question,
  onChange,
  onDelete,
}: QuestionItemProps) {
  const handleTitleChange = (value: string) => {
    onChange({ ...question, title: value });
  };

  const handleTypeChange = (value: QuestionType) => {
    const updated: Question = {
      ...question,
      type: value,
      options: value === "short_text" ? undefined : [""],
    };
    onChange(updated);
  };

  const handleOptionChange = (value: string, index: number) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    newOptions[index] = value;
    onChange({ ...question, options: newOptions });
  };

  const addOption = () => {
    if (!question.options) return;
    onChange({ ...question, options: [...question.options, ""] });
  };

  const removeOption = (index: number) => {
    if (!question.options) return;
    const newOptions = question.options.filter((_, i) => i !== index);
    onChange({ ...question, options: newOptions });
  };

  return (
    <Card withBorder shadow="sm" radius="md" mb="md">
      <Stack>
        <Group grow>
          <TextInput
            placeholder="Nhập câu hỏi..."
            value={question.title}
            onChange={(e) => handleTitleChange(e.currentTarget.value)}
          />
          <Select
            data={typeOptions}
            value={question.type}
            onChange={(value) => handleTypeChange(value as QuestionType)}
          />
        </Group>

        {(question.type === "multiple_choice" ||
          question.type === "checkbox") && (
          <Stack spacing="xs">
            {question.options?.map((opt, index) => (
              <Group key={index} align="center">
                <TextInput
                  placeholder={`Tuỳ chọn ${index + 1}`}
                  value={opt}
                  onChange={(e) =>
                    handleOptionChange(e.currentTarget.value, index)
                  }
                />
                <CloseButton onClick={() => removeOption(index)} />
              </Group>
            ))}
            <Button size="xs" onClick={addOption}>
              + Thêm tuỳ chọn
            </Button>
          </Stack>
        )}

        {onDelete && (
          <Button color="red" variant="light" onClick={onDelete}>
            Xoá câu hỏi
          </Button>
        )}
      </Stack>
    </Card>
  );
}
