import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";
import "./login-refresh.css";

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
        },
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
    <div className="admin-login-container admin-login-refresh">
      <section className="admin-login-intro">
        <Link to="/" className="admin-login-wordmark">
          mystore<span>WORKSPACE</span>
        </Link>
        <div>
          <span className="admin-login-eyebrow">
            A little order. A lot of possibility.
          </span>
          <h1>
            Your store.
            <br />
            One clear view.
          </h1>
          <p>
            The space to organize your catalogue, manage inventory, and keep
            your business moving.
          </p>
          <div className="admin-login-features">
            <span>
              01 <b>Manage your products</b>
            </span>
            <span>
              02 <b>Keep inventory in check</b>
            </span>
            <span>
              03 <b>Stay on top of orders</b>
            </span>
          </div>
        </div>
        <small>MyStore · Administration</small>
      </section>
      <section className="admin-login-form-area">
        <div className="admin-login-card">
          <div className="admin-login-icon">A</div>

          <h2>Welcome back</h2>

          <p>Sign in to your MyStore workspace.</p>

          <form className="admin-login-form" onSubmit={handleLogin}>
            <label>
              Email Address
              <input
                className="admin-login-input"
                type="email"
                autoComplete="username"
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
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button className="admin-login-btn" type="submit">
              Sign in to workspace
            </button>
          </form>
          <Link to="/" className="admin-login-return">
            ← Back to storefront
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AdminLogin;
