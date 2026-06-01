import { Navigate } from "react-router-dom";
import { estaAutenticado } from "../services/authService";

type ProtectedRouteProps = {
    children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    if (!estaAutenticado()) {
        return <Navigate to="/chatbot" replace />;
    }

    return <>{children}</>;
}
