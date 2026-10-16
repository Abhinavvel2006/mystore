import { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBolt,
  faHeadphones,
  faRotateLeft,
  faShieldHalved,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { CartContext } from "../context/CartContext";
import hero from "../assets/hero.png";
import product3 from "../assets/product3.jpg";
import category1 from "../assets/category1.jpg";
import category2 from "../assets/category2.jpg";
import category3 from "../assets/category3.jpg";
import formatCurrency from "../currency";
import { API_BASE } from "../services/razorpay";
import "./Home.css";

const categories = [
  {
    name: "Tech & electronics",
    image: category1,
    caption: "Smart picks for every setup",
  },
  {
    name: "Style edit",
    image: category2,
    caption: "Fresh looks, easy choices",
  },
  {
    name: "Home refresh",
    image: category3,
    caption: "Make space feel like yours",
  },
  {
    name: "Mobile essentials",
    image: product3,
    caption: "Stay connected in style",
  },
];

function Home() {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_BASE}/products`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load products.");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Unable to load products.");
        if (!controller.signal.aborted) setProducts(data.slice(0, 6));
      } catch {
        if (!controller.signal.aborted) {
          setError(
            "Products are unavailable right now. Please try again later.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadProducts();
    return () => controller.abort();
  }, []);

  return (
    <main className="market-home">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <FontAwesomeIcon icon={faBolt} /> New season, new finds
          </p>
          <h1>
            Find your next <em>everyday favorite.</em>
          </h1>
          <p className="hero-text">
            Thoughtful products for your home, wardrobe, and everyday rituals —
            all in one easy place.
          </p>
          <div className="hero-cta">
            <NavLink to="/products">
              Shop the collection <FontAwesomeIcon icon={faArrowRight} />
            </NavLink>
            <NavLink className="text-cta" to="/about">
              Why MyStore
            </NavLink>
          </div>
          <div className="hero-proof">
            <span>
              <b>20k+</b> happy shoppers
            </span>
            <span>
              <b>4.8/5</b> average rating
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <img src={hero} alt="A curated selection of MyStore products" />
          <div className="floating-rating">
            <FontAwesomeIcon icon={faStar} /> 4.8 <span>customer favorite</span>
          </div>
        </div>
      </section>

      <section className="benefit-row">
        <div>
          <FontAwesomeIcon icon={faShieldHalved} />
          <span>
            <b>Secure checkout</b>Protected payments
          </span>
        </div>
        <div>
          <FontAwesomeIcon icon={faRotateLeft} />
          <span>
            <b>Easy returns</b>Seven days, no stress
          </span>
        </div>
        <div>
          <FontAwesomeIcon icon={faHeadphones} />
          <span>
            <b>Here to help</b>Friendly human support
          </span>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Browse your way</p>
            <h2>Made for every kind of day</h2>
          </div>
          <NavLink to="/products">
            See everything <FontAwesomeIcon icon={faArrowRight} />
          </NavLink>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <NavLink
              to="/products"
              className="category-tile"
              key={category.name}
            >
              <img src={category.image} alt="" />
              <div>
                <span>{category.caption}</span>
                <h3>{category.name}</h3>
                <b>
                  Explore <FontAwesomeIcon icon={faArrowRight} />
                </b>
              </div>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="content-section arrivals-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Curated for you</p>
            <h2>Popular right now</h2>
          </div>
          <NavLink to="/products">
            View all products <FontAwesomeIcon icon={faArrowRight} />
          </NavLink>
        </div>
        {loading ? (
          <p role="status">Loading products...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : products.length === 0 ? (
          <p>
            New products are coming soon. Check back for our latest collection.
          </p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product._id || product.id}>
                <div className="product-image">
                  {product.image && (
                    <img src={product.image} alt={product.name} />
                  )}
                  <span>{product.category || "Featured"}</span>
                </div>
                <div className="product-info">
                  <p className="rating">
                    {product.quantity > 0 ? "In stock" : "Out of stock"}
                  </p>
                  <h3>{product.name}</h3>
                  <div>
                    <strong>{formatCurrency(product.price)}</strong>
                    <button
                      disabled={!(product.quantity > 0)}
                      onClick={() =>
                        addToCart({
                          id: product._id || product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                        })
                      }
                    >
                      {product.quantity > 0 ? "Add to cart" : "Out of stock"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="membership-banner">
        <div>
          <p className="eyebrow">The MyStore difference</p>
          <h2>Good choices should feel easy.</h2>
          <p>
            Discover useful things, clear prices, and service that stays with
            you after checkout.
          </p>
        </div>
        <NavLink to="/about">
          Meet MyStore <FontAwesomeIcon icon={faArrowRight} />
        </NavLink>
      </section>
    </main>
  );
}

export default Home;
