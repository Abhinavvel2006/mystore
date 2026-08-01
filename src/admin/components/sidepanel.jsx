import { useState } from "react";
import Logo from "../assets/images/mystore-logo.svg";
import { NavLink, useNavigate } from "react-router-dom";
import "./sidepanel.css";

function Sidepanel(){
const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("admin");
        navigate("/admin", { replace: true });
    };

    return(
        <div className="sidepanel-container">
            <div className="sidepanel-header">
                <img src={Logo} alt="logo" />
                <h6>ADMIN PANEL</h6>
            </div>
            <div className="sidepanel-navigation">
                <nav className="sidepanelnav">
                    <ul className="sidepanel-lists">
                        <li>
                            <NavLink to="/admin/dashboard">Dashboard</NavLink>
                        </li>
                        <h6>MANAGEMENT</h6>
                        <li>
                            <NavLink to="/admin/Products">Products</NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/orders">Orders</NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/Categories">Categories</NavLink>
                        </li>
                        <h6>SETTINGS</h6>
                        <li>
                            <NavLink to="/admin/Payment">Payment</NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/Settings">Settings</NavLink>
                        </li>
                        <li className="sidepanel-logout">
                            <button type="button" className="sidepanel-logout-btn" onClick={handleLogout}>
                                Logout
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}

export default Sidepanel;