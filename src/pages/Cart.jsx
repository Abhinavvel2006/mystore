import { useContext } from 'react';
import "./Cart.css";
import { NavLink } from "react-router-dom";
import { CartContext } from "../context/CartContext";


function Cart() {

    const { cart, increaseQuantity, decreaseQuantity, remove } = useContext(CartContext);

    return (
        <section className="cart-page">
        <div className="cart-shell">
            <div className="cart-hero">
                <div>
                    <span className="cart-badge">Smart Cart</span>
                    <h1>Your shopping cart</h1>
                    <p>Add products, update quantity, remove items, and keep track of your order total in one place.</p>
                </div>
                <NavLink className="visit-btn cart-hero-btn" to="/products">Explore products</NavLink>
            </div>
            <div id="cart-root" className="cart-root">
                {
                    cart.length === 0 ?
                    <h2>Your cart is empty</h2>
                    :cart.map(item => (
                        <div key={item.id} className="cart-item">
                        <img src={item.image} alt={item.name} width="100"/>
                        <h3>{item.name}</h3>
                        <p>${item.price}</p>
                        <div className="cart-quantity-controls">
                            <button
                                type="button"
                                onClick={() => decreaseQuantity(item.id)}
                            >
                                -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                                type="button"
                                onClick={() => increaseQuantity(item.id)}
                            >
                                +
                            </button>
                        </div>
                        <div className="cart-remove">
                            <button type="button" onClick={() => remove(item.id)}>X</button>
                        </div>
                        </div>
                        ))
                }
            </div>
        </div>
        <div className="cqrt-checkout">
            <h2>Checkout</h2>
            <p>Subtotal: ${cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</p>
            <p>Shipping & tax: ${(cart.reduce((total, item) => total + (item.price * item.quantity), 0) * 0.1).toFixed(2)}</p>
            <p>Total: ${(cart.reduce((total, item) => total + (item.price * item.quantity), 0) + (cart.reduce((total, item) => total + (item.price * item.quantity), 0) * 0.1)).toFixed(2)}</p>
            <button className="checkout-btn">Proceed to Checkout</button>
        </div>
    </section>
    );
}

export default Cart;
