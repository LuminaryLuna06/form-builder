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
import { useForm, yupResolver } from "@mantine/form";
import * as yup from "yup";

import { IconCopy, IconSettings, IconTrashFilled } from "@tabler/icons-react";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";

interface QuestionItemProps {
  question: Question & { ratingCharacter?: string };
  onChange: (updated: Question) => void;
  onDelete?: () => void;
  onDuplicate: () => void;
  index: number;
  onMoveQuestion: (direction: "up" | "down") => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
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

const questionSchema = yup.object().shape({
  title: yup.string().required("Title is required"),
  name: yup.string().required("Question name is required"),
  description: yup.string(),
  options: yup.array().when("type", {
    is: (type: string) => ["multiple_choice", "checkbox"].includes(type),
    then: (schema) =>
      schema.of(yup.string().required("Option cannot be empty")),
  }),
  score: yup.number().min(0, "Score cannot be negative"),
  isRequired: yup.boolean(),
  ratingCharacter: yup.string(),
});

export default function QuestionItem({
  question,
  onChange,
  onDelete,
  onDuplicate,
  index,
  onMoveQuestion,
  isFirstQuestion,
  isLastQuestion,
}: QuestionItemProps) {
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(() => setIsActive(false));

  const form = useForm({
    initialValues: {
      ...question,
      options: question.options || [],
    },
    validate: yupResolver(questionSchema),
  });

  const handleSubmit = (values: typeof form.values) => {
    onChange(values);
    setIsOpen(false);
  };

  useEffect(() => {
    onChange(form.values);
  }, [form.values]);

  const addOption = () => {
    if (!form.values.options) return;
    form.setFieldValue("options", [...form.values.options, ""]);
  };

  const removeOption = (idx: number) => {
    if (!form.values.options) return;
    const newOptions = form.values.options.filter((_, i) => i !== idx);
    form.setFieldValue("options", newOptions);
  };

  return (
    <div ref={ref}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
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
                value={form.values.title}
                {...form.getInputProps("title")}
                style={{ flex: 1 }}
              />
            </Group>

            {(form.values.type === "multiple_choice" ||
              form.values.type === "checkbox") && (
              <Stack>
                {form.values.options?.map((opt, idx) => (
                  <Group key={idx} align="center">
                    {form.values.type === "checkbox" ? (
                      <Checkbox
                        checked={form.values.correctAnswers?.includes(idx)}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          const current = form.values.correctAnswers || [];
                          const updated = checked
                            ? [...current, idx]
                            : current.filter((i) => i !== idx);
                          form.setFieldValue("correctAnswers", updated);
                        }}
                      />
                    ) : (
                      <Radio
                        checked={form.values.correctAnswers?.[0] === idx}
                        onChange={() => {
                          form.setFieldValue("correctAnswers", [idx]);
                        }}
                      />
                    )}
                    <TextInput
                      placeholder={`Tuỳ chọn ${idx + 1}`}
                      value={opt}
                      readOnly={!isActive}
                      {...form.getInputProps(`options.${idx}`)}
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
            {form.values.type === "rating" && (
              <Stack>
                {isActive && (
                  <Box>
                    <Text size="sm" mb="xs">
                      Chọn biểu tượng:
                    </Text>
                    <SegmentedControl
                      value={form.values.ratingCharacter || "⭐"}
                      {...form.getInputProps("ratingCharacter")}
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
                        {form.values.ratingCharacter || "⭐"}
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

                {isActive && onDelete && form.values.type === "rating" && (
                  <Divider my="sm" />
                )}
              </Stack>
            )}

            {form.values.type === "date" && (
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
                  {form.values.isScored && (
                    <NumberInput
                      label="Điểm số"
                      placeholder="Nhập điểm cho câu hỏi này"
                      value={form.values.score ?? 0}
                      min={0}
                      style={{ maxWidth: 100 }}
                      {...form.getInputProps("score")}
                    />
                  )}
                </Group>
                <Group>
                  {(form.values.type === "multiple_choice" ||
                    form.values.type === "checkbox") && (
                    <Group>
                      <Switch
                        label={"Trắc nghiệm"}
                        checked={form.values.isScored || false}
                        {...form.getInputProps("isScored")}
                      />
                      <Switch
                        label={"Chọn nhiều"}
                        checked={form.values.type === "checkbox"}
                        onChange={(event) => {
                          const newType = event.currentTarget.checked
                            ? "checkbox"
                            : "multiple_choice";
                          form.setFieldValue("type", newType);
                        }}
                      />
                    </Group>
                  )}

                  <Switch
                    label="Bắt buộc"
                    checked={form.values.isRequired || false}
                    {...form.getInputProps("isRequired")}
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
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                <TextInput
                  label="Question name"
                  value={form.values.name}
                  {...form.getInputProps("name")}
                />
                <Textarea
                  label="Question title"
                  value={form.values.title}
                  {...form.getInputProps("title")}
                />
                <Textarea
                  label="Question description"
                  value={form.values.description}
                  {...form.getInputProps("description")}
                />

                <Button type="submit">Lưu thay đổi</Button>
              </Stack>
            </form>
          </Modal>
        </Card>
      </form>
    </div>
  );
}
