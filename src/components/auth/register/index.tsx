import { useState } from "react";
import { useForm, yupResolver } from "@mantine/form";
import {
  Button,
  TextInput,
  PasswordInput,
  Stack,
  Title,
  Text,
  Paper,
  Anchor,
} from "@mantine/core";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { doCreateUserWithEmailAndPassword } from "../../../firebase/auth";

// Validation schema using Yup
const registerSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

// Types for form data
interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Initialize Mantine form with Yup validation
  const form = useForm<RegisterFormValues>({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: yupResolver(registerSchema),
  });

  // Handle email/password registration
  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      await doCreateUserWithEmailAndPassword(values.email, values.password);
      console.log("Successfully registered with email");
      navigate("/"); // Redirect to home or login page after successful registration
    } catch (error: any) {
      console.error("Registration error:", error);
      form.setErrors({ email: error.message || "Registration failed" });
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
        <Title order={2} ta="center">
          Create Account
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Sign up with your email or Google account
        </Text>

        <form onSubmit={form.onSubmit(handleRegister)}>
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
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              {...form.getInputProps("confirmPassword")}
              disabled={loading}
            />
            <Button type="submit" loading={loading} fullWidth>
              Sign Up
            </Button>
          </Stack>
        </form>
        <Text c="dimmed" size="sm" ta="center">
          Already have an account?{" "}
          <Anchor
            onClick={(e) => {
              if (loading) {
                e.preventDefault();
                return;
              }
              navigate("/login");
            }}
            style={loading ? { pointerEvents: "none", opacity: 0.5 } : {}}
          >
            Sign in
          </Anchor>
        </Text>
      </Stack>
    </Paper>
  );
}
