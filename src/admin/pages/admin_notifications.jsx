import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./admin_notifications.css";

function AdminNotifications() {
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
                        return ["pending", "failed", "payment failed", "payment pending"].includes(status);
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
        const openAlerts = notifications.filter((item) => item.severity !== "info").length;
        const warnings = notifications.filter((item) => item.type === "stock").length;
        const paymentIssues = notifications.filter((item) => item.type === "payment").length;

        return { openAlerts, warnings, paymentIssues };
    }, [notifications]);

    return (
        <div className="admin-notifications-page">
            <div className="admin-notifications-header">
                <div>
                    <h2>Notifications</h2>
                    <p>Inventory and payment alerts for the admin dashboard.</p>
                </div>
                <Link to="/admin/dashboard" className="notification-back-link">
                    Back to Dashboard
                </Link>
            </div>

            <div className="notifications-summary">
                <div className="summary-card">
                    <span>Open alerts</span>
                    <strong>{summary.openAlerts}</strong>
                </div>
                <div className="summary-card">
                    <span>Low stock</span>
                    <strong>{summary.warnings}</strong>
                </div>
                <div className="summary-card">
                    <span>Payment issues</span>
                    <strong>{summary.paymentIssues}</strong>
                </div>
            </div>

            {loading ? (
                <div className="notification-empty">Loading notifications...</div>
            ) : (
                <div className="notification-list">
                    {notifications.map((item) => (
                        <div key={item.id} className={`notification-item ${item.severity}`}>
                            <div className="notification-icon">
                                {item.type === "stock" ? "📦" : item.type === "payment" ? "💳" : "✅"}
                            </div>
                            <div className="notification-content">
                                <h3>{item.title}</h3>
                                <p>{item.message}</p>
                            </div>
                            <Link to={item.route} className="notification-link">
                                View
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminNotifications;
