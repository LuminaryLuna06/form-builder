import { Routes, Route } from "react-router-dom";
import FormSubmission from "../components/FormSubmission";
import FormSubmitted from "../components/FormSubmitted";
import LoginPage from "../components/auth/login";
import RegisterPage from "../components/auth/register";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/form-submit/:id" element={<FormSubmission />} />
      <Route path="/form-submitted/:id" element={<FormSubmitted />} />
    </Routes>
  );
}
