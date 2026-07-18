import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

function AdminLogin() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {

            const response = await axios.post(
                "http://localhost:5000/api/admin/login",
                {
                    email,
                    password,
                }
            );

            if (response.data.success) {
                alert(response.data.message);

                localStorage.setItem("admin", JSON.stringify(response.data.admin));

                navigate("/admin/dashboard");
            }

        } catch (error) {

            if (error.response) {
                alert(error.response.data.message);
            } else {
                alert("Server Error");
            }

        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">

                <div className="admin-login-icon">A</div>

                <h2>Admin Login</h2>

                <p>Sign in to your admin account.</p>

                <form
                    className="admin-login-form"
                    onSubmit={handleLogin}
                >

                    <label>
                        Email Address

                        <input
                            className="admin-login-input"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                    </label>

                    <label>

                        Password

                        <input
                            className="admin-login-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                    </label>

                    <button
                        className="admin-login-btn"
                        type="submit"
                    >
                        Login
                    </button>

                </form>

            </div>
        </div>
    );
}

export default AdminLogin;