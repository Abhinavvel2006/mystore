import { useState } from "react";
import { NavLink,useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faPhone, faBagShopping } from "@fortawesome/free-solid-svg-icons";
import "./Register.css";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/firebase";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        const response = await fetch(
            "http://localhost:5000/api/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    confirmPassword,
                }),
            }
        );

        const data = await response.json();

        if (data.success) {
            const registeredUser = data.user?.email || email;
            localStorage.setItem("currentUser", JSON.stringify({ email: registeredUser }));
            alert(data.message);
            navigate("/login");
        } else {
            alert(data.message);
        }
    };

    const provider = new GoogleAuthProvider();
    const googleRegister = async () => {
        try{
            const result = await signInWithPopup(auth, provider);

            const user = result.user;

            localStorage.setItem(
                "currentUser",
                JSON.stringify({
                    name: user.displayName,
                    email: user.email,
                    provider: "google",
                })
            );

            const response = await fetch("http://localhost:5000/api/google-login",
                {
                    method: "POST",
                    headers:{
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: user.displayName,
                        email: user.email,
                        provider: "google",
                    }),
                }
            );

            const data = await response.json();
            
            if (data.success) {
                window.location.href="/";
            }
            else{
                alert(data.message);
            }
        }

        catch(error){
            console.error(error);
        }
    };

    return (
        <section className="register-page">
            <div className="register-container">
                <div className="register-icon">
                    <FontAwesomeIcon icon={faBagShopping} />
                </div>

                <h2>Create an Account</h2>
                <p>Sign up to start shopping</p>

                <form onSubmit={handleRegister}>
                    <label htmlFor="register-email">Email</label>
                    <input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        className="register-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label htmlFor="register-password">Password</label>
                    <input
                        id="register-password"
                        type="password"
                        placeholder="Enter your password"
                        className="register-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label htmlFor="register-confirm-password">
                        Confirm Password
                    </label>
                    <input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className="register-input"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                    />

                    <button type="submit" className="submit-btn">
                        Sign Up
                    </button>

                    <div className="divider">
                        <span>OR CONTINUE WITH</span>
                    </div>

                    <div className="social-buttons">
                        <button type="button" className="social-btn" onClick={googleRegister}>
                            <FontAwesomeIcon icon={faGoogle} />
                            <span>Google</span>
                        </button>

                        <button type="button" className="social-btn">
                            <FontAwesomeIcon icon={faPhone} />
                            <span>Phone</span>
                        </button>
                    </div>

                    <div className="signin-link">
                        <span>Already have an account?</span>
                        <NavLink to="/login">Sign in</NavLink>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default Register;