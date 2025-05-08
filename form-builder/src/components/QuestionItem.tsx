import {
  Card,
  TextInput,
  Button,
  Group,
  Stack,
  CloseButton,
  Text,
  Box,
  SegmentedControl,
  Divider,
  Switch,
  ActionIcon,
  Modal,
  Textarea,
  Checkbox,
  Radio,
  NumberInput,
} from "@mantine/core";
import { Question } from "../types/form";
import { useState } from "react";
import { useClickOutside } from "@mantine/hooks";

import { IconCopy, IconSettings, IconTrashFilled } from "@tabler/icons-react";

interface QuestionItemProps {
  question: Question & { ratingCharacter?: string };
  onChange: (updated: Question) => void;
  onDelete?: () => void;
  onDuplicate: () => void;
  index: number;
}

const ratingIcons = [
  "⭐",
  "❤️",
  "🔥",
  "👍",
  "🎯",
  "🎉",
  "💎",
  "😊",
  "🚀",
  "🏆",
];

export default function QuestionItem({
  question,
  onChange,
  onDelete,
  onDuplicate,
  index,
}: QuestionItemProps) {
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(() => setIsActive(false));

  const handleTitleChange = (value: string) => {
    onChange({ ...question, title: value });
  };
  const handleNameChange = (value: string) => {
    onChange({ ...question, name: value });
  };
  const handleDescriptionChange = (value: string) => {
    onChange({ ...question, description: value });
  };

  const handleOptionChange = (value: string, idx: number) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    newOptions[idx] = value;
    onChange({ ...question, options: newOptions });
  };
  const handleScoreChange = (value: number) => {
    onChange({ ...question, score: value });
  };

  const handleRatingCharacterChange = (value: string) => {
    onChange({ ...question, ratingCharacter: value });
  };
  const handleRequiredChange = (value: boolean) => {
    onChange({ ...question, isRequired: value });
  };

  const addOption = () => {
    if (!question.options) return;
    onChange({ ...question, options: [...question.options, ""] });
  };

  const removeOption = (idx: number) => {
    if (!question.options) return;
    const newOptions = question.options.filter((_, i) => i !== idx);
    onChange({ ...question, options: newOptions });
  };

  return (
    <div ref={ref}>
      <Card
        withBorder
        shadow={isActive ? "md" : "sm"}
        radius="md"
        mb="md"
        onClick={() => setIsActive(true)}
        style={{
          borderColor: isActive ? "#228be6" : undefined,
          cursor: "pointer",
          transition:
            "border-color 0.3s ease-in-out, max-height 0.3s ease-in-out",
          maxHeight: isActive ? "1000px" : "200px",
          overflow: "hidden",
        }}
      >
        <Stack>
          {isActive && (
            <Group style={{ justifyContent: "flex-end" }}>
              <ActionIcon
                variant="light"
                color="red"
                onClick={onDelete}
                title="Nhân đôi câu hỏi"
              >
                <IconTrashFilled size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="blue"
                onClick={onDuplicate}
                title="Nhân đôi câu hỏi"
              >
                <IconCopy size={16} />
              </ActionIcon>
            </Group>
          )}
          <Group align="center">
            <Text fw="bold">{index + 1}.</Text>
            <TextInput
              placeholder="Nhập câu hỏi..."
              value={question.title}
              onChange={(e) => handleTitleChange(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
          </Group>

          {(question.type === "multiple_choice" ||
            question.type === "checkbox") && (
            <Stack>
              {question.options?.map((opt, idx) => (
                <Group key={idx} align="center">
                  {question.type === "checkbox" ? (
                    <Checkbox
                      checked={question.correctAnswers?.includes(idx)}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        const current = question.correctAnswers || [];
                        const updated = checked
                          ? [...current, idx]
                          : current.filter((i) => i !== idx);
                        onChange({ ...question, correctAnswers: updated });
                      }}
                    />
                  ) : (
                    <Radio
                      checked={question.correctAnswers?.[0] === idx}
                      onChange={() =>
                        onChange({ ...question, correctAnswers: [idx] })
                      }
                    />
                  )}
                  <TextInput
                    placeholder={`Tuỳ chọn ${idx + 1}`}
                    value={opt}
                    readOnly={!isActive}
                    onChange={(e) =>
                      handleOptionChange(e.currentTarget.value, idx)
                    }
                    style={{ flex: 0.5 }}
                  />
                  {isActive && (
                    <CloseButton onClick={() => removeOption(idx)} />
                  )}
                </Group>
              ))}
              {isActive && (
                <Button size="xs" onClick={addOption}>
                  + Thêm tuỳ chọn
                </Button>
              )}
            </Stack>
          )}

          {/* Rating Question UI - Simplified without scale selection */}
          {question.type === "rating" && (
            <Stack>
              {isActive && (
                <Box>
                  <Text size="sm" mb="xs">
                    Chọn biểu tượng:
                  </Text>
                  <SegmentedControl
                    value={question.ratingCharacter || "⭐"}
                    onChange={handleRatingCharacterChange}
                    data={ratingIcons.map((icon) => ({
                      value: icon,
                      label: icon,
                    }))}
                    fullWidth
                  />
                </Box>
              )}

              <Group mt="sm">
                {Array.from({ length: 11 }, (_, idx) => (
                  <Box
                    key={idx}
                    style={{
                      position: "relative",
                    }}
                  >
                    <Text size="xl">{question.ratingCharacter || "⭐"}</Text>
                    {isActive && (
                      <Text
                        size="xs"
                        style={{
                          position: "absolute",
                          bottom: -20,
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#868e96",
                        }}
                      >
                        {idx}
                      </Text>
                    )}
                  </Box>
                ))}
              </Group>

              {isActive && onDelete && question.type === "rating" && (
                <Divider my="sm" />
              )}
            </Stack>
          )}

          {question.type === "date" && (
            <TextInput
              type="date"
              placeholder="Chọn ngày"
              disabled={!isActive}
              style={{ maxWidth: 200 }}
            />
          )}
          {isActive && (
            <Group justify="space-between" mt="sm">
              <Group gap="xs">
                {(question.type === "multiple_choice" ||
                  question.type === "checkbox") && (
                  <NumberInput
                    label="Điểm số"
                    placeholder="Nhập điểm cho câu hỏi này"
                    value={question.score ?? 0}
                    min={0}
                    style={{ maxWidth: 100 }}
                    onChange={(value) => handleScoreChange(Number(value))}
                  />
                )}
              </Group>
              <Group>
                {(question.type === "multiple_choice" ||
                  question.type === "checkbox") && (
                  <Switch
                    label={"Chọn nhiều"}
                    checked={question.type === "checkbox"}
                    onChange={() => {
                      const newType =
                        question.type === "multiple_choice"
                          ? "checkbox"
                          : "multiple_choice";
                      onChange({ ...question, type: newType });
                    }}
                  />
                )}

                <Switch
                  label="Bắt buộc"
                  checked={question.isRequired || false}
                  onChange={(event) =>
                    handleRequiredChange(event.currentTarget.checked)
                  }
                />
                <ActionIcon variant="light" onClick={() => setIsOpen(true)}>
                  <IconSettings size={20} />
                </ActionIcon>
              </Group>
            </Group>
          )}
        </Stack>
        <Modal
          opened={isOpen}
          onClose={() => setIsOpen(false)}
          title="Chỉnh sửa câu hỏi"
        >
          <Stack>
            <TextInput
              label="Question name"
              value={question.name}
              onChange={(e) => handleNameChange(e.currentTarget.value)}
            />
            <Textarea
              label="Question title"
              value={question.title}
              onChange={(e) => handleTitleChange(e.currentTarget.value)}
            />
            <Textarea
              label="Question description"
              value={question.description}
              onChange={(e) => handleDescriptionChange(e.currentTarget.value)}
            />

            <Button
              onClick={() => {
                const updated = {
                  ...question,
                  name: question.name,
                  title: question.title,
                  description: question.description,
                };
                onChange?.(updated);
                setIsOpen(false);
              }}
            >
              Lưu thay đổi
            </Button>
          </Stack>
        </Modal>
      </Card>
    </div>
  );
}
