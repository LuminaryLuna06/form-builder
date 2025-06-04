import {
  Button,
  Container,
  Stack,
  Title,
  Card,
  Group,
  Text,
  LoadingOverlay,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { FormData } from "../../types/form";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/authContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchForms = async (userId: string) => {
  const snapshot = await getDocs(collection(db, "forms"));
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<FormData, "id">),
    }))
    .filter((form) => form.userUID === userId) as FormData[];
};

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: forms = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["forms", currentUser?.uid],
    queryFn: () => fetchForms(currentUser!.uid),
    enabled: !!currentUser?.uid,
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "forms", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", currentUser?.uid] });
    },
  });

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
      await deleteFormMutation.mutateAsync(id);
    } catch (err) {
      console.error("Lỗi khi xóa form:", err);
    }
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Text c="red" size="lg" ta="center">
          {error instanceof Error ? error.message : "Failed to load forms"}
        </Text>
      </Container>
    );
  }

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
