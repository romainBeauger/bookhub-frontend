import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasStaffAccess } from "../../utils/auth.js";

export default function StaffRoute({ children }) {
    const { token, user } = useAuth();

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (!hasStaffAccess(user)) {
        return <Navigate to="/books" replace />;
    }

    return children;
}
