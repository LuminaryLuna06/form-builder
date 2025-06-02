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
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/authContext";

export default function Home() {
  const [forms, setForms] = useState<FormData[]>([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Assuming you have a useAuth hook to get current user
  console.log("Current User:", currentUser?.uid);
  useEffect(() => {
    const fetchForms = async () => {
      if (!currentUser?.uid) return; // Ensure uid is defined
      try {
        const snapshot = await getDocs(collection(db, "forms"));
        const formList = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<FormData, "id">),
          }))
          .filter((form) => form.userUID === currentUser.uid) as FormData[];
        setForms(formList);
      } catch (err) {
        console.error("Lỗi khi tải forms:", err);
      }
    };

    fetchForms();
  }, [currentUser?.uid]);

  const createForm = () => {
    const newId = uuidv4();
    navigate(`/create-form/${newId}`);
  };

  const createQuiz = () => {
    const newId = uuidv4();
    navigate(`/create-form/${newId}?isQuiz=true`);
  };
  const deleteForm = async (id: string) => {
    try {
      await deleteDoc(doc(db, "forms", id));
      setForms((prev) => prev.filter((form) => form.id !== id));
    } catch (err) {
      console.error("Lỗi khi xóa form:", err);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>Chào mừng đến MSForm Fake</Title>

        <Group>
          <Button onClick={createForm}>➕ Tạo biểu mẫu mới</Button>
          <Button onClick={createQuiz}>📝 Tạo bài trắc nghiệm</Button>
        </Group>

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
