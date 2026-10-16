import { useState } from "react";
import { EmptyState, Icon, Metric, PageHeading } from "../components/Workspace";
import OrderTable from "../components/OrderTable";
import useOrders from "../useOrders";

export default function AdminOrder() {
  const { orders, setOrders, loading, error, reload } = useOrders();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [savingId, setSavingId] = useState(null);
  const [updateError, setUpdateError] = useState("");
  const [notice, setNotice] = useState("");

  const updateStatus = async (id, newStatus) => {
    setSavingId(id);
    setUpdateError("");
    setNotice("");
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.order)
        throw new Error(data.message || "Unable to update this order.");
      setOrders((previous) =>
        previous.map((order) =>
          (order._id || order.id) === id ? data.order : order,
        ),
      );
      setNotice(
        `Order #${String(id).slice(-6).toUpperCase()} updated to ${newStatus}.`,
      );
    } catch (err) {
      setUpdateError(
        err.message || "Unable to update this order. Please try again.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const visible = orders.filter((order) => {
    const text =
      `${order._id || order.id} ${order.customer || ""} ${order.userEmail || ""}`.toLowerCase();
    return (
      text.includes(search.trim().toLowerCase()) &&
      (filter === "all" ||
        (order.status || "Pending").toLowerCase() === filter.toLowerCase())
    );
  });
  const count = (status) =>
    loading || error
      ? "—"
      : orders.filter(
          (order) =>
            (order.status || "Pending").toLowerCase() === status.toLowerCase(),
        ).length;

  return (
    <div className="aw">
      <PageHeading
        title="Orders"
        description="Track customer purchases and keep every delivery moving."
      >
        <button
          className="aw-button"
          disabled={loading || savingId !== null}
          onClick={reload}
        >
          Refresh orders
        </button>
      </PageHeading>
      <div className="aw-metrics">
        <Metric
          label="All orders"
          value={loading || error ? "—" : orders.length}
          detail="Across your store"
          icon="order"
        />
        <Metric
          label="Pending"
          value={count("Pending")}
          detail="Waiting to be processed"
          icon="warning"
          tone="amber"
        />
        <Metric
          label="Packed"
          value={count("Packed")}
          detail="Prepared for delivery"
          icon="box"
          tone="blue"
        />
        <Metric
          label="Delivered"
          value={count("Delivered")}
          detail="Completed deliveries"
          icon="check"
          tone="purple"
        />
      </div>
      {updateError && (
        <div className="aw-notice error" role="alert">
          {updateError}
        </div>
      )}
      {notice && (
        <div className="aw-notice success" role="status">
          {notice}
        </div>
      )}
      <section className="aw-surface">
        <div className="aw-panel-heading">
          <div>
            <h2>Order activity</h2>
            <p>Find an order and update its fulfillment status.</p>
          </div>
          <span className="aw-pill neutral">
            {loading
              ? "Loading"
              : error
                ? "Unavailable"
                : `${orders.length} orders`}
          </span>
        </div>
        <div className="aw-toolbar">
          <label className="aw-search">
            <Icon name="search" />
            <input
              aria-label="Search orders"
              placeholder="Search order ID or customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter by order status"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Packed">Packed</option>
            <option value="Delivered">Delivered</option>
          </select>
          {!loading && !error && (
            <span className="aw-count">{visible.length} results</span>
          )}
        </div>
        {loading ? (
          <EmptyState
            icon="order"
            title="Loading orders"
            description="Getting your latest order activity."
          />
        ) : error ? (
          <EmptyState
            icon="order"
            title="Orders unavailable"
            description={error}
          >
            <button className="aw-button" onClick={reload}>
              Try again
            </button>
          </EmptyState>
        ) : visible.length ? (
          <OrderTable
            orders={visible}
            onStatusChange={updateStatus}
            savingId={savingId}
          />
        ) : (
          <EmptyState
            icon="order"
            title={orders.length ? "No matching orders" : "No orders yet"}
            description={
              orders.length
                ? "Try a different customer, order ID, or status."
                : "Customer purchases will appear here when an order is placed."
            }
          >
            {orders.length > 0 && (
              <button
                className="aw-button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </EmptyState>
        )}
      </section>
    </div>
  );
}
