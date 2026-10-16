import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import "./PhoneAuthDialog.css";

const RESEND_DELAY = 60;

function normalizePhone(value, countryCode) {
  let number = value.trim().replace(/[\s().-]/g, "");
  if (number.startsWith("00")) number = `+${number.slice(2)}`;
  if (!number.startsWith("+")) {
    if (!countryCode) {
      throw new Error(
        "Include your country code, for example +91 98765 43210.",
      );
    }
    number = `${countryCode}${number}`;
  }
  if (!/^\+[1-9]\d{7,14}$/.test(number)) {
    throw new Error("Enter a valid mobile number, including its country code.");
  }
  if (number.startsWith("+91") && !/^\+91[6-9]\d{9}$/.test(number)) {
    throw new Error(
      "Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
    );
  }
  return number;
}

function phoneErrorMessage(error) {
  const messages = {
    "auth/invalid-phone-number":
      "That mobile number does not look right. Check it and try again.",
    "auth/missing-phone-number": "Enter your mobile number to continue.",
    "auth/invalid-verification-code":
      "That code is incorrect. Check your message and try again.",
    "auth/code-expired": "That code has expired. Request a new code below.",
    "auth/session-expired": "That code has expired. Request a new code below.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a few minutes before trying again.",
    "auth/quota-exceeded":
      "Text messages are temporarily unavailable. Please try email sign-in.",
    "auth/network-request-failed":
      "We could not connect. Check your internet connection and try again.",
    "auth/captcha-check-failed":
      "The security check could not finish. Please try again.",
    "auth/invalid-app-credential":
      "The security check could not finish. Please try again.",
    "auth/missing-app-credential":
      "The security check could not finish. Please try again.",
    "auth/operation-not-allowed":
      "Phone sign-in is not enabled yet. Please use email or Google.",
    "auth/unauthorized-domain":
      "Phone sign-in is unavailable here. Please use email or Google.",
    "auth/billing-not-enabled":
      "Phone sign-in is temporarily unavailable. Please use email or Google.",
  };
  return (
    messages[error?.code] ||
    "We could not complete phone sign-in. Please try again or use email."
  );
}

function PhoneIcon() {
  return (
    <svg
      width="29"
      height="29"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6.5"
        y="2"
        width="11"
        height="20"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10 5h4M11 18.5h2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PhoneAuthDialog({ onClose, onSuccess }) {
  const id = useId();
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [sentPhone, setSentPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState(null);
  const [notice, setNotice] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const dialogRef = useRef(null);
  const phoneRef = useRef(null);
  const codeRef = useRef(null);
  const captchaContainerRef = useRef(null);
  const verifierRef = useRef(null);
  const confirmationRef = useRef(null);
  const mountedRef = useRef(false);
  const requestRef = useRef(0);
  const busyRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    mountedRef.current = true;
    const previousFocus = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    const appRoot = document.getElementById("root");
    const originalInert = appRoot?.inert;
    document.body.style.overflow = "hidden";
    if (appRoot) appRoot.inert = true;
    phoneRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      const controls = Array.from(
        dialog?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]',
        ) || [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      // Allow Firebase's external reCAPTCHA challenge to receive keyboard focus.
      if (!dialog?.contains(document.activeElement)) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      busyRef.current = false;
      verifierRef.current?.clear();
      verifierRef.current = null;
      confirmationRef.current = null;
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (appRoot) appRoot.inert = originalInert;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
    else if (step === "phone") phoneRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (resendSeconds === 0) return;
    const timer = window.setTimeout(
      () => setResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  function clearVerifier() {
    verifierRef.current?.clear();
    verifierRef.current = null;
  }

  async function sendCode(event) {
    event?.preventDefault();
    if (busyRef.current || (step === "code" && resendSeconds > 0)) return;
    setError("");
    setErrorField(null);
    setNotice("");
    let normalizedPhone;
    try {
      normalizedPhone =
        step === "code" ? sentPhone : normalizePhone(phone, countryCode);
    } catch (validationError) {
      setError(validationError.message);
      setErrorField("phone");
      phoneRef.current?.focus();
      return;
    }

    busyRef.current = true;
    setLoading(true);
    const request = ++requestRef.current;
    try {
      clearVerifier();
      const verifier = new RecaptchaVerifier(
        auth,
        captchaContainerRef.current,
        {
          size: "invisible",
        },
      );
      verifierRef.current = verifier;
      const confirmation = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        verifier,
      );
      if (!mountedRef.current || request !== requestRef.current) return;
      confirmationRef.current = confirmation;
      setSentPhone(normalizedPhone);
      setCode("");
      setStep("code");
      setResendSeconds(RESEND_DELAY);
      setNotice("Code sent. Check your text messages.");
      clearVerifier();
    } catch (requestError) {
      if (!mountedRef.current || request !== requestRef.current) return;
      clearVerifier();
      setError(phoneErrorMessage(requestError));
      if (requestError?.code === "auth/invalid-phone-number")
        setErrorField("phone");
    } finally {
      if (mountedRef.current && request === requestRef.current) {
        busyRef.current = false;
        setLoading(false);
      }
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    if (busyRef.current) return;
    setError("");
    setErrorField(null);
    setNotice("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your text message.");
      setErrorField("code");
      codeRef.current?.focus();
      return;
    }
    if (!confirmationRef.current) {
      setError("Request a new code to continue.");
      return;
    }

    busyRef.current = true;
    setLoading(true);
    const request = ++requestRef.current;
    try {
      const result = await confirmationRef.current.confirm(code);
      if (!mountedRef.current || request !== requestRef.current) return;
      const user = {
        phone: result.user.phoneNumber,
        uid: result.user.uid,
        provider: "phone",
        ...(result.user.displayName ? { name: result.user.displayName } : {}),
      };
      setStep("success");
      setNotice("Your phone is verified. You are signed in.");
      onSuccess?.(user);
    } catch (verificationError) {
      if (!mountedRef.current || request !== requestRef.current) return;
      clearVerifier();
      setError(phoneErrorMessage(verificationError));
      if (verificationError?.code === "auth/invalid-verification-code") {
        setErrorField("code");
        codeRef.current?.focus();
        codeRef.current?.select();
      }
      if (
        ["auth/code-expired", "auth/session-expired"].includes(
          verificationError?.code,
        )
      ) {
        confirmationRef.current = null;
        setResendSeconds(0);
      }
    } finally {
      if (mountedRef.current && request === requestRef.current) {
        busyRef.current = false;
        setLoading(false);
      }
    }
  }

  function changeNumber() {
    if (busyRef.current) return;
    clearVerifier();
    confirmationRef.current = null;
    setCode("");
    setError("");
    setErrorField(null);
    setNotice("");
    setStep("phone");
  }

  return createPortal(
    <div
      className="phone-auth-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="phone-auth-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      >
        <button
          type="button"
          className="phone-auth-close"
          onClick={onClose}
          aria-label="Close phone sign-in"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="phone-auth-icon">
          <PhoneIcon />
        </div>
        <p className="phone-auth-eyebrow">A simpler way to sign in</p>
        <h2 id={`${id}-title`}>
          {step === "phone"
            ? "Continue with your phone"
            : step === "code"
              ? "Check your messages"
              : "You're all set"}
        </h2>
        <p id={`${id}-description`} className="phone-auth-description">
          {step === "phone" ? (
            "One quick code, and you're back to discovering your everyday favourites."
          ) : step === "code" ? (
            <>
              Enter the 6-digit code sent to <strong>{sentPhone}</strong>.
            </>
          ) : (
            "Your phone number has been verified. Welcome to MyStore."
          )}
        </p>

        {step !== "success" && (
          <ol className="phone-auth-steps" aria-label="Phone sign-in progress">
            <li
              className="is-active"
              aria-current={step === "phone" ? "step" : undefined}
            >
              <span aria-hidden="true">{step === "phone" ? "1" : "✓"}</span>{" "}
              Mobile number
            </li>
            <li
              className={step === "code" ? "is-active" : ""}
              aria-current={step === "code" ? "step" : undefined}
            >
              <span aria-hidden="true">2</span> Verify code
            </li>
          </ol>
        )}

        <form
          onSubmit={step === "phone" ? sendCode : verifyCode}
          noValidate
          aria-busy={loading}
        >
          {step === "phone" && (
            <div className="phone-auth-field">
              <label htmlFor={`${id}-phone`}>Mobile number</label>
              <div
                className={`phone-auth-number${errorField === "phone" ? " has-error" : ""}`}
              >
                <select
                  aria-label="Country calling code"
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  disabled={loading}
                >
                  <option value="+91">IN +91</option>
                  <option value="+1">US/CA +1</option>
                  <option value="+44">UK +44</option>
                  <option value="+61">AU +61</option>
                  <option value="+971">AE +971</option>
                  <option value="">Other</option>
                </select>
                <input
                  ref={phoneRef}
                  id={`${id}-phone`}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder={
                    countryCode === "+91"
                      ? "98765 43210"
                      : "+ country code & number"
                  }
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={loading}
                  aria-invalid={errorField === "phone"}
                  aria-describedby={`${id}-phone-help${errorField === "phone" ? ` ${id}-error` : ""}`}
                />
              </div>
              <p id={`${id}-phone-help`} className="phone-auth-field-help">
                You can also paste a full number with its + country code.
              </p>
            </div>
          )}

          {step === "code" && (
            <div className="phone-auth-field">
              <div className="phone-auth-label-row">
                <label htmlFor={`${id}-code`}>Verification code</label>
                <button
                  type="button"
                  className="phone-auth-text-button"
                  onClick={changeNumber}
                  disabled={loading}
                >
                  Change number
                </button>
              </div>
              <input
                ref={codeRef}
                id={`${id}-code`}
                className="phone-auth-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={loading}
                aria-invalid={errorField === "code"}
                aria-describedby={
                  errorField === "code" ? `${id}-error` : undefined
                }
              />
            </div>
          )}

          {error && (
            <p id={`${id}-error`} className="phone-auth-error" role="alert">
              {error}
            </p>
          )}
          <div
            className="phone-auth-announcement"
            role="status"
            aria-live="polite"
          >
            {notice}
          </div>

          {step !== "success" ? (
            <button
              type="submit"
              className="phone-auth-submit"
              disabled={loading}
            >
              {loading && (
                <span className="phone-auth-spinner" aria-hidden="true" />
              )}
              {loading
                ? step === "phone"
                  ? "Sending code…"
                  : "Please wait…"
                : step === "phone"
                  ? "Send verification code"
                  : "Verify & sign in"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          ) : (
            <button
              type="button"
              className="phone-auth-submit"
              onClick={onClose}
            >
              Continue shopping <span aria-hidden="true">→</span>
            </button>
          )}

          {step === "code" && (
            <div className="phone-auth-resend">
              <span>Didn't receive a code?</span>{" "}
              <button
                type="button"
                className="phone-auth-text-button"
                onClick={sendCode}
                disabled={loading || resendSeconds > 0}
              >
                {resendSeconds > 0
                  ? `Resend in ${resendSeconds}s`
                  : "Resend code"}
              </button>
            </div>
          )}
        </form>

        <div ref={captchaContainerRef} className="phone-auth-captcha" />
        <p className="phone-auth-security">
          <svg
            width="15"
            height="17"
            viewBox="0 0 20 22"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m10 2 7 3v6c0 4-4 7-7 9-3-2-7-5-7-9V5l7-3Z"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="m7 10 2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Secure sign-in. No password to remember.
        </p>
        {step === "phone" && (
          <p className="phone-auth-sms-note">
            Standard message rates may apply.
          </p>
        )}
      </section>
    </div>,
    document.body,
  );
}
