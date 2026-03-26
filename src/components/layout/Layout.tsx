import Sidebar from "../layout/Sidebar/Sidebar";
import Navbar from "../layout/Navbar/Navbar";

export default function Layout({ children }: any) {
    return (
        <div style={{ display: "flex" }}>
            <Sidebar />

            <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <Navbar />

                <div style={{ padding: "20px" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}