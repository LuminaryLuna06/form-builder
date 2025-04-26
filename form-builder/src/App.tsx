import React from "react";
import { HeaderSearch } from "./components/layout/Header/HeaderSearch";
import FormBuilder from "./components/FormBuilder";
import { HashRouter as Router } from "react-router-dom";
import PublicRoutes from "./routes/PublicRoutes";
function App() {
  return (
    <div>
      <Router>
        <HeaderSearch />
        <PublicRoutes />
      </Router>
    </div>
  );
}

export default App;
