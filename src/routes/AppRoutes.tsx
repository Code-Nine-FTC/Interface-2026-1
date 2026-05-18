import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";

import Chatbot from "../pages/Chatbot";
import Dashboard from "../pages/Dashboard";
import FiltersPage from "../pages/Filters";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Chatbot />} />
                    <Route path="/chatbot" element={<Chatbot />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/filtros" element={<FiltersPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}