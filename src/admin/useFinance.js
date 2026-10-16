import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export default function useFinance() {
  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const requestPending = useRef(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    requestPending.current = true;

    const load = async (resource) => {
      const response = await fetch(`${API_URL}/${resource}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Unable to load financial records.");
      const records = await response.json();
      if (!Array.isArray(records))
        throw new Error("Unexpected financial data.");
      return records;
    };

    Promise.all([load("expenses"), load("revenues")])
      .then(([expenseRecords, revenueRecords]) => {
        if (active) {
          setExpenses(expenseRecords);
          setRevenues(revenueRecords);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "We couldn't load your financial records. Please try again.",
          );
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) {
          requestPending.current = false;
          setLoading(false);
        }
      });

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
      requestPending.current = false;
    };
  }, [revision]);

  const reload = useCallback(() => {
    if (requestPending.current) return;
    requestPending.current = true;
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    let refreshTimer;
    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(reload, 100);
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [reload]);

  return { expenses, revenues, loading, error, reload };
}
