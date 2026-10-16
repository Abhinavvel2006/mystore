import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faBagShopping } from "@fortawesome/free-solid-svg-icons";
import "./Login.css";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showOtp, setShowOtp] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      const loggedInUser = data.user?.email || email;
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ email: loggedInUser }),
      );
      alert(data.message);
      window.location.href = "/";
    } else {
      alert(data.message);
    }
  };

  const provider = new GoogleAuthProvider();

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const response = await fetch("http://localhost:5000/api/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
          provider: "google",
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));

        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendOtp = async () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "normal",
          },
        );

        await window.recaptchaVerifier.render();
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier,
      );

      setConfirmationResult(confirmation);
      setShowOtp(true);

      alert("OTP Sent Successfully");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };
  const verifyOtp = async () => {
    try {
      const result = await confirmationResult.confirm(otp);

      console.log(result.user);

      alert("Phone number verified successfully");
    } catch (error) {
      console.error(error);
      alert("Invalid OTP.");
    }
  };

  return (
    <>
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
              <button
                type="button"
                className="social-btn"
                onClick={googleLogin}
              >
                <span aria-hidden="true">G</span>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="social-btn"
                onClick={() => setShowPhoneModal(true)}
              >
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
      {showPhoneModal && (
        <div className="phone-modal">
          <div className="phone-card">
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowPhoneModal(false)}
            >
              ✕
            </button>
            <h2>Phone Login</h2>

            <p>Enter your mobile number to continue</p>
            <input
              type="tel"
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="login-input"
            />

            <button type="button" className="submit-btn" onClick={sendOtp}>
              Send OTP
            </button>

            {showOtp && (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="login-input"
                />

                <button
                  type="button"
                  className="submit-btn"
                  onClick={verifyOtp}
                >
                  Verify OTP
                </button>
              </>
            )}

            <div id="recaptcha-container"></div>
          </div>
        </div>
      )}
    </>
  );
}

export default Login;
