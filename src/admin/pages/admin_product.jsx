import { useState, useEffect } from "react";
import "./admin_product.css";


function AdminProduct(){
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        quantity: "",
        image: ""
    });
    const [editingId, setEditingId] = useState(null);

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
        setFormData({ name: "", price: "", category: categories[0]?.name || "", quantity: "", image: "" });
        setEditingId(null);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch('http://localhost:5000/api/products'),
                    fetch('http://localhost:5000/api/categories')
                ]);
                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();

                setProducts(productsData || []);
                setCategories(categoriesData || []);
            } catch (err) {
                console.error('Load products', err);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!categories.length) return;
        setFormData((prev) => ({
            ...prev,
            category: prev.category || categories[0].name
        }));
    }, [categories]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price) return;

        const payload = {
            name: formData.name,
            price: Number(formData.price),
            category: formData.category,
            quantity: Number(formData.quantity || 0),
            image: formData.image,
        };

        try {
            if (editingId) {
                const res = await fetch(`http://localhost:5000/api/products/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const json = await res.json();
                setProducts((prev) => prev.map((p) => (p._id === editingId ? json.product : p)));
            } else {
                const res = await fetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const json = await res.json();
                setProducts((prev) => [json.product, ...prev]);
            }
            resetForm();
        } catch (err) {
            console.error('Save product', err);
        }
    };

    const handleEdit = (product) => {
        setEditingId(product._id || product.id);
        setFormData({
            name: product.name,
            price: product.price,
            category: product.category,
            quantity: product.quantity ?? "",
            image: product.image ?? ""
        });
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
            setProducts((prev) => prev.filter((product) => (product._id || product.id) !== id));
            if (editingId === id) resetForm();
        } catch (err) {
            console.error('Delete product', err);
        }
    };

    return (
        <div className="admin-product-container">
            <div className="admin-product-header">
                <div>
                    <h2>Manage Products</h2>
                    <p>Simple admin UI for adding, editing, and removing products.</p>
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
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <option key={category._id || category.id} value={category.name}>
                                        {category.name}
                                    </option>
                                ))
                            ) : (
                                <option value="">No categories available</option>
                            )}
                        </select>
                    </label>

                    <label>
                        Stock
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            placeholder="Enter stock quantity"
                        />
                    </label>

                    <label>
                        Product Image
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
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
                        <p>Ready to connect with MongoDB later</p>
                    </div>

                    {products.map((product) => (
                        <div key={product._id || product.id} className="admin-product-item">
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
                                </div>
                            </div>

                            <div className="admin-product-meta">
                                <strong>${Number(product.price).toFixed(2)}</strong>
                                <span>Stock: {product.quantity ?? 0}</span>
                            </div>

                            <div className="admin-product-item-actions">
                                <button type="button" className="secondary-btn" onClick={() => handleEdit(product)}>
                                    Edit
                                </button>
                                <button type="button" className="danger-btn" onClick={() => handleDelete(product._id || product.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminProduct;