import { HeaderSearch } from "./components/layout/Header/HeaderSearch";
import { HashRouter as Router } from "react-router-dom";
import PublicRoutes from "./routes/PublicRoutes";
import UserRoutes from "./routes/UserRoutes";
import { AuthProvider } from "./context/authContext";
function App() {
  return (
    <Router>
      <AuthProvider>
        <HeaderSearch />
        <UserRoutes />
      </AuthProvider>
      <PublicRoutes />
    </Router>
  );
}

export default App;
