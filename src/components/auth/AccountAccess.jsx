import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBagShopping,
  faCheck,
  faEye,
  faEyeSlash,
  faLeaf,
  faLock,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import PhoneAuthDialog from "./PhoneAuthDialog";
import "./Auth.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

async function postAccount(path, body) {
  const response = await fetch(`${API_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "We couldn't complete that request. Please try again.",
    );
  }
  return data;
}

function completeSignIn(user) {
  // Store only the profile fields used by the storefront.
  const { email, name, phone, provider, uid } = user;
  localStorage.setItem(
    "currentUser",
    JSON.stringify({ email, name, phone, provider, uid }),
  );
  window.location.assign("/");
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"
      />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  minLength,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="account-field">
      <label htmlFor={id}>{label}</label>
      <div className="account-password">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          required
        />
        <button
          type="button"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
        </button>
      </div>
    </div>
  );
}

export default function AccountAccess({ mode }) {
  const registering = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => location.state?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showPhone, setShowPhone] = useState(false);

  async function submitAccount(event) {
    event.preventDefault();
    setError("");
    if (registering && password !== confirmPassword) {
      setError("Your passwords don't match. Please check them and try again.");
      return;
    }
    setBusy("email");
    try {
      const data = await postAccount(registering ? "register" : "login", {
        email: email.trim(),
        password,
        ...(registering ? { confirmPassword } : {}),
      });
      if (registering) {
        navigate("/login", {
          replace: true,
          state: { registered: true, email: email.trim() },
        });
      } else {
        completeSignIn({
          email: data.user?.email || email.trim(),
          provider: "email",
        });
      }
    } catch (failure) {
      setError(
        failure instanceof TypeError || failure instanceof SyntaxError
          ? "We couldn't reach the store. Please check your connection and try again."
          : failure.message,
      );
    } finally {
      setBusy("");
    }
  }

  async function continueWithGoogle() {
    setError("");
    setBusy("google");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const data = await postAccount("google-login", {
        name: result.user.displayName,
        email: result.user.email,
        provider: "google",
      });
      completeSignIn({ ...data.user, provider: "google" });
    } catch (failure) {
      if (
        failure.code === "auth/popup-closed-by-user" ||
        failure.code === "auth/cancelled-popup-request"
      ) {
        setError(
          "Google sign-in was closed. You can try again whenever you're ready.",
        );
      } else if (failure.code === "auth/popup-blocked") {
        setError("Allow pop-ups for this site to continue with Google.");
      } else {
        setError(
          "Google sign-in is unavailable right now. Please try again or use your email.",
        );
      }
    } finally {
      setBusy("");
    }
  }

  return (
    <main
      className={`account-page ${registering ? "account-page-register" : ""}`}
    >
      <div className="account-shell">
        <aside className="account-story" aria-label="Welcome to MyStore">
          <Link to="/" className="account-brand" aria-label="MyStore home">
            <span className="account-brand-icon">
              <FontAwesomeIcon icon={faBagShopping} />
            </span>
            MyStore<span className="account-brand-dot">.</span>
          </Link>
          <div className="account-story-copy">
            <span className="account-eyebrow">A LITTLE MORE EVERYDAY</span>
            <h1>
              Good finds.
              <br /> Great <em>days.</em>
            </h1>
            <p>
              Your next favourite is waiting. Make yourself at home and discover
              a little something for you.
            </p>
          </div>
          <div className="account-art" aria-hidden="true">
            <div className="account-art-circle" />
            <div className="account-art-note">
              <FontAwesomeIcon icon={faLeaf} /> A fresh find, every time
            </div>
            <div className="account-bag account-bag-back">
              <span />
            </div>
            <div className="account-bag account-bag-front">
              <span />
              <FontAwesomeIcon icon={faBagShopping} />
              <strong>MyStore.</strong>
              <small>THE EVERYDAY, UPGRADED.</small>
            </div>
            <div className="account-art-check">
              <FontAwesomeIcon icon={faCheck} />
            </div>
            <span className="account-art-spark">✦</span>
          </div>
          <div className="account-story-footer">
            <span>Thoughtful finds. All in one place.</span>
            <span>FIND YOUR EVERYDAY</span>
          </div>
        </aside>
        <section className="account-panel" aria-labelledby="account-title">
          <div className="account-panel-top">
            <Link to="/" className="account-back">
              <FontAwesomeIcon icon={faArrowLeft} /> Back to shop
            </Link>
            <span className="account-panel-caption">YOUR MYSTORE ACCOUNT</span>
          </div>
          <div className="account-form-wrap">
            <div className="account-heading">
              <span className="account-eyebrow">
                {registering ? "LET'S GET YOU STARTED" : "A FAMILIAR PLACE"}
              </span>
              <h2 id="account-title">
                {registering ? "Make yourself at home." : "Welcome back."}
              </h2>
              <p>
                {registering
                  ? "Create an account for your next great find."
                  : "Sign in and pick up where you left off."}
              </p>
            </div>
            <nav className="account-switch" aria-label="Account access">
              <Link
                to="/login"
                className={!registering ? "is-active" : ""}
                aria-current={!registering ? "page" : undefined}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className={registering ? "is-active" : ""}
                aria-current={registering ? "page" : undefined}
              >
                Create account
              </Link>
            </nav>
            {!registering && location.state?.registered && !error && (
              <p className="account-feedback account-success" role="status">
                Your account is ready. Sign in to start shopping.
              </p>
            )}
            {error && (
              <p className="account-feedback account-error" role="alert">
                {error}
              </p>
            )}
            <form
              className="account-form"
              onSubmit={submitAccount}
              aria-busy={Boolean(busy)}
            >
              <div className="account-field">
                <label htmlFor={`${mode}-email`}>Email address</label>
                <input
                  id={`${mode}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <PasswordField
                id={`${mode}-password`}
                label="Password"
                autoComplete={registering ? "new-password" : "current-password"}
                placeholder={
                  registering ? "Create a password" : "Enter your password"
                }
                minLength={registering ? 6 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {registering && (
                <>
                  <p className="account-field-hint">
                    Use at least 6 characters.
                  </p>
                  <PasswordField
                    id="register-confirm-password"
                    label="Confirm password"
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </>
              )}
              {!registering && (
                <div className="account-form-help">
                  <span>
                    <FontAwesomeIcon icon={faLock} /> Your own little corner of
                    MyStore
                  </span>
                  <Link to="/contact">Need help?</Link>
                </div>
              )}
              <button
                type="submit"
                className="account-submit"
                disabled={Boolean(busy)}
              >
                {busy === "email"
                  ? registering
                    ? "Creating your account…"
                    : "Signing you in…"
                  : registering
                    ? "Create account"
                    : "Sign in"}
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </form>
            <div className="account-divider">
              <span>or continue with</span>
            </div>
            <div className="account-social">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={continueWithGoogle}
              >
                <GoogleMark /> {busy === "google" ? "Connecting…" : "Google"}
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => setShowPhone(true)}
              >
                <FontAwesomeIcon icon={faPhone} /> Phone
              </button>
            </div>
            <p className="account-alternate">
              {registering ? "Already part of MyStore?" : "New around here?"}{" "}
              <Link to={registering ? "/login" : "/register"}>
                {registering ? "Sign in" : "Create an account"}{" "}
                <span aria-hidden="true">↗</span>
              </Link>
            </p>
          </div>
          <footer className="account-panel-footer">
            <span>Made for your everyday.</span>
            <Link to="/contact">
              We're here to help <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </footer>
        </section>
      </div>
      {showPhone && (
        <PhoneAuthDialog
          onClose={() => setShowPhone(false)}
          onSuccess={completeSignIn}
        />
      )}
    </main>
  );
}
