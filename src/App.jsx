import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Auth from './pages/AuthPage.jsx'
import './styles/main.css'
import AuthPage from "./pages/AuthPage.jsx";

function App() {


  return (
    <>
      <BrowserRouter>
          <Routes>
              <Route path="/login" element={<AuthPage defaultTab="login" />} />
              <Route path="/register" element={<AuthPage defaultTab="register" />} />
              <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
