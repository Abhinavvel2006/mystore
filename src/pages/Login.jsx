import { useState } from "react";
import { NavLink,useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faPhone, faBagShopping } from "@fortawesome/free-solid-svg-icons";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        const response = await fetch(
            "http://localhost:5000/api/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            }
        );

        const data = await response.json();

        if (data.success) {
            const loggedInUser = data.user?.email || email;
            localStorage.setItem("currentUser", JSON.stringify({ email: loggedInUser }));
            alert(data.message);
            window.location.href = "/";
        } else {
            alert(data.message);
        }
    };

    return (
        <section className="login-page">
            <div className="login-container">
                <div className="login-icon">
                    <FontAwesomeIcon icon={faBagShopping} />
                </div>

                <h2>Welcome Back</h2>
                <p>Sign in to your account to continue shopping</p>

                <form onSubmit={handleLogin} method="post">
                    <label htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <div className="password-row">
                        <label htmlFor="login-password">Password</label>
                        <a href="/">Forgot password?</a>
                    </div>

                    <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label className="remember">
                        <input type="checkbox" />
                        <span>Remember me</span>
                    </label>

                    <button type="submit" className="submit-btn">
                        Sign In
                    </button>

                    <div className="divider">
                        <span>OR CONTINUE WITH</span>
                    </div>

                    <div className="social-buttons">
                        <button type="button" className="social-btn">
                            <FontAwesomeIcon icon={faGoogle} />
                            <span>Google</span>
                        </button>

                        <button type="button" className="social-btn">
                            <FontAwesomeIcon icon={faPhone} />
                            <span>Phone</span>
                        </button>
                    </div>

                    <div className="signin-link">
                        <span>Don't have an account?</span>
                        <NavLink to="/register">Sign up</NavLink>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default Login;