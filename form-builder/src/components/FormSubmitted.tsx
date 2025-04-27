// src/FormSubmitted.tsx
import { Container, Title, Text } from "@mantine/core";

export default function FormSubmitted() {
  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="md">
        Thank You!
      </Title>
      <Text mb="xl">Your form has been submitted successfully.</Text>
    </Container>
  );
}
