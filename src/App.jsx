import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import './styles/main.css'
import AuthPage from "./pages/AuthPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx"

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
          <Routes>

              {/* Exemple de route protégée qui vérifie le token dans le session storage */}
              <ProtectedRoute>
              {/*    <RouteAProteger />*/}
              </ProtectedRoute>

              <Route path="/login" element={<AuthPage defaultTab="login" />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/register" element={<AuthPage defaultTab="register" />} />
              <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
