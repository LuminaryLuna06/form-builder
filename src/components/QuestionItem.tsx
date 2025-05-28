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
import { useState, useEffect } from "react";
import { useClickOutside } from "@mantine/hooks";
import { UseFormReturnType } from "@mantine/form";
import {
  IconCopy,
  IconGripVertical,
  IconSettings,
  IconTrashFilled,
} from "@tabler/icons-react";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

interface QuestionItemProps {
  question: Question & { ratingCharacter?: string };
  onChange: (updated: Question) => void;
  onDelete?: () => void;
  onDuplicate: () => void;
  index: number;
  pageIndex: number;
  onMoveQuestion: (direction: "up" | "down") => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  form: UseFormReturnType<any>;
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
  pageIndex,
  onMoveQuestion,
  isFirstQuestion,
  isLastQuestion,
  dragHandleProps,
  form,
}: QuestionItemProps) {
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [localQuestion, setLocalQuestion] = useState(question);
  const [localError, setLocalError] = useState<string | null>(null);
  const ref = useClickOutside(() => setIsActive(false));

  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  const handleLocalChange = (updates: Partial<Question>) => {
    const updatedQuestion = { ...localQuestion, ...updates };
    setLocalQuestion(updatedQuestion);
    onChange(updatedQuestion);
  };

  const addOption = () => {
    const newOptions = [...(localQuestion.options || []), ""];
    handleLocalChange({ options: newOptions });
  };

  const removeOption = (idx: number) => {
    const newOptions = (localQuestion.options || []).filter(
      (_, i) => i !== idx
    );
    const newCorrectAnswers = (localQuestion.correctAnswers || [])
      .filter((i) => i !== idx && i !== -1)
      .map((i) => (i > idx ? i - 1 : i));
    handleLocalChange({
      options: newOptions,
      correctAnswers: newCorrectAnswers,
    });
  };

  const validateCorrectAnswers = (newIndices: number[]) => {
    if (
      newIndices.some(
        (idx) => idx !== -1 && idx >= (localQuestion.options || []).length
      )
    ) {
      setLocalError("Correct answers must match valid option indices");
      return false;
    }
    setLocalError(null);
    return true;
  };

  // Handle toggling allowOtherAnswer to clean up correctAnswers
  const handleAllowOtherAnswerChange = (checked: boolean) => {
    let newCorrectAnswers = localQuestion.correctAnswers || [];
    if (!checked) {
      // Remove "Other" (-1) from correctAnswers when disabling allowOtherAnswer
      newCorrectAnswers = newCorrectAnswers.filter((i) => i !== -1);
    }
    handleLocalChange({
      allowOtherAnswer: checked,
      correctAnswers: newCorrectAnswers,
    });
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
          backgroundColor: "#242424"
        }}
      >
        <Stack>
          <Group align="center">
            <ActionIcon
              variant="light"
              color="gray"
              {...dragHandleProps}
              title="Kéo để sắp xếp"
              style={{ cursor: "grab" }}
            >
              <IconGripVertical size={16} />
            </ActionIcon>
          </Group>
          {isActive && (
            <Group style={{ justifyContent: "flex-end" }}>
              <ActionIcon
                variant="light"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveQuestion("up");
                }}
                title="Move question up"
                disabled={isFirstQuestion}
              >
                <IconArrowUp size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveQuestion("down");
                }}
                title="Move question down"
                disabled={isLastQuestion}
              >
                <IconArrowDown size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                onClick={onDelete}
                title="Xoá câu hỏi"
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
              {...form.getInputProps(
                `pages.${pageIndex}.elements.${index}.title`
              )}
              style={{ flex: 1 }}
            />
          </Group>

          {(localQuestion.type === "multiple_choice" ||
            localQuestion.type === "checkbox") && (
            <Stack>
              {localQuestion.options?.map((_, idx) => (
                <Group key={idx} align="center">
                  {localQuestion.type === "checkbox" ? (
                    <Checkbox
                      checked={localQuestion.correctAnswers?.includes(idx)}
                      disabled={!localQuestion.isScored}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        const current = localQuestion.correctAnswers || [];
                        const updated = checked
                          ? [...current, idx]
                          : current.filter((i) => i !== idx);
                        if (validateCorrectAnswers(updated)) {
                          handleLocalChange({ correctAnswers: updated });
                        }
                      }}
                    />
                  ) : (
                    <Radio
                      disabled={!localQuestion.isScored}
                      checked={localQuestion.correctAnswers?.[0] === idx}
                      onChange={() => {
                        const updated = [idx];
                        if (validateCorrectAnswers(updated)) {
                          handleLocalChange({ correctAnswers: updated });
                        }
                      }}
                    />
                  )}
                  <TextInput
                    placeholder={`Tuỳ chọn ${idx + 1}`}
                    {...form.getInputProps(
                      `pages.${pageIndex}.elements.${index}.options.${idx}`
                    )}
                    style={{ flex: 0.5 }}
                  />
                  {isActive && (
                    <CloseButton onClick={() => removeOption(idx)} />
                  )}
                </Group>
              ))}
              {localQuestion.allowOtherAnswer && (
                <Group key="other-option" align="center">
                  {localQuestion.type === "checkbox" ? (
                    <Checkbox
                      checked={localQuestion.correctAnswers?.includes(-1)}
                      disabled={!localQuestion.isScored}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        const current = localQuestion.correctAnswers || [];
                        const updated = checked
                          ? [...current, -1]
                          : current.filter((i) => i !== -1);
                        if (validateCorrectAnswers(updated)) {
                          handleLocalChange({ correctAnswers: updated });
                        }
                      }}
                    />
                  ) : (
                    <Radio
                      checked={localQuestion.correctAnswers?.[0] === -1}
                      disabled={!localQuestion.isScored}
                      onChange={() => {
                        const updated = [-1];
                        if (validateCorrectAnswers(updated)) {
                          handleLocalChange({ correctAnswers: updated });
                        }
                      }}
                    />
                  )}
                  <TextInput
                    placeholder="Khác (vui lòng nêu rõ)"
                    readOnly
                    style={{ flex: 0.5 }}
                  />
                </Group>
              )}
              {isActive && (
                <Button size="xs" onClick={addOption}>
                  + Thêm tuỳ chọn
                </Button>
              )}
            </Stack>
          )}

          {localQuestion.type === "rating" && (
            <Stack>
              {isActive && (
                <Box>
                  <Text size="sm" mb="xs">
                    Chọn biểu tượng:
                  </Text>
                  <SegmentedControl
                    value={localQuestion.ratingCharacter || "⭐"}
                    onChange={(value) =>
                      handleLocalChange({ ratingCharacter: value })
                    }
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
                    <Text size="xl">
                      {localQuestion.ratingCharacter || "⭐"}
                    </Text>
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
              {isActive && onDelete && localQuestion.type === "rating" && (
                <Divider my="sm" />
              )}
            </Stack>
          )}

          {localQuestion.type === "date" && (
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
                {localQuestion.isScored && (
                  <NumberInput
                    label="Điểm số"
                    placeholder="Nhập điểm cho câu hỏi này"
                    value={localQuestion.score ?? 0}
                    min={0}
                    style={{ maxWidth: 100 }}
                    onChange={(value) =>
                      handleLocalChange({ score: Number(value) })
                    }
                  />
                )}
              </Group>
              <Group>
                {(localQuestion.type === "multiple_choice" ||
                  localQuestion.type === "checkbox") && (
                  <Group>
                    <Switch
                      label="Chọn nhiều"
                      checked={localQuestion.type === "checkbox"}
                      onChange={(event) => {
                        const newType = event.currentTarget.checked
                          ? "checkbox"
                          : "multiple_choice";
                        handleLocalChange({ type: newType });
                      }}
                    />
                    <Switch
                      label="Câu trả lời khác"
                      checked={localQuestion.allowOtherAnswer || false}
                      onChange={(e) =>
                        handleAllowOtherAnswerChange(e.currentTarget.checked)
                      }
                    />
                  </Group>
                )}
                <Switch
                  label="Bắt buộc"
                  checked={localQuestion.isRequired || false}
                  onChange={(e) =>
                    handleLocalChange({ isRequired: e.currentTarget.checked })
                  }
                />
                <ActionIcon variant="light" onClick={() => setIsOpen(true)}>
                  <IconSettings size={20} />
                </ActionIcon>
              </Group>
            </Group>
          )}
          {localError && (
            <Text color="red" mt="sm">
              {localError}
            </Text>
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
              {...form.getInputProps(
                `pages.${pageIndex}.elements.${index}.name`
              )}
            />
            <Textarea
              label="Question title"
              {...form.getInputProps(
                `pages.${pageIndex}.elements.${index}.title`
              )}
            />
            <Textarea
              label="Question description"
              {...form.getInputProps(
                `pages.${pageIndex}.elements.${index}.description`
              )}
            />
            <Button onClick={() => setIsOpen(false)}>Lưu thay đổi</Button>
          </Stack>
        </Modal>
      </Card>
    </div>
  );
}
