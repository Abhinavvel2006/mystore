import { NavLink } from "react-router-dom";
import { useRef, useState } from "react";
import "./dashboard.css";
import "./admin_product.css";

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
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "Footwear",
        quantity: "",
        image: "",
    });
    const [editingId, setEditingId] = useState(null);
    const manageProductsRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData((prev) => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const resetForm = () => {
        setFormData({ name: "", price: "", category: "Footwear", quantity: "", image: "" });
        setEditingId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price) {
            return;
        }

        const newProduct = {
            id: editingId || Date.now(),
            name: formData.name,
            price: Number(formData.price),
            category: formData.category,
            quantity: formData.quantity,
            image: formData.image,
        };

        if (editingId) {
            setProducts((prev) => prev.map((product) => (product.id === editingId ? newProduct : product)));
        } else {
            setProducts((prev) => [newProduct, ...prev]);
        }

        resetForm();
    };

    const handleEdit = (product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            price: product.price,
            category: product.category,
            quantity: product.quantity,
            image: product.image ?? "",
        });
        manageProductsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleDelete = (id) => {
        setProducts((prev) => prev.filter((product) => product.id !== id));
        if (editingId === id) {
            resetForm();
        }
    };

    const handleQuickAction = (action) => {
        manageProductsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

        if (action === "add") {
            resetForm();
        }

        if (action === "edit" && products.length > 0) {
            handleEdit(products[0]);
        }
    };

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
                        <h2>{products.length}</h2>
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
                        <button type="button" className="quick-action-btn" onClick={() => handleQuickAction("add")}>Add Product</button>
                        <button type="button" className="quick-action-btn" onClick={() => handleQuickAction("manage")}>Manage Products</button>
                        <button type="button" className="quick-action-btn" onClick={() => handleQuickAction("edit")}>Edit Products</button>
                        <button type="button" className="quick-action-btn">Payment Method</button>
                    </div>
                </div>

                <div className="dashboard-manage-products" ref={manageProductsRef}>
                    <div className="admin-product-container">
                        <div className="admin-product-header">
                            <div>
                                <h2>Manage Products</h2>
                                <p>Manage products directly from the dashboard.</p>
                            </div>
                            <span className="admin-product-badge">{products.length} products</span>
                        </div>

                        <div className="admin-product-grid">
                            <form className="admin-product-form" onSubmit={handleSubmit}>
                                <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>

                                <label>
                                    Product Name
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter product name"
                                    />
                                </label>

                                <label>
                                    Price
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </label>

                                <label>
                                    Category
                                    <select name="category" value={formData.category} onChange={handleChange}>
                                        <option value="Footwear">Footwear</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Home">Home</option>
                                        <option value="Mobile">Mobile</option>
                                    </select>
                                </label>
                                
                                <label>
                                    Quantity
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Enter quantity" />
                                </label>

                                <label>
                                    Product Image
                                    <input type="file" accept="image/*" onChange={handleImageChange} />
                                </label>

                                {formData.image ? (
                                    <img
                                        src={formData.image}
                                        alt="Preview"
                                        style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "8px", marginTop: "8px" }}
                                    />
                                ) : null}

                                <div className="admin-product-actions">
                                    <button type="submit" className="primary-btn">
                                        {editingId ? "Save Changes" : "Add Product"}
                                    </button>
                                    {editingId ? (
                                        <button type="button" className="secondary-btn" onClick={resetForm}>
                                            Cancel
                                        </button>
                                    ) : null}
                                </div>
                            </form>

                            <div className="admin-product-list">
                                <div className="admin-product-list-header">
                                    <h3>Product List</h3>
                                    <p>Manage your catalog from the dashboard.</p>
                                </div>

                                {products.map((product) => (
                                    <div key={product.id} className="admin-product-item">
                                        <div className="admin-product-item-info">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="admin-product-thumb"
                                                    style={{ objectFit: "cover" }}
                                                />
                                            ) : (
                                                <div className="admin-product-thumb">{product.name.charAt(0)}</div>
                                            )}
                                            <div>
                                                <h4>{product.name}</h4>
                                                <p>{product.category}</p>
                                                <p>Quantity: {product.quantity}</p>
                                            </div>
                                        </div>

                                        <div className="admin-product-item-actions">
                                            <button type="button" className="secondary-btn" onClick={() => handleEdit(product)}>
                                                Edit
                                            </button>
                                            <button type="button" className="danger-btn" onClick={() => handleDelete(product.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;