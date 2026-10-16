import { useState, useEffect } from "react";
import { EmptyState, Icon, PageHeading } from "../components/Workspace";

function AdminCategories() {
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
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
        const res = await fetch("http://localhost:5000/api/categories");
        const data = await res.json();
        if (!res.ok || !Array.isArray(data))
          throw new Error(
            "Unable to load categories. Please reload to try again.",
          );
        setCategories(data || []);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    setError("");
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
    };

    try {
      if (editingId) {
        const res = await fetch(
          `http://localhost:5000/api/categories/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const json = await res.json();
        if (!res.ok || !json.category)
          throw new Error(json.message || "Unable to save category.");
        setCategories((prev) =>
          prev.map((c) => ((c._id || c.id) === editingId ? json.category : c)),
        );
      } else {
        const res = await fetch("http://localhost:5000/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.category)
          throw new Error(json.message || "Unable to save category.");
        setCategories((prev) => [json.category, ...prev]);
      }
      resetForm();
      setEditorOpen(false);
      setNotice("Category saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditorOpen(true);
    setError("");
    setEditingId(category._id || category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Unable to delete category.");
      setCategories((prev) => prev.filter((c) => (c._id || c.id) !== id));
      if (editingId === id) resetForm();
      setNotice("Category removed.");
    } catch (err) {
      setError(err.message);
    }
  };

  const visible = categories.filter((c) =>
    `${c.name} ${c.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const openNew = () => {
    resetForm();
    setError("");
    setEditorOpen(true);
  };
  return (
    <div className="aw">
      <PageHeading
        title="Categories"
        section="Catalogue"
        description="Give every product a place. Keep your storefront easy to explore."
      >
        <button className="aw-button aw-button-primary" onClick={openNew}>
          <Icon name="plus" /> Create category
        </button>
      </PageHeading>
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
              <h2>Collections & categories</h2>
              <p>Organize products into meaningful groups.</p>
            </div>
            <span className="aw-pill neutral">
              {categories.length} categories
            </span>
          </div>
          <div className="aw-toolbar">
            <label className="aw-search">
              <Icon name="search" />
              <input
                aria-label="Search categories"
                placeholder="Find a category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <span className="aw-count">{visible.length} results</span>
          </div>
          {loading ? (
            <EmptyState
              icon="category"
              title="Loading categories"
              description="Getting your store organization."
            />
          ) : loadError ? (
            <EmptyState
              icon="category"
              title="Categories unavailable"
              description="Reload this page when your connection is restored."
            />
          ) : visible.length ? (
            <div className="aw-category-grid">
              {visible.map((category) => (
                <article
                  key={category._id || category.id}
                  className="aw-category"
                >
                  <div className="aw-category-top">
                    <span className="aw-thumb">
                      <Icon name="category" />
                    </span>
                    <span className="aw-pill neutral">Category</span>
                  </div>
                  <h3>{category.name}</h3>
                  <p>
                    {category.description ||
                      "Add a description to help explain this collection."}
                  </p>
                  <div className="aw-actions">
                    <button
                      className="aw-button"
                      onClick={() => handleEdit(category)}
                    >
                      <Icon name="edit" /> Edit category
                    </button>
                    <button
                      className="aw-button aw-button-danger aw-icon-button"
                      aria-label={`Delete ${category.name}`}
                      onClick={() => handleDelete(category._id || category.id)}
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="category"
              title={
                categories.length
                  ? "No categories found"
                  : "Start organizing your store"
              }
              description={
                categories.length
                  ? "Try another name or clear your search."
                  : "Create a category like Electronics, Clothing, or Home."
              }
            >
              <button
                className="aw-button aw-button-primary"
                onClick={categories.length ? () => setSearch("") : openNew}
              >
                {categories.length ? "Clear search" : "Create first category"}
              </button>
            </EmptyState>
          )}
        </section>
        {editorOpen && (
          <aside className="aw-surface aw-editor">
            <div className="aw-panel-heading">
              <h2>{editingId ? "Edit category" : "New category"}</h2>
              <button
                className="aw-button aw-icon-button"
                aria-label="Close category editor"
                onClick={() => setEditorOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <form className="aw-form aw-panel-body" onSubmit={handleSubmit}>
              <label>
                Category name
                <input
                  required
                  autoFocus
                  className="aw-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Home & living"
                />
              </label>
              <label>
                Description
                <textarea
                  className="aw-input"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What belongs in this category?"
                />
              </label>
              <div className="aw-actions">
                <button
                  disabled={saving || Boolean(loadError)}
                  className="aw-button aw-button-primary"
                  type="submit"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save changes"
                      : "Create category"}
                </button>
                <button
                  className="aw-button"
                  type="button"
                  onClick={() => setEditorOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
            <div className="aw-help-panel">
              Use short, familiar names that customers can recognize quickly.
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
export default AdminCategories;
