import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Report from "../pages/Report";
import Chatbot from "../pages/Chatbot";
import Dashboard from "../pages/Dashboard";
import FiltersPage from "../pages/Filters";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/chatbot" replace />} />
                <Route path="/login" element={<Navigate to="/chatbot" replace />} />
                <Route element={<Layout />}>
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/filtros" element={<FiltersPage />} />
                    <Route path="/relatorio" element={<Report />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}