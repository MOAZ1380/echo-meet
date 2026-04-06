import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { JoinPage } from "./pages/JoinPage";
import { LoginPage } from "./pages/LoginPage";
import { MeetingPage } from "./pages/MeetingPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RequestResetPage } from "./pages/RequestResetPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { RoomsPage } from "./pages/RoomsPage";

import "./App.css";

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/rooms" : "/join"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/request-reset" element={<RequestResetPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/meet/:roomId" element={<MeetingPage />} />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <RoomsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
