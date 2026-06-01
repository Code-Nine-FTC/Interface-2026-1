import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Report from "../pages/Report";
import Chatbot from "../pages/Chatbot";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import FiltersPage from "../pages/Filters";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/chatbot" replace />} />
                <Route path="/login" element={<Navigate to="/chatbot" replace />} />
                
                <Route element={<Layout />}>
                    <Route path="/filtros" element={
                        <ProtectedRoute>
                            <FiltersPage />
                            </ProtectedRoute>
                    } />
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/relatorio"
                        element={
                            <ProtectedRoute>
                                <Report />
                            </ProtectedRoute>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
