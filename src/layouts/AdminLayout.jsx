import { useState } from "react";
import { Outlet } from "react-router-dom";
import SidePanel from "../admin/components/sidepanel";
import AdminHeader from "../admin/components/header";

function AdminLayout() {
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
            {isSidePanelOpen && <SidePanel />}
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <AdminHeader
                    isMenuOpen={isSidePanelOpen}
                    onToggleMenu={() => setIsSidePanelOpen((prev) => !prev)}
                />
                <div style={{ padding: "20px" }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;