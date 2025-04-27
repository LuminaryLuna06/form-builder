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
} from "@mantine/core";
import { Question } from "../types/form";
import { useState } from "react";
import { useClickOutside } from "@mantine/hooks";

interface QuestionItemProps {
  question: Question & { ratingCharacter?: string };
  onChange: (updated: Question) => void;
  onDelete?: () => void;
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
  index,
}: QuestionItemProps) {
  const [isActive, setIsActive] = useState(false);
  const ref = useClickOutside(() => setIsActive(false));

  const handleTitleChange = (value: string) => {
    onChange({ ...question, title: value });
  };

  const handleOptionChange = (value: string, idx: number) => {
    if (!question.options) return;
    const newOptions = [...question.options];
    newOptions[idx] = value;
    onChange({ ...question, options: newOptions });
  };

  const handleRatingCharacterChange = (value: string) => {
    onChange({ ...question, ratingCharacter: value });
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
          {isActive && onDelete && (
            <Button color="red" variant="light" onClick={onDelete}>
              Xoá câu hỏi
            </Button>
          )}
        </Stack>
      </Card>
    </div>
  );
}
