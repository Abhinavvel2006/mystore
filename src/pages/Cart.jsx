import { useContext, useEffect, useState } from 'react';
import "./Cart.css";
import { NavLink } from "react-router-dom";
import { CartContext } from "../context/CartContext";

function Cart() {
    const { cart, increaseQuantity, decreaseQuantity, remove, clearCart } = useContext(CartContext);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [message, setMessage] = useState("");
    const [userOrders, setUserOrders] = useState([]);

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const userEmail = currentUser?.email || "";

    const subtotal = cart.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const shipping = cart.length > 0 ? subtotal * 0.1 : 0;
    const total = subtotal + shipping;

    const loadUserOrders = async (email) => {
        if (!email) {
            setUserOrders([]);
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/orders/user/${encodeURIComponent(email)}`);
            const data = await res.json();
            setUserOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load user orders", err);
        }
    };

    useEffect(() => {
        loadUserOrders(userEmail);
    }, [userEmail]);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            setMessage("Your cart is empty. Add a few items before checkout.");
            return;
        }

        if (!userEmail) {
            setMessage("Please sign in to place and save your order.");
            return;
        }

        setIsPlacingOrder(true);
        setMessage("");

        const payload = {
            customer: userEmail,
            userEmail,
            items: cart.map((item) => ({
                productId: item.productId || item._id || item.id || "",
                name: item.name,
                qty: item.quantity,
                price: Number(item.price || 0),
            })),
            total,
            status: "Pending",
        };

        try {
            const res = await fetch("http://localhost:5000/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                clearCart();
                setMessage("Order placed successfully. It is now available in your order history.");
                loadUserOrders(userEmail);
            } else {
                setMessage(data.message || "Unable to place order right now.");
            }
        } catch (err) {
            console.error("Place order", err);
            setMessage("Something went wrong while saving your order.");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    return (
        <section className="cart-page">
            <div className="cart-layout">
                <div className="cart-shell">
                    {cart.length === 0 && (
                        <div className="cart-hero">
                            <div>
                                <span className="cart-badge">Smart Cart</span>
                                <h1>Your shopping cart</h1>
                                <p>Add products, update quantity, remove items, and keep track of your order total in one place.</p>
                            </div>
                            <NavLink className="cart-hero-btn" to="/products">Explore products</NavLink>
                        </div>
                    )}

                    {message ? <div className="cart-message">{message}</div> : null}

                    <div id="cart-root" className="cart-root">
                        {cart.length === 0 ? (
                            <div className="cart-empty">
                                <h2>Your cart is empty</h2>
                                <p>Browse products and add something you love.</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <img src={item.image} alt={item.name} width="100" />
                                    <div className="cart-item-details">
                                        <h3>{item.name}</h3>
                                        <p>${Number(item.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="cart-quantity-controls">
                                        <button type="button" onClick={() => decreaseQuantity(item.id)}>
                                            -
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button type="button" onClick={() => increaseQuantity(item.id)}>
                                            +
                                        </button>
                                    </div>
                                    <div className="cart-remove">
                                        <button type="button" onClick={() => remove(item.id)}>
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-order-section">
                        <div className="cart-order-header">
                            <div>
                                <h2>{userEmail ? "Your orders" : "Order history"}</h2>
                                <p>{userEmail ? "Recent purchases are saved to MongoDB and visible to the admin dashboard." : "Sign in to save and review your orders."}</p>
                            </div>
                        </div>

                        {userEmail ? (
                            userOrders.length === 0 ? (
                                <div className="cart-empty">
                                    <h3>No orders yet</h3>
                                    <p>Your first checkout will appear here automatically.</p>
                                </div>
                            ) : (
                                <div className="cart-orders-list">
                                    {userOrders.map((order) => (
                                        <div key={order._id || order.id} className="cart-order-item">
                                            <div>
                                                <h3>Order #{(order._id || order.id).slice(-6).toUpperCase()}</h3>
                                                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="cart-order-meta">
                                                <span>{Array.isArray(order.items) ? `${order.items.length} item(s)` : "1 item"}</span>
                                                <strong>${Number(order.total || 0).toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="cart-empty">
                                <h3>Sign in to view orders</h3>
                                <p>Use your account to keep track of every purchase.</p>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="cart-checkout">
                    <h2>Checkout</h2>
                    <div className="checkout-row">
                        <span>Subtotal</span>
                        <strong>${subtotal.toFixed(2)}</strong>
                    </div>
                    <div className="checkout-row">
                        <span>Shipping & tax</span>
                        <strong>${shipping.toFixed(2)}</strong>
                    </div>
                    <div className="checkout-row total">
                        <span>Total</span>
                        <strong>${total.toFixed(2)}</strong>
                    </div>
                    <button className="checkout-btn" type="button" onClick={handleCheckout} disabled={isPlacingOrder}>
                        {isPlacingOrder ? "Placing order..." : "Proceed to Checkout"}
                    </button>
                </aside>
            </div>
        </section>
    );
}

export default Cart;
