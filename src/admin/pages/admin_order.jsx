import { useState, useEffect } from "react";
import "./admin_order.css";


function AdminOrder() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/orders');
                const data = await res.json();
                setOrders(data || []);
            } catch (err) {
                console.error('Load orders', err);
            }
        };
        load();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/orders/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus })
            });
            const json = await res.json();
            setOrders((prev) => prev.map((order) => ((order._id || order.id) === id ? json.order : order)));
        } catch (err) {
            console.error('Update order', err);
        }
    };

    return (
        <div className="admin-order-container">
            <div className="admin-order-header">
                <div>
                    <h2>Manage Orders</h2>
                    <p>Track recent customer orders and update their progress.</p>
                </div>
                <span className="admin-order-badge">{orders.length} Orders</span>
            </div>

            <div className="admin-order-summary">
                <div className="admin-order-card">
                    <h3>Pending</h3>
                    <p>{orders.filter((order) => order.status === "Pending").length}</p>
                </div>
                <div className="admin-order-card">
                    <h3>Packed</h3>
                    <p>{orders.filter((order) => order.status === "Packed").length}</p>
                </div>
                <div className="admin-order-card">
                    <h3>Delivered</h3>
                    <p>{orders.filter((order) => order.status === "Delivered").length}</p>
                </div>
            </div>

            <div className="admin-order-list">
                {orders.map((order) => {
                    const orderId = order._id || order.id;
                    const statusClass = (order.status || "Pending").toLowerCase();

                    return (
                        <div key={orderId} className="admin-order-item">
                            <div className="admin-order-main">
                                <div>
                                    <h4>Order #{String(orderId).slice(-6).toUpperCase()}</h4>
                                    <p>{order.customer || order.userEmail || "Guest"}</p>
                                </div>
                                <div className="admin-order-meta">
                                    <span>{Array.isArray(order.items) ? `${order.items.length} item(s)` : "No items"}</span>
                                    <strong>${Number(order.total || 0).toFixed(2)}</strong>
                                </div>
                            </div>

                            <div className="admin-order-actions">
                                <span className={`admin-order-status ${statusClass}`}>
                                    {order.status || "Pending"}
                                </span>
                                <button type="button" onClick={() => updateStatus(orderId, "Pending")}>Pending</button>
                                <button type="button" onClick={() => updateStatus(orderId, "Packed")}>Packed</button>
                                <button type="button" onClick={() => updateStatus(orderId, "Delivered")}>Delivered</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AdminOrder;