import { Routes, Route } from "react-router-dom";
import PreviewForm from "../components/PreviewForm";
import FormBuilder from "../components/FormBuilder";
import Home from "../pages/Home/Home";
// import FormFiller from "../components/FormFiller";
import FormSubmission from "../components/FormSubmission";
import FormSubmitted from "../components/FormSubmitted";
import FormResponses from "../components/FormResponses";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create-form/:id" element={<FormBuilder />} />
      <Route path="/preview/:id" element={<PreviewForm />} />
      <Route path="/form-submit/:id" element={<FormSubmission />} />
      <Route path="/form-submitted/:id" element={<FormSubmitted />} />
      <Route path="/form-responses/:id" element={<FormResponses />} />
    </Routes>
  );
}
