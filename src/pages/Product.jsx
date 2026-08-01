import "./Product.css";
import { useEffect, useState, useContext } from "react";
import { CartContext } from "../context/CartContext";

function Product() {
    const { addToCart } = useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/products");
                const data = await res.json();
                setProducts(data || []);
            } catch (err) {
                console.error("Load products", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <>
            <div className="product-page">
                <h2>Products</h2>
                <nav className="category-nav" aria-label="Product Categories">
                    <a href="#footwear">Footwear</a>
                    <a href="#Electronics">Electronics</a>
                    <a href="#Clothing">Clothing</a>
                    <a href="#Home">Home & Living</a>
                    <a href="#Mobile">Mobiles</a>
                    <a href="#PCs">PCs</a>
                    <a href="#accessories">Accessories</a>
                    <a href="#furnitures">Furnitures</a>
                </nav>

                <div className="products-list dynamic">
                    <div className="products-header">
                        <h3>Featured Products</h3>
                    </div>

                    {loading ? (
                        <div className="products-loading">Loading products...</div>
                    ) : products.length > 0 ? (
                        <div className="product-grid">
                            {products.map((p) => (
                                <div key={p._id || p.id} className="product-card-item">
                                    <div className="product-image-wrap">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="product-image" />
                                        ) : (
                                            <div className="product-image placeholder">{p.name?.charAt(0) || "P"}</div>
                                        )}
                                    </div>
                                    <div className="product-card-body">
                                        <span className="product-category">{p.category || "General"}</span>
                                        <h4 className="product-title">{p.name}</h4>
                                        <p className="product-desc">
                                            {p.description || "High-quality product from our collection."}
                                        </p>
                                        <div className="product-meta">
                                            <span className="price">${Number(p.price).toFixed(2)}</span>
                                            <span className="stock">{p.quantity > 0 ? `In stock: ${p.quantity}` : "Out of stock"}</span>
                                        </div>
                                        <div className="card-actions">
                                            <button
                                                className="order-btn"
                                                onClick={() =>
                                                    addToCart({
                                                        id: p._id || p.id,
                                                        name: p.name,
                                                        price: p.price,
                                                        image: p.image,
                                                    })
                                                }
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="products-empty">No products available right now.</div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Product;