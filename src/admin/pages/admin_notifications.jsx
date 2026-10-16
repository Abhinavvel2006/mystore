import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, Icon, Metric, PageHeading } from "../components/Workspace";

function AdminNotifications() {
  const [filter, setFilter] = useState("all");
  const [failed, setFailed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch("http://localhost:5000/api/products"),
          fetch("http://localhost:5000/api/orders"),
        ]);

        const products = await productsRes.json();
        const orders = await ordersRes.json();

        if (
          !productsRes.ok ||
          !ordersRes.ok ||
          !Array.isArray(products) ||
          !Array.isArray(orders)
        )
          throw new Error("Unavailable");
        const alerts = [];

        products
          .filter((product) => Number(product.quantity) <= 5)
          .forEach((product) => {
            alerts.push({
              id: `stock-${product._id || product.id}`,
              type: "stock",
              severity: "warning",
              title: "Low stock alert",
              message: `${product.name} has only ${product.quantity} unit${product.quantity === 1 ? "" : "s"} left.`,
              route: "/admin/products",
            });
          });

        orders
          .filter((order) => {
            const status = (order.status || "").toLowerCase();
            return [
              "pending",
              "failed",
              "payment failed",
              "payment pending",
            ].includes(status);
          })
          .forEach((order) => {
            alerts.push({
              id: `payment-${order._id || order.id}`,
              type: "payment",
              severity: "danger",
              title: "Payment issue",
              message: `Order ${order._id ? order._id.slice(-6) : "#unknown"} is currently marked as ${order.status || "pending"}.`,
              route: "/admin/orders",
            });
          });

        if (alerts.length === 0) {
          alerts.push({
            id: "all-clear",
            type: "info",
            severity: "info",
            title: "Everything looks good",
            message: "No urgent stock or payment issues were detected.",
            route: "/admin/dashboard",
          });
        }

        setNotifications(alerts);
      } catch (error) {
        console.error("Load notifications", error);
        setFailed(true);
        setNotifications([
          {
            id: "error",
            type: "info",
            severity: "info",
            title: "Unable to load notifications",
            message: "Please check the server connection and try again.",
            route: "/admin/dashboard",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const summary = useMemo(() => {
    const openAlerts = notifications.filter(
      (item) => item.severity !== "info",
    ).length;
    const warnings = notifications.filter(
      (item) => item.type === "stock",
    ).length;
    const paymentIssues = notifications.filter(
      (item) => item.type === "payment",
    ).length;

    return { openAlerts, warnings, paymentIssues };
  }, [notifications]);

  const visible = notifications.filter(
    (item) => filter === "all" || item.type === filter,
  );
  return (
    <div className="aw">
      <PageHeading
        title="Notifications"
        description="Keep track of the items that need your attention."
      >
        <Link className="aw-button" to="/admin/dashboard">
          Back to overview <Icon name="arrow" />
        </Link>
      </PageHeading>
      <div className="aw-metrics aw-metrics-three">
        <Metric
          label="Open alerts"
          value={loading || failed ? "—" : summary.openAlerts}
          detail="Items to review"
          icon="bell"
        />
        <Metric
          label="Low stock"
          value={loading || failed ? "—" : summary.warnings}
          detail="Inventory needs attention"
          icon="box"
          tone="amber"
        />
        <Metric
          label="Payment & order alerts"
          value={loading || failed ? "—" : summary.paymentIssues}
          detail="Check order status"
          icon="wallet"
          tone="blue"
        />
      </div>
      <div className="aw-tabs" role="tablist" aria-label="Notification filters">
        {[
          ["all", "All activity"],
          ["stock", "Inventory"],
          ["payment", "Payments"],
          ["info", "Store updates"],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            id={`alerts-tab-${key}`}
            aria-controls="alerts-panel"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <section
        className="aw-surface"
        id="alerts-panel"
        role="tabpanel"
        aria-labelledby={`alerts-tab-${filter}`}
      >
        <div className="aw-panel-heading">
          <div>
            <h2>Activity inbox</h2>
            <p>Review alerts and open the relevant management screen.</p>
          </div>
          <span className="aw-pill neutral">
            {loading ? "Loading" : `${visible.length} updates`}
          </span>
        </div>
        {loading ? (
          <EmptyState
            icon="bell"
            title="Checking your store"
            description="Looking for inventory and order updates."
          />
        ) : visible.length ? (
          visible.map((item) => (
            <article key={item.id} className={`aw-alert ${item.severity}`}>
              <span className="aw-alert-icon">
                <Icon
                  name={
                    item.type === "stock"
                      ? "box"
                      : item.type === "payment"
                        ? "wallet"
                        : failed
                          ? "warning"
                          : "check"
                  }
                />
              </span>
              <div className="aw-alert-content">
                <h3>{item.title}</h3>
                <p>{item.message}</p>
              </div>
              <Link to={item.route} className="aw-button">
                Review <Icon name="arrow" />
              </Link>
            </article>
          ))
        ) : (
          <EmptyState
            icon="check"
            title="You're all caught up"
            description="There are no updates in this category."
          />
        )}
      </section>
    </div>
  );
}
export default AdminNotifications;
