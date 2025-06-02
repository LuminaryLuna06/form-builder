import { Routes, Route } from "react-router-dom";
import PreviewForm from "../components/PreviewForm";
import FormBuilder from "../components/FormBuilder";
import Home from "../pages/Home/Home";
import FormResponses from "../components/FormResponses";
import ProtectedRoutes from "./ProtectedRoutes";

export default function UserRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
        <Route path="/create-form/:id" element={<FormBuilder />} />
        <Route path="/preview/:id" element={<PreviewForm />} />
        <Route path="/form-responses/:id" element={<FormResponses />} />
      </Route>
    </Routes>
  );
}
