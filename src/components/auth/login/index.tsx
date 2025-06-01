import { useState } from "react";
import { useForm, yupResolver } from "@mantine/form";
import {
  Button,
  TextInput,
  PasswordInput,
  Stack,
  Title,
  Text,
  Divider,
  Paper,
} from "@mantine/core";
import * as Yup from "yup";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom"; // For navigation to signup page
import {
  doSignInWithEmailAndPassword,
  doSignInWithGoogle,
} from "../../../firebase/auth";

// Validation schema using Yup
const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// Types for form data
interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  // Initialize Mantine form with Yup validation
  const form = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: yupResolver(loginSchema),
  });

  // Handle email/password login
  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await doSignInWithEmailAndPassword(values.email, values.password);
      navigate("/"); // Redirect to home or dashboard after successful login
      console.log("Successfully signed in with email");
    } catch (error: any) {
      console.error("Login error:", error);
      form.setErrors({ email: error.message || "Invalid credentials" });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await doSignInWithGoogle();
      navigate("/"); // Redirect to home or dashboard after successful login
      console.log("Successfully signed in with Google");
    } catch (error: any) {
      console.error("Google login error:", error);
      form.setErrors({ email: error.message || "Google login failed" });
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to signup page
  const handleCreateAccount = () => {
    navigate("/signup");
  };

  return (
    <Paper
      shadow="sm"
      p="xl"
      withBorder
      style={{ maxWidth: 400, margin: "auto", marginTop: 100 }}
    >
      <Stack>
        <Title order={2} ta="center">
          Login
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Sign in with your email or Google account
        </Text>

        <form onSubmit={form.onSubmit(handleLogin)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps("email")}
              disabled={loading}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              {...form.getInputProps("password")}
              disabled={loading}
            />
            <Button type="submit" loading={loading} fullWidth>
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={handleCreateAccount}
              disabled={loading}
              fullWidth
            >
              Create Account
            </Button>
          </Stack>
        </form>

        <Divider label="Or continue with" labelPosition="center" />

        <Button
          variant="outline"
          leftSection={<IconBrandGoogle size={18} />}
          onClick={handleGoogleLogin}
          loading={loading}
          fullWidth
        >
          Sign in with Google
        </Button>
      </Stack>
    </Paper>
  );
}
