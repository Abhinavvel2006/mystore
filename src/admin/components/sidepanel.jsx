import { useState } from "react";
import Logo from "../assets/images/mystore-logo.svg";
import { NavLink } from "react-router-dom";
import "./sidepanel.css";

function Sidepanel(){
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
                            <NavLink to="/admin/Categories">Categories</NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/Orders">Orders</NavLink>
                        </li>
                        <h6>SETTINGS</h6>
                        <li>
                            <NavLink to="/admin/Payment">Payment</NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/Settings">Settings</NavLink>
                        </li>
                        <li className="sidepanel-logout">
                            <NavLink to="/admin/logut">Logout</NavLink>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}

export default Sidepanel;