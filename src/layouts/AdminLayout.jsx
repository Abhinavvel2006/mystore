import { Outlet } from "react-router-dom";
import SidePanel from "../admin/components/sidepanel";
import AdminHeader from "../admin/components/header";
import "./AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <SidePanel />
      <div className="admin-main">
        <AdminHeader />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
