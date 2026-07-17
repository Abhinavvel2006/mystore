import { useContext } from 'react';
import "./Cart.css";
import { NavLink } from "react-router-dom";
import { CartContext } from "../context/CartContext";

function Cart() {
    const { cart, increaseQuantity, decreaseQuantity, remove } = useContext(CartContext);

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const shipping = cart.length > 0 ? subtotal * 0.1 : 0;
    const total = subtotal + shipping;

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
                                        <p>${item.price}</p>
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
                    <button className="checkout-btn" type="button">
                        Proceed to Checkout
                    </button>
                </aside>
            </div>
        </section>
    );
}

export default Cart;
