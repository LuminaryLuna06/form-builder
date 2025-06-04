import { HeaderSearch } from "./components/layout/Header/HeaderSearch";
import { HashRouter as Router } from "react-router-dom";
import PublicRoutes from "./routes/PublicRoutes";
import UserRoutes from "./routes/UserRoutes";
import { AuthProvider } from "./context/authContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Router>
        <AuthProvider>
          <HeaderSearch />
          <UserRoutes />
        </AuthProvider>
        <PublicRoutes />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
