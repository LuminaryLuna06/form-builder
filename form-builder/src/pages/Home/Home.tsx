import {
  Button,
  Container,
  Stack,
  Title,
  Card,
  Group,
  Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { FormData } from "../../types/form";

export default function Home() {
  const [forms, setForms] = useState<FormData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const allForms: FormData[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("form_")) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            allForms.push(parsed);
          } catch (err) {
            console.error("Lỗi khi đọc form:", err);
          }
        }
      }
    }

    setForms(allForms);
  }, []);

  const createForm = () => {
    const newId = uuidv4();
    navigate(`/create-form/${newId}`);
  };
  const deleteForm = (id: string) => {
    localStorage.removeItem("form_" + id);
    setForms((prev) => prev.filter((form) => form.id !== id));
  };

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>Chào mừng đến MSForm</Title>

        <Button onClick={createForm}>➕ Tạo biểu mẫu mới</Button>

        <Title order={4} mt="lg">
          📋 Danh sách biểu mẫu đã tạo:
        </Title>

        {forms.length === 0 && <Text>Chưa có biểu mẫu nào.</Text>}

        {forms.map((form) => (
          <Card key={form.id} withBorder shadow="xs">
            <Group justify="space-between">
              <Text fw={500}>{form.title || "Biểu mẫu không tiêu đề"}</Text>
              <Group>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => navigate(`/create-form/${form.id}`)}
                >
                  ✏️ Chỉnh sửa
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => navigate(`/preview/${form.id}`)}
                >
                  👁️ Xem
                </Button>
                <Button
                  variant="outline"
                  color="red"
                  size="xs"
                  onClick={() => deleteForm(form.id)}
                >
                  🗑️ Xoá
                </Button>
              </Group>
            </Group>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
