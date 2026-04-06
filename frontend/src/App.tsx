import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { JoinPage } from "./pages/JoinPage";
import { MeetingPage } from "./pages/MeetingPage";
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
      <Route path="/auth" element={<AuthPage />} />
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
