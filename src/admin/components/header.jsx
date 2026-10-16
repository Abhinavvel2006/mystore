import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import "./header.css";

function AdminHeader() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="adminheader-container">
      <div className="adminheader-left">
        <button className="admin-menu-toggle" aria-label="Menu">
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      <div className="adminheader-right">
        <button
          className="header-icon-btn"
          aria-label="Notifications"
          onClick={() => navigate("/admin/notifications")}
        >
          <FontAwesomeIcon icon={faBell} />
        </button>

        <div className="admin-profile-wrapper">
          <button
            className="admin-profile"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          >
            <div className="admin-profile-avatar">A</div>
            <div className="admin-profile-details">
              <span className="admin-profile-name">Admin</span>
              <span className="admin-profile-role">Super Admin</span>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`profile-chevron ${isProfileMenuOpen ? "open" : ""}`}
            />
          </button>

          {isProfileMenuOpen && (
            <div className="admin-profile-menu" role="menu">
              <button
                className="profile-menu-item logout"
                role="menuitem"
                onClick={handleLogout}
              >
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminHeader;
