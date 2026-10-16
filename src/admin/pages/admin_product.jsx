import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState, Icon, Metric, PageHeading } from "../components/Workspace";

export default function AdminProduct() {
  const [params, setParams] = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(params.has("new"));
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    quantity: "",
    image: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("http://localhost:5000/api/products"),
          fetch("http://localhost:5000/api/categories"),
        ]);
        const [productsData, categoriesData] = await Promise.all([
          productsRes.json(),
          categoriesRes.json(),
        ]);
        if (
          !productsRes.ok ||
          !categoriesRes.ok ||
          !Array.isArray(productsData) ||
          !Array.isArray(categoriesData)
        )
          throw new Error("Unable to load catalogue.");
        if (!active) return;
        setProducts(productsData);
        setCategories(categoriesData);
        setFormData((prev) => ({
          ...prev,
          category: prev.category || categoriesData[0]?.name || "",
        }));
      } catch {
        if (active)
          setLoadError(
            "Unable to load the catalogue. Please reload this page when your connection is restored.",
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) =>
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setFormData((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };
  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      category: categories[0]?.name || "",
      quantity: "",
      image: "",
    });
    setEditingId(null);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || formData.price === "") return;
    setSaving(true);
    setError("");
    const payload = {
      name: formData.name,
      price: Number(formData.price),
      category: formData.category,
      quantity: Number(formData.quantity || 0),
      image: formData.image,
    };
    try {
      const response = await fetch(
        editingId
          ? `http://localhost:5000/api/products/${editingId}`
          : "http://localhost:5000/api/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.product)
        throw new Error(data.message || "Could not save this product.");
      setProducts((prev) =>
        editingId
          ? prev.map((product) =>
              (product._id || product.id) === editingId
                ? data.product
                : product,
            )
          : [data.product, ...prev],
      );
      resetForm();
      setEditorOpen(false);
      setParams({});
      setNotice("Product saved successfully.");
    } catch (err) {
      setError(err.message || "Could not save this product.");
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (product) => {
    setEditingId(product._id || product.id);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || "",
      quantity: product.quantity ?? "",
      image: product.image || "",
    });
    setError("");
    setNotice("");
    setEditorOpen(true);
  };
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not delete this product.");
      setProducts((prev) =>
        prev.filter((product) => (product._id || product.id) !== id),
      );
      if (editingId === id) {
        resetForm();
        setEditorOpen(false);
      }
      setNotice("Product removed.");
    } catch (err) {
      setError(err.message);
    }
  };

  const visible = products.filter((p) => {
    const matchesSearch = `${p.name} ${p.category || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const quantity = Number(p.quantity || 0);
    return (
      matchesSearch &&
      (stockFilter === "all" ||
        (stockFilter === "available" && quantity > 0) ||
        (stockFilter === "low" && quantity > 0 && quantity <= 5) ||
        (stockFilter === "out" && quantity <= 0))
    );
  });
  const openNew = () => {
    resetForm();
    setError("");
    setEditorOpen(true);
  };
  const closeEditor = () => {
    resetForm();
    setEditorOpen(false);
    setParams({});
  };
  return (
    <div className="aw">
      <PageHeading
        title="Products"
        section="Catalogue"
        description="Manage your listings, prices, and inventory from one place."
      >
        <button className="aw-button aw-button-primary" onClick={openNew}>
          <Icon name="plus" /> Add product
        </button>
      </PageHeading>
      <div className="aw-metrics aw-metrics-three">
        <Metric
          label="All products"
          value={loading || loadError ? "—" : products.length}
          detail="Your complete catalogue"
          icon="box"
        />
        <Metric
          label="Available"
          value={
            loading || loadError
              ? "—"
              : products.filter((p) => Number(p.quantity) > 0).length
          }
          detail="Products ready to shop"
          icon="check"
          tone="blue"
        />
        <Metric
          label="Out of stock"
          value={
            loading || loadError
              ? "—"
              : products.filter((p) => Number(p.quantity || 0) <= 0).length
          }
          detail="Listings that need restocking"
          icon="warning"
          tone="amber"
        />
      </div>
      {(error || loadError) && (
        <div className="aw-notice error" role="alert">
          {error || loadError}
        </div>
      )}
      {notice && (
        <div className="aw-notice success" role="status">
          {notice}
        </div>
      )}
      <div className={editorOpen ? "aw-editor-grid" : ""}>
        <section className="aw-surface">
          <div className="aw-panel-heading">
            <div>
              <h2>Product catalogue</h2>
              <p>Find a product to update its details.</p>
            </div>
            <span className="aw-pill neutral">{products.length} total</span>
          </div>
          <div className="aw-toolbar">
            <label className="aw-search">
              <Icon name="search" />
              <input
                aria-label="Search products"
                placeholder="Search name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Filter by stock"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All stock levels</option>
              <option value="available">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
            <span className="aw-count">{visible.length} results</span>
          </div>
          {loading ? (
            <EmptyState
              title="Loading products"
              description="Getting your latest catalogue."
            />
          ) : loadError ? (
            <EmptyState
              title="Catalogue unavailable"
              description="Reload this page when your connection is restored."
            />
          ) : visible.length ? (
            <div className="aw-table-scroll">
              <table className="aw-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => (
                    <tr key={product._id || product.id}>
                      <td>
                        <div className="aw-product-cell">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="aw-thumb"
                            />
                          ) : (
                            <span className="aw-thumb">
                              <Icon name="box" />
                            </span>
                          )}
                          <div>
                            <strong>{product.name}</strong>
                            <small>{product.category || "General"}</small>
                          </div>
                        </div>
                      </td>
                      <td>${Number(product.price || 0).toFixed(2)}</td>
                      <td>
                        <span
                          className={`aw-pill ${Number(product.quantity) > 5 ? "" : Number(product.quantity) > 0 ? "warn" : "danger"}`}
                        >
                          {product.quantity || 0} units
                        </span>
                      </td>
                      <td>
                        <div className="aw-actions">
                          <button
                            className="aw-button aw-icon-button"
                            aria-label={`Edit ${product.name}`}
                            onClick={() => handleEdit(product)}
                          >
                            <Icon name="edit" />
                          </button>
                          <button
                            className="aw-button aw-button-danger aw-icon-button"
                            aria-label={`Delete ${product.name}`}
                            onClick={() =>
                              handleDelete(product._id || product.id)
                            }
                          >
                            <Icon name="delete" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title={
                products.length
                  ? "No matching products"
                  : "Build your catalogue"
              }
              description={
                products.length
                  ? "Try a different search or stock filter."
                  : "Add a product with an image, price, and available quantity."
              }
            >
              {products.length ? (
                <button
                  className="aw-button"
                  onClick={() => {
                    setSearch("");
                    setStockFilter("all");
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  className="aw-button aw-button-primary"
                  onClick={openNew}
                >
                  <Icon name="plus" /> Add first product
                </button>
              )}
            </EmptyState>
          )}
        </section>
        {editorOpen && (
          <aside className="aw-surface aw-editor">
            <div className="aw-panel-heading">
              <div>
                <h2>{editingId ? "Edit product" : "New product"}</h2>
                <p>Fill in the details below.</p>
              </div>
              <button
                className="aw-button aw-icon-button"
                aria-label="Close product editor"
                onClick={closeEditor}
              >
                <Icon name="close" />
              </button>
            </div>
            <form className="aw-form aw-panel-body" onSubmit={handleSubmit}>
              <label>
                Product name
                <input
                  autoFocus
                  required
                  className="aw-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Wireless headphones"
                />
              </label>
              <div className="aw-two-fields">
                <label>
                  Price ($)
                  <input
                    required
                    className="aw-input"
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </label>
                <label>
                  Stock quantity
                  <input
                    className="aw-input"
                    type="number"
                    min="0"
                    step="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </label>
              </div>
              <label>
                Category
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id || c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="aw-upload">
                <Icon name="box" /> Product image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              {formData.image && (
                <img
                  className="aw-image-preview"
                  src={formData.image}
                  alt="Product preview"
                />
              )}
              <div className="aw-actions">
                <button
                  className="aw-button aw-button-primary"
                  disabled={saving || Boolean(loadError)}
                  type="submit"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create product"}
                </button>
                <button
                  className="aw-button"
                  type="button"
                  onClick={closeEditor}
                >
                  Cancel
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
