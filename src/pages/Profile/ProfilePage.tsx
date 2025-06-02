import { useState } from "react";
import { useForm, yupResolver } from "@mantine/form";
import {
  Title,
  Text,
  Button,
  Paper,
  Stack,
  TextInput,
  Avatar,
  Group,
  Notification,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import * as Yup from "yup";
import { useAuth } from "../../context/authContext";
import { updateProfile, getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doSignOut } from "../../firebase/auth";

// Validation schema for profile update
const profileSchema = Yup.object().shape({
  displayName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
});

interface ProfileFormValues {
  displayName: string;
}

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log("Current User:", currentUser);
  // Initialize form for updating display name
  const form = useForm<ProfileFormValues>({
    initialValues: {
      displayName: currentUser?.displayName || "",
    },
    validate: yupResolver(profileSchema),
  });

  // Handle profile update
  const handleUpdateProfile = async (values: ProfileFormValues) => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found");
      await updateProfile(user, { displayName: values.displayName });
      console.log("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await doSignOut();
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Failed to sign out");
      console.error("Sign out error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      shadow="sm"
      p="xl"
      withBorder
      style={{ maxWidth: 400, margin: "auto", marginTop: 100 }}
    >
      <Stack>
        <Title order={2}>Profile</Title>
        <Group justify="center">
          <Avatar
            src={currentUser?.photoURL || null}
            alt={currentUser?.displayName || currentUser?.email || "User"}
            radius="xl"
            size="lg"
          />
        </Group>
        <Text ta="center" c="dimmed">
          {currentUser?.email || "N/A"}
        </Text>

        {error && (
          <Notification
            icon={<IconAlertCircle size={18} />}
            color="red"
            onClose={() => setError(null)}
          >
            {error}
          </Notification>
        )}

        <form onSubmit={form.onSubmit(handleUpdateProfile)}>
          <Stack>
            <TextInput
              label="Display Name"
              placeholder="Your name"
              {...form.getInputProps("displayName")}
              disabled={loading}
            />
            <Button type="submit" loading={loading}>
              Update Profile
            </Button>
          </Stack>
        </form>
        <Button
          onClick={handleSignOut}
          loading={loading}
          color="red"
          variant="outline"
        >
          Sign Out
        </Button>
      </Stack>
    </Paper>
  );
}
