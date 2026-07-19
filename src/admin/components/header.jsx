import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faBars,faBell,faChevronDown} from "@fortawesome/free-solid-svg-icons";
import "./header.css";

function AdminHeader({ isMenuOpen, onToggleMenu }) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    return (
        <div className="adminheader-container">
            <div className="adminheader-left">
                <button
                    className="menu-toggle"
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    onClick={onToggleMenu}
                >
                    <FontAwesomeIcon icon={faBars} />
                </button>
            </div>

            <div className="adminheader-right">
                <button className="header-icon-btn" aria-label="Notifications">
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
                            <button className="profile-menu-item" role="menuitem">
                                <span>Switch role</span>
                            </button>
                            <button className="profile-menu-item logout" role="menuitem">
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