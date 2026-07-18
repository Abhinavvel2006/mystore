import { Outlet } from "react-router-dom";
import SidePanel from "../admin/components/sidepanel";

function AdminLayout(){
    return(
        <div style={{display: "flex"}}>
            <SidePanel />
            <main style={{ flex: 1, padding: "20px" }}>
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;