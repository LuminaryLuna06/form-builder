import { Routes, Route } from "react-router-dom";
import FormSubmission from "../components/FormSubmission";
import FormSubmitted from "../components/FormSubmitted";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/form-submit/:id" element={<FormSubmission />} />
      <Route path="/form-submitted/:id" element={<FormSubmitted />} />
    </Routes>
  );
}
