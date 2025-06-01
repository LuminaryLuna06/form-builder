import { Routes, Route } from "react-router-dom";
import PreviewForm from "../components/PreviewForm";
import FormBuilder from "../components/FormBuilder";
import Home from "../pages/Home/Home";
import FormResponses from "../components/FormResponses";
import LoginPage from "../components/auth/login";
import RegisterPage from "../components/auth/register";

export default function UserRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      {/* <Route path="/register" element={<RegisterPage />} /> */}
      <Route path="/" element={<Home />} />
      <Route path="/create-form/:id" element={<FormBuilder />} />
      <Route path="/preview/:id" element={<PreviewForm />} />
      <Route path="/form-responses/:id" element={<FormResponses />} />
    </Routes>
  );
}
