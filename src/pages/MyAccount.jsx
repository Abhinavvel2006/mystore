import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCheck,
  faCreditCard,
  faLeaf,
  faLocationDot,
  faLock,
  faRightFromBracket,
  faShieldHalved,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import ProfileAvatar from "../components/ProfileAvatar";
import {
  accountRequest,
  PAYMENT_METHODS,
  saveCurrentUser,
  signOutAccount,
  useCurrentUser,
} from "../services/account";
import "./MyAccount.css";

function profileFromUser(user) {
  return {
    name: user.name || "",
    age: user.age == null ? "" : String(user.age),
    phone: user.phone || "",
    location: user.location || "",
    deliveryAddress: user.deliveryAddress || "",
  };
}

function requestMessage(error) {
  return error instanceof TypeError || error instanceof SyntaxError
    ? "We couldn't reach the store. Check your connection and try again."
    : error.message || "Something went wrong. Please try again.";
}

function Feedback({ feedback }) {
  if (!feedback) return null;

  return (
    <p
      className={`my-account-feedback my-account-feedback--${feedback.tone}`}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      {feedback.tone === "success" && (
        <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
      )}
      {feedback.text}
    </p>
  );
}

export default function MyAccount() {
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: "/my-account",
          message: "Please sign in to manage your account.",
        }}
      />
    );
  }

  const identity =
    currentUser.id ||
    currentUser._id ||
    currentUser.uid ||
    currentUser.email ||
    currentUser.phone;

  return <AccountDetails key={identity} />;
}

function AccountDetails() {
  const navigate = useNavigate();
  const mounted = useRef(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [busy, setBusy] = useState("");
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [paymentFeedback, setPaymentFeedback] = useState(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    mounted.current = true;

    accountRequest("/account", { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        if (!data.user)
          throw new Error("Your account couldn't be loaded. Please try again.");
        saveCurrentUser(data.user);
        setUser(data.user);
        setProfile(profileFromUser(data.user));
        setPaymentMethod(data.user.paymentMethod || "");
        setLoadState("ready");
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          navigate("/login", {
            replace: true,
            state: {
              from: "/my-account",
              message: "Please sign in to manage your account.",
            },
          });
          return;
        }
        setLoadError(requestMessage(error));
        setLoadState("error");
      });

    return () => {
      active = false;
      mounted.current = false;
      controller.abort();
    };
  }, [loadAttempt, navigate]);

  function handleSessionError(error) {
    if (error.status !== 401) return false;
    navigate("/login", {
      replace: true,
      state: {
        from: "/my-account",
        message:
          "Your session has expired. Please sign in again to save your changes.",
      },
    });
    return true;
  }

  function changeProfile(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setProfileFeedback(null);
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (busy) return;
    setProfileFeedback(null);
    const name = profile.name.trim();
    const phone = profile.phone.trim();
    const digits = phone.replace(/\D/g, "");

    if (!name) {
      setProfileFeedback({ tone: "error", text: "Please enter your name." });
      return;
    }
    if (
      phone &&
      (!/^\+?[\d\s().-]+$/.test(phone) ||
        digits.length < 7 ||
        digits.length > 15)
    ) {
      setProfileFeedback({
        tone: "error",
        text: "Enter a contact number with 7–15 digits. You can include a country code, spaces, or brackets.",
      });
      return;
    }

    setBusy("profile");
    try {
      const data = await accountRequest("/account", {
        method: "PATCH",
        body: {
          name,
          age: profile.age === "" ? null : Number(profile.age),
          phone,
          location: profile.location.trim(),
          deliveryAddress: profile.deliveryAddress.trim(),
        },
      });
      if (!data.user)
        throw new Error("We couldn't confirm your changes. Please try again.");
      saveCurrentUser(data.user);
      if (!mounted.current) return;
      setUser(data.user);
      setProfile(profileFromUser(data.user));
      setProfileFeedback({
        tone: "success",
        text: "Your personal information has been saved.",
      });
    } catch (error) {
      if (mounted.current && !handleSessionError(error)) {
        setProfileFeedback({ tone: "error", text: requestMessage(error) });
      }
    } finally {
      if (mounted.current) setBusy("");
    }
  }

  async function savePaymentPreference(event) {
    event.preventDefault();
    if (busy) return;
    setPaymentFeedback(null);
    setBusy("payment");
    try {
      const data = await accountRequest("/account", {
        method: "PATCH",
        body: { paymentMethod },
      });
      if (!data.user)
        throw new Error(
          "We couldn't confirm your payment preference. Please try again.",
        );
      saveCurrentUser(data.user);
      if (!mounted.current) return;
      setUser(data.user);
      setPaymentMethod(data.user.paymentMethod || "");
      setPaymentFeedback({
        tone: "success",
        text: "Your payment preference has been saved.",
      });
    } catch (error) {
      if (mounted.current && !handleSessionError(error)) {
        setPaymentFeedback({ tone: "error", text: requestMessage(error) });
      }
    } finally {
      if (mounted.current) setBusy("");
    }
  }

  async function signOut() {
    if (busy) return;
    setBusy("signout");
    try {
      await signOutAccount();
    } catch {
      // The session is cleared locally even when the server cannot be reached.
    } finally {
      navigate("/", { replace: true });
    }
  }

  if (loadState !== "ready") {
    return (
      <div className="my-account-page">
        <Link className="my-account-back" to="/products">
          <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          Back to shopping
        </Link>
        <div
          className="my-account-load-panel"
          aria-busy={loadState === "loading"}
        >
          <span className="my-account-section-icon">
            <FontAwesomeIcon icon={faUser} aria-hidden="true" />
          </span>
          <h1>My account</h1>
          {loadState === "loading" ? (
            <p role="status">Getting your account ready…</p>
          ) : (
            <>
              <p role="alert">{loadError}</p>
              <button
                className="my-account-button my-account-button--primary"
                type="button"
                onClick={() => {
                  setLoadState("loading");
                  setLoadError("");
                  setLoadAttempt((attempt) => attempt + 1);
                }}
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const displayName =
    user.name?.trim() || user.email?.split("@")[0] || "MyStore member";
  const savedProfile = profileFromUser(user);
  const profileChanged = Object.keys(savedProfile).some(
    (key) => savedProfile[key] !== profile[key],
  );
  const paymentChanged = paymentMethod !== (user.paymentMethod || "");

  return (
    <div className="my-account-page">
      <Link className="my-account-back" to="/products">
        <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
        Back to shopping
      </Link>

      <header className="my-account-heading">
        <div>
          <p className="my-account-eyebrow">A little space, all yours</p>
          <h1>
            My account<span>.</span>
          </h1>
          <p>Your details, your preferences. Make yourself at home.</p>
        </div>
        <span className="my-account-member-badge">
          <FontAwesomeIcon icon={faLeaf} aria-hidden="true" />
          MyStore member
        </span>
      </header>

      <div className="my-account-layout">
        <aside className="my-account-sidebar" aria-label="Account overview">
          <div className="my-account-identity">
            <ProfileAvatar user={user} size="large" />
            <h2>{displayName}</h2>
            <p>{user.email || user.phone || "Welcome to your account"}</p>
            {user.location && (
              <span className="my-account-location">
                <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
                {user.location}
              </span>
            )}
          </div>
          <nav className="my-account-nav" aria-label="Account sections">
            <a href="#personal-information">
              <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              Personal information
              <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
            </a>
            <a href="#payment-preferences">
              <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" />
              Payment preferences
              <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
            </a>
          </nav>
          <div className="my-account-sidebar-footer">
            <p>
              <FontAwesomeIcon icon={faLock} aria-hidden="true" /> Your details
              stay with your account.
            </p>
            <button type="button" onClick={signOut} disabled={Boolean(busy)}>
              <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
              {busy === "signout" ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </aside>

        <div className="my-account-content">
          <section
            className="my-account-panel"
            id="personal-information"
            aria-labelledby="personal-information-title"
          >
            <div className="my-account-panel-heading">
              <span className="my-account-section-icon">
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              </span>
              <div>
                <h2 id="personal-information-title">Personal information</h2>
                <p>A few details for a more personal shopping experience.</p>
              </div>
            </div>

            <form onSubmit={saveProfile} aria-busy={busy === "profile"}>
              <fieldset className="my-account-fields" disabled={Boolean(busy)}>
                <legend className="my-account-sr-only">
                  Your personal details
                </legend>
                <div className="my-account-field">
                  <label htmlFor="profile-name">
                    Full name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="profile-name"
                    name="name"
                    value={profile.name}
                    onChange={changeProfile}
                    autoComplete="name"
                    maxLength={80}
                    required
                    placeholder="Your full name"
                  />
                </div>
                <div className="my-account-field">
                  <label htmlFor="profile-email">
                    Email address{" "}
                    <span className="my-account-field-tag">Read only</span>
                  </label>
                  <input
                    id="profile-email"
                    value={user.email || "Not added (phone sign-in)"}
                    readOnly
                    aria-describedby="profile-email-hint"
                  />
                  <p id="profile-email-hint">
                    The email linked to your sign-in.
                  </p>
                </div>
                <div className="my-account-field">
                  <label htmlFor="profile-age">
                    Age <span className="my-account-optional">Optional</span>
                  </label>
                  <input
                    id="profile-age"
                    name="age"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={120}
                    step={1}
                    value={profile.age}
                    onChange={changeProfile}
                    placeholder="Your age"
                  />
                </div>
                <div className="my-account-field">
                  <label htmlFor="profile-phone">
                    Contact number{" "}
                    <span className="my-account-optional">Optional</span>
                  </label>
                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={profile.phone}
                    onChange={changeProfile}
                    placeholder="e.g. +91 98765 43210"
                    aria-describedby="profile-phone-hint"
                  />
                  <p id="profile-phone-hint">
                    Include your country code for international numbers.
                  </p>
                </div>
                <div className="my-account-field my-account-field--wide">
                  <label htmlFor="profile-location">
                    Location{" "}
                    <span className="my-account-optional">Optional</span>
                  </label>
                  <input
                    id="profile-location"
                    name="location"
                    autoComplete="address-level2"
                    maxLength={120}
                    value={profile.location}
                    onChange={changeProfile}
                    placeholder="City, state or region"
                  />
                </div>
                <div className="my-account-field my-account-field--wide">
                  <label htmlFor="profile-delivery-address">
                    Delivery address{" "}
                    <span className="my-account-optional">Optional</span>
                  </label>
                  <textarea
                    id="profile-delivery-address"
                    name="deliveryAddress"
                    autoComplete="street-address"
                    maxLength={500}
                    rows={3}
                    value={profile.deliveryAddress}
                    onChange={changeProfile}
                    placeholder="House or flat number, street, area and postal code"
                  />
                </div>
              </fieldset>

              <div className="my-account-form-footer">
                <div className="my-account-form-status">
                  <Feedback feedback={profileFeedback} />
                  {!profileFeedback && (
                    <p>
                      {profileChanged
                        ? "You have unsaved changes."
                        : "Keep your details up to date."}
                    </p>
                  )}
                </div>
                <div className="my-account-actions">
                  <button
                    className="my-account-button my-account-button--secondary"
                    type="button"
                    disabled={Boolean(busy) || !profileChanged}
                    onClick={() => {
                      setProfile(profileFromUser(user));
                      setProfileFeedback(null);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    className="my-account-button my-account-button--primary"
                    type="submit"
                    disabled={Boolean(busy) || !profileChanged}
                  >
                    {busy === "profile" ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section
            className="my-account-panel"
            id="payment-preferences"
            aria-labelledby="payment-preferences-title"
          >
            <div className="my-account-panel-heading">
              <span className="my-account-section-icon my-account-section-icon--warm">
                <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" />
              </span>
              <div>
                <h2 id="payment-preferences-title">Payment preferences</h2>
                <p>Choose how you usually like to pay.</p>
              </div>
            </div>

            <form
              onSubmit={savePaymentPreference}
              aria-busy={busy === "payment"}
            >
              <fieldset
                className="my-account-payment-options"
                disabled={Boolean(busy)}
              >
                <legend>Preferred payment method</legend>
                {PAYMENT_METHODS.map((method) => (
                  <label
                    className={`my-account-payment-option${paymentMethod === method.id ? " is-selected" : ""}`}
                    key={method.id}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => {
                        setPaymentMethod(method.id);
                        setPaymentFeedback(null);
                      }}
                    />
                    <span>
                      <strong>{method.label}</strong>
                      <span>{method.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <div className="my-account-payment-note">
                <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
                <div>
                  <strong>Card details stay secure</strong>
                  <p>
                    We save your payment preference here. Enter card details
                    securely at Razorpay checkout; your card number and CVV are
                    never stored in this profile.
                  </p>
                </div>
              </div>

              <div className="my-account-form-footer">
                <div className="my-account-form-status">
                  <Feedback feedback={paymentFeedback} />
                  {!paymentFeedback && (
                    <p>
                      {paymentChanged
                        ? "You have an unsaved preference."
                        : "You can choose another method at checkout."}
                    </p>
                  )}
                </div>
                <button
                  className="my-account-button my-account-button--primary"
                  type="submit"
                  disabled={Boolean(busy) || !paymentChanged}
                >
                  {busy === "payment" ? "Saving…" : "Save preference"}
                </button>
              </div>
            </form>
          </section>

          <p className="my-account-help">
            Need a hand with your account?{" "}
            <Link to="/contact">
              We're here to help{" "}
              <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
