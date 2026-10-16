export const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

let checkoutScriptPromise;

export function loadRazorpayCheckout() {
  if (typeof window.Razorpay === "function") {
    return Promise.resolve(window.Razorpay);
  }
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    const finish = (error) => {
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else {
        resolve(window.Razorpay);
      }
    };

    const timeout = window.setTimeout(
      () =>
        finish(
          new Error(
            "Payment checkout took too long to load. Please try again.",
          ),
        ),
      20000,
    );
    script.onerror = () =>
      finish(
        new Error(
          "Unable to load payment checkout. Check your connection and try again.",
        ),
      );
    script.onload = () => {
      finish(
        typeof window.Razorpay === "function"
          ? null
          : new Error("Payment checkout is unavailable. Please try again."),
      );
    };
    document.head.appendChild(script);
  }).catch((error) => {
    checkoutScriptPromise = undefined;
    throw error;
  });

  return checkoutScriptPromise;
}

export async function paymentRequest(path, payload) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_BASE}/payments${path}`, {
      method: payload ? "POST" : "GET",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!data && response.status === 404) {
      throw new Error(
        import.meta.env.DEV
          ? "Payment routes are missing on the running server. Restart the backend and reload payment methods."
          : "Payment checkout is temporarily unavailable. Please try again later.",
      );
    }
    if (!data)
      throw new Error(
        "The payment server returned an invalid response. Please try again.",
      );
    if (!response.ok && !data.pending) {
      throw new Error(
        data.message || "Unable to process your payment request.",
      );
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The payment server is taking too long to respond. Please try again.",
        { cause: error },
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function readPaymentSession(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function savePaymentSession(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The in-memory payment can still be verified if browser storage is disabled.
  }
}

export function newCheckoutId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
    (
      Number(character) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] &
        (15 >> (Number(character) / 4)))
    ).toString(16),
  );
}
