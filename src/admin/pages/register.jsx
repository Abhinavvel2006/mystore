import { NavLink } from "react-router-dom";
import "./register.css";

function AdminRegister() {
  return (
    <div className="admin-register-container">
      <div className="admin-register-card">
        <div className="admin-register-icon">A</div>
        <h2>Create Admin Account</h2>
        <p>Register with your details to continue.</p>

        <form className="admin-register-form">
          <label>
            Full Name
            <input className="admin-register-input" type="text" placeholder="Enter your name" />
          </label>

          <label>
            Email Address
            <input className="admin-register-input" type="email" placeholder="Enter your email" />
          </label>

          <label>
            Password
            <input className="admin-register-input" type="password" placeholder="Create password" />
          </label>

          <button className="admin-register-btn" type="submit">
            Register
          </button>
        </form>

        <div className="admin-register-footer">
          <span>Already have an account?</span>
          <NavLink to="/admin/login">Login</NavLink>
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;