import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import './styles/main.css'
import AuthPage from "./pages/AuthPage.jsx";
import MyLoanPage from "./pages/MyLoanPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import BooksPage from "./pages/BooksPage.jsx";
import BookDetailsPage from "./pages/BookDetailsPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.jsx"
import StaffRoute from "./components/ProtectedRoute/StaffRoute.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx"
import MyReviewsPage from "./pages/MyReviewsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx"
import UserDashboardPage from "./pages/UserDashboardPage.jsx"
import MyReservationsPage from "./pages/MyReservationsPage.jsx";
import AdminReservationsPage from "./pages/AdminReservationsPage.jsx";

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
          <Routes>
              <Route path="/login" element={<AuthPage defaultTab="login" />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/register" element={<AuthPage defaultTab="register" />} />
              <Route path="/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
              <Route path="/books/:id" element={<ProtectedRoute><BookDetailsPage /></ProtectedRoute>} />
              <Route path="/my-loans" element={<ProtectedRoute><MyLoanPage /></ProtectedRoute>} />
              <Route path="/mon-compte/reservations" element={<ProtectedRoute><MyReservationsPage /></ProtectedRoute>} />
              <Route path="/mes-avis" element={<ProtectedRoute><MyReviewsPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<StaffRoute><DashboardPage /></StaffRoute>} />
              <Route path="/admin/reservations" element={<StaffRoute><AdminReservationsPage /></StaffRoute>} />
              <Route path="/my-dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
