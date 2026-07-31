import { NavLink } from "react-router-dom";
import { useState } from "react";
import "./dashboard.css";

function ManageOrder({ orders }) {
    if (!orders || orders.length === 0) {
        return (
            <div className="manage-order">
                <div className="empty-state">
                    <p>No orders yet</p>
                </div>
            </div>
        );
    }
    return (
        <div className="manage-order">
            {orders.map((order) => (
                <div className="order-item" key={order.id}>
                    <span>{order.customer}</span>
                    <span>{order.status}</span>
                </div>
            ))}
        </div>
    );
}

function Dashboard() {
    const [orders] = useState([]);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h2>Dashboard</h2>
                    <p>Welcome back, Admin User!</p>
                </div>
            </div>
            <div className="dashboard-cards">
                <div className="card">
                    <div className="card-icon">📦</div>
                    <div className="card-content">
                        <h4>Total Products</h4>
                        <h2>358</h2>
                    </div>
                </div>
                <div className="card">
                    <div className="card-icon">🛒</div>
                    <div className="card-content">
                        <h4>Total Orders</h4>
                        <h2>1245</h2>
                    </div>
                </div>
                <div className="card">
                    <div className="card-icon">👥</div>
                    <div className="card-content">
                        <h4>Total Users</h4>
                        <h2>2856</h2>
                    </div>
                </div>
                <div className="card">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                        <h4>Total Revenue</h4>
                        <h2>$24,680</h2>
                    </div>
                </div>
            </div>
            <div className="dashboard-main">
                <div className="dashboard-orders">
                    <h2>Recent order</h2>
                    <NavLink to="/admin/order">View all orders</NavLink>
                    <ManageOrder orders={orders} />
                </div>
                <div className="quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="action-grid">
                        <button>Add Product</button>
                        <button>Modify Products</button>
                        <button>Delete Products</button>
                        <button>Payment Method</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;