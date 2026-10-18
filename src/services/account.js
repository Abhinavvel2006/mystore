import { useMemo, useSyncExternalStore } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");
const TOKEN_KEY = "account:token";
const CHANGE_EVENT = "account:user-changed";

export const PAYMENT_METHODS = [
  {
    id: "",
    label: "Choose at checkout",
    description: "Keep all your options open.",
  },
  { id: "upi", label: "UPI", description: "Pay with your preferred UPI app." },
  {
    id: "card",
    label: "Credit or debit card",
    description: "Enter your card securely at checkout.",
  },
  {
    id: "netbanking",
    label: "Netbanking",
    description: "Pay directly through your bank.",
  },
  {
    id: "wallet",
    label: "Wallet",
    description: "Use an available digital wallet.",
  },
  {
    id: "emi",
    label: "EMI",
    description: "Available for eligible purchases and cards.",
  },
  {
    id: "paylater",
    label: "Pay later",
    description: "Subject to provider availability and eligibility.",
  },
];

function userSnapshot() {
  try {
    return localStorage.getItem("currentUser");
  } catch {
    return null;
  }
}

function parseUser(value) {
  try {
    const user = JSON.parse(value || "null");
    return user &&
      typeof user === "object" &&
      (user.id || user._id || user.email || user.uid || user.phone)
      ? user
      : null;
  } catch {
    return null;
  }
}

export function readCurrentUser() {
  return parseUser(userSnapshot());
}

function subscribe(callback) {
  const onStorage = (event) => {
    if (!event.key || event.key === "currentUser") callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCurrentUser() {
  const snapshot = useSyncExternalStore(subscribe, userSnapshot, () => null);
  return useMemo(() => parseUser(snapshot), [snapshot]);
}

export function saveCurrentUser(user) {
  const {
    id,
    _id,
    uid,
    email,
    name,
    phone,
    provider,
    photoURL,
    age,
    location,
    deliveryAddress,
    paymentMethod,
  } = user;
  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      id,
      _id,
      uid,
      email,
      name,
      phone,
      provider,
      photoURL,
      age,
      location,
      deliveryAddress,
      paymentMethod,
    }),
  );
  if (typeof deliveryAddress === "string") {
    localStorage.setItem("deliveryAddress", deliveryAddress);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function saveAccountSession({ user, token }) {
  if (!user || !token) {
    throw new Error("Sign-in could not be completed. Please try again.");
  }
  try {
    localStorage.setItem(TOKEN_KEY, token);
    saveCurrentUser(user);
  } catch {
    clearAccountSession();
    throw new Error("Allow browser storage to sign in and save your account.");
  }
}

export function clearAccountSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deliveryAddress");
  } finally {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export async function accountRequest(
  path,
  { method = "GET", body, signal } = {},
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      const error = new Error(
        data?.message ||
          "Your account is unavailable right now. Please try again.",
      );
      error.status = response.status;
      if (
        response.status === 401 &&
        path !== "/logout" &&
        token === localStorage.getItem(TOKEN_KEY)
      ) {
        clearAccountSession();
      }
      throw error;
    }
    if (token !== localStorage.getItem(TOKEN_KEY)) {
      throw new Error(
        "Your signed-in account changed. Reload this page to continue.",
      );
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" && !signal?.aborted) {
      throw new Error("Your account request timed out. Please try again.");
    }
    if (error instanceof TypeError) {
      throw new Error(
        "We couldn't reach the store. Check your connection and try again.",
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export async function signOutAccount() {
  const outgoingToken = localStorage.getItem(TOKEN_KEY);
  try {
    await accountRequest("/logout", { method: "POST" });
  } finally {
    if (outgoingToken === localStorage.getItem(TOKEN_KEY)) {
      clearAccountSession();
      await signOut(auth).catch(() => {});
    }
  }
}
