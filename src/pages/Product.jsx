import "./Product.css";
import { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import formatCurrency from "../currency";
import { API_BASE } from "../services/razorpay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faMagnifyingGlass,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";

function Product() {
  const location = useLocation();
  return <ProductCatalog key={location.search} />;
}

function ProductCatalog() {
  const { addToCart } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";
  const categoryQuery = searchParams.get("category")?.trim() || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory] = useState(categoryQuery);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/categories`),
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        setProducts(productsData || []);
        setCategories(categoriesData || []);
      } catch (err) {
        console.error("Load products", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCategorySelect = (category) => {
    const params = new URLSearchParams(location.search);

    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    navigate(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }

    navigate(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      !activeCategory ||
      (p.category || "General").toLowerCase() === activeCategory.toLowerCase();
    const searchText =
      `${p.name || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      searchText.includes(searchTerm.trim().toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <div className="product-page">
        <section className="catalog-hero">
          <p className="catalog-kicker">The MyStore catalogue</p>
          <h1>
            Good things, picked for <em>real life.</em>
          </h1>
          <p>
            Browse our evolving collection of useful finds for every room,
            routine, and mood.
          </p>
        </section>
        <nav className="category-nav" aria-label="Product Categories">
          <button
            className={!activeCategory ? "active" : ""}
            onClick={() => handleCategorySelect("")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category._id || category.id}
              className={
                activeCategory.toLowerCase() === category.name.toLowerCase()
                  ? "active"
                  : ""
              }
              onClick={() => handleCategorySelect(category.name)}
            >
              {category.name}
            </button>
          ))}
        </nav>

        <div className="products-list dynamic">
          <div className="products-header">
            <h3>
              {searchTerm.trim() || activeCategory
                ? `${searchTerm.trim() ? `Search results for "${searchTerm.trim()}"` : ""}${searchTerm.trim() && activeCategory ? " • " : ""}${activeCategory ? `${activeCategory} Products` : ""}`.trim()
                : "All products"}
            </h3>
            <span className="results-count">
              {loading
                ? "Updating catalogue"
                : `${filteredProducts.length} items to discover`}
            </span>
            <form className="product-filter-bar" onSubmit={handleSearchSubmit}>
              <label className="catalog-search">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products"
                />
              </label>
              <select
                value={activeCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option
                    key={category._id || category.id}
                    value={category.name}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
              <button type="submit">
                <FontAwesomeIcon icon={faSliders} /> Filter
              </button>
            </form>
          </div>

          {loading ? (
            <div className="products-loading">Loading products...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((p) => (
                <div key={p._id || p.id} className="product-card-item">
                  <div className="product-image-wrap">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="product-image"
                      />
                    ) : (
                      <div className="product-image placeholder">
                        {p.name?.charAt(0) || "P"}
                      </div>
                    )}
                  </div>
                  <div className="product-card-body">
                    <span className="product-category">
                      {p.category || "General"}
                    </span>
                    <h4 className="product-title">{p.name}</h4>
                    <p className="product-desc">
                      {p.description ||
                        "High-quality product from our collection."}
                    </p>
                    <div className="product-meta">
                      <span className="price">
                        {formatCurrency(Number(p.price || 0))}
                      </span>
                      <span className="stock">
                        {p.quantity > 0
                          ? `In stock: ${p.quantity}`
                          : "Out of stock"}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="order-btn"
                        disabled={!(p.quantity > 0)}
                        onClick={() =>
                          addToCart({
                            id: p._id || p.id,
                            name: p.name,
                            price: p.price,
                            image: p.image,
                          })
                        }
                      >
                        {p.quantity > 0 ? "Add to cart" : "Out of stock"}{" "}
                        {p.quantity > 0 && (
                          <FontAwesomeIcon icon={faArrowRight} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="products-empty">
              No products available for this category right now.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Product;
