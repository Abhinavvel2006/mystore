import { useState, useEffect } from "react";
import "./admin_categories.css";

function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [editingId, setEditingId] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ name: "", description: "" });
        setEditingId(null);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/categories');
                const data = await res.json();
                setCategories(data || []);
            } catch (err) {
                console.error('Load categories', err);
            }
        };
        load();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        const payload = { name: formData.name.trim(), description: formData.description.trim() };

        try {
            if (editingId) {
                const res = await fetch(`http://localhost:5000/api/categories/${editingId}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const json = await res.json();
                setCategories((prev) => prev.map((c) => (c._id === editingId ? json.category : c)));
            } else {
                const res = await fetch('http://localhost:5000/api/categories', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const json = await res.json();
                setCategories((prev) => [json.category, ...prev]);
            }
            resetForm();
        } catch (err) {
            console.error('Save category', err);
        }
    };

    const handleEdit = (category) => {
        setEditingId(category._id || category.id);
        setFormData({ name: category.name, description: category.description });
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/categories/${id}`, { method: 'DELETE' });
            setCategories((prev) => prev.filter((c) => (c._id || c.id) !== id));
            if (editingId === id) resetForm();
        } catch (err) {
            console.error('Delete category', err);
        }
    };

    return (
        <div className="admin-categories-container">
            <div className="admin-categories-header">
                <div>
                    <h2>Manage Categories</h2>
                    <p>Create and organize product categories from one simple panel.</p>
                </div>
                <span className="admin-categories-badge">{categories.length} categories</span>
            </div>

            <div className="admin-categories-grid">
                <form className="admin-categories-form" onSubmit={handleSubmit}>
                    <h3>{editingId ? "Edit Category" : "Add New Category"}</h3>

                    <label>
                        Category Name
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter category name"
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Short description"
                        />
                    </label>

                    <div className="admin-categories-actions">
                        <button type="submit" className="primary-btn">
                            {editingId ? "Save Changes" : "Add Category"}
                        </button>
                        {editingId ? (
                            <button type="button" className="secondary-btn" onClick={resetForm}>
                                Cancel
                            </button>
                        ) : null}
                    </div>
                </form>

                <div className="admin-categories-list">
                    <div className="admin-categories-list-header">
                        <h3>Category List</h3>
                        <p>Simple UI ready for backend integration.</p>
                    </div>

                    {categories.map((category) => (
                        <div key={category._id || category.id} className="admin-category-item">
                            <div className="admin-category-info">
                                <div className="admin-category-icon">{category.name.charAt(0)}</div>
                                <div>
                                    <h4>{category.name}</h4>
                                    <p>{category.description || "No description added yet"}</p>
                                </div>
                            </div>

                            <div className="admin-category-actions">
                                <button type="button" className="secondary-btn" onClick={() => handleEdit(category)}>
                                    Edit
                                </button>
                                <button type="button" className="danger-btn" onClick={() => handleDelete(category._id || category.id)}>
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

export default AdminCategories;