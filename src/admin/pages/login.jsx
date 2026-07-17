import { NavLink } from "react-router-dom";
import "./login.css";

function AdminLogin() {
    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="admin-login-icon">A</div>
                <h2>Admin Login</h2>
                <p>Sign in to your admin account.</p>

                <form className="admin-login-form">
                    <label>
                        Email Address
                        <input className="admin-login-input" type="email" placeholder="Enter your email" />
                    </label>

                    <label>
                        Password
                        <input className="admin-login-input" type="password" placeholder="Enter your password" />
                    </label>

                    <button className="admin-login-btn" type="submit">
                        Login
                    </button>
                </form>

                <div className="admin-login-footer">
                    <span>New admin?</span>
                    <NavLink to="/admin/register">Register</NavLink>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;