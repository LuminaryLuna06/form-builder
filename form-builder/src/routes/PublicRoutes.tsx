import { Routes, Route } from "react-router-dom";
import PreviewForm from "../components/PreviewForm";
import FormBuilder from "../components/FormBuilder";
import Home from "../pages/Home/Home";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create-form/:id" element={<FormBuilder />} />
      <Route path="/preview/:id" element={<PreviewForm />} />
    </Routes>
  );
}
