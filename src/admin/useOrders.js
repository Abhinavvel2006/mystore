import { useEffect, useState } from "react";

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/orders", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load orders.");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected order data.");
        if (!controller.signal.aborted) {
          setOrders(data);
          setError("");
        }
      } catch {
        if (!controller.signal.aborted)
          setError("We couldn't load your orders. Please try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [revision]);

  const reload = () => {
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  };

  return { orders, setOrders, loading, error, reload };
}
