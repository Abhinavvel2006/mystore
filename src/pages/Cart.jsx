import { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./Cart.css";
import { NavLink } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import formatCurrency from "../currency";
import {
  API_BASE,
  loadRazorpayCheckout,
  newCheckoutId,
  paymentRequest,
  readPaymentSession,
  savePaymentSession,
} from "../services/razorpay";

function cartItems(cart) {
  return cart
    .map((item) => ({
      productId: String(item.productId || item._id || item.id || ""),
      qty: Number(item.quantity),
    }))
    .sort((left, right) => left.productId.localeCompare(right.productId));
}

function cartFingerprint(cart) {
  return JSON.stringify(cartItems(cart));
}

function Cart() {
  let currentUser;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    currentUser = null;
  }
  return (
    <CartContent
      key={currentUser?.email || "guest"}
      currentUser={currentUser}
    />
  );
}

function CartContent({ currentUser }) {
  const { cart, increaseQuantity, decreaseQuantity, remove, clearCart } =
    useContext(CartContext);
  const userEmail = currentUser?.email || "";
  const pendingStorageKey = `razorpay:verification:${userEmail}`;
  const checkoutStorageKey = `razorpay:checkout:${userEmail}`;
  const [phase, setPhase] = useState("idle");
  const [message, setMessage] = useState("");
  const [userOrders, setUserOrders] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(() => {
    const saved = readPaymentSession(pendingStorageKey);
    return userEmail && saved?.userEmail === userEmail ? saved : null;
  });
  const checkoutAttempt = useRef(readPaymentSession(checkoutStorageKey));
  const busy = useRef(false);
  const verifying = useRef(false);
  const mounted = useRef(false);
  const checkoutInstance = useRef(null);
  const latestCart = useRef(cart);
  const isPlacingOrder = phase !== "idle";

  useEffect(() => {
    latestCart.current = cart;
  }, [cart]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      checkoutInstance.current?.close();
    };
  }, []);

  const subtotal = cart.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const shipping = cart.length > 0 ? subtotal * 0.1 : 0;
  const total = subtotal + shipping;

  const loadUserOrders = useCallback(() => {
    if (!userEmail) return Promise.resolve();
    return fetch(`${API_BASE}/orders/user/${encodeURIComponent(userEmail)}`)
      .then((response) => response.json())
      .then((data) => setUserOrders(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Load user orders", error));
  }, [userEmail]);

  useEffect(() => {
    void loadUserOrders();
  }, [loadUserOrders]);

  const loadPaymentConfig = useCallback(() => {
    return paymentRequest("/config")
      .then((config) => {
        if (!config.success || !config.keyId) {
          throw new Error(
            config.message || "Payments are currently unavailable.",
          );
        }
        setPaymentConfig(config);
        setConfigError("");
      })
      .catch((error) =>
        setConfigError(error.message || "Unable to load payment methods."),
      )
      .finally(() => setConfigLoading(false));
  }, []);

  useEffect(() => {
    void loadPaymentConfig();
  }, [loadPaymentConfig]);

  const verifyPayment = async (payment) => {
    if (verifying.current) return;
    verifying.current = true;
    busy.current = true;
    setPhase("verifying");
    setMessage("Confirming your payment. Please keep this page open.");

    try {
      let result;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        result = await paymentRequest("/verify", {
          orderId: payment.orderId,
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
        });
        if (result.success && result.order?.paymentStatus === "paid") break;
        if (!result.pending)
          throw new Error(
            result.message || "Payment confirmation is unavailable.",
          );
        if (attempt < 2)
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }

      if (result.success && result.order?.paymentStatus === "paid") {
        if (
          mounted.current &&
          cartFingerprint(latestCart.current) === payment.cartFingerprint
        ) {
          clearCart();
        }
        savePaymentSession(pendingStorageKey, null);
        savePaymentSession(checkoutStorageKey, null);
        checkoutAttempt.current = null;
        setPendingVerification(null);
        setMessage(
          result.order.inventoryStatus === "attention"
            ? "Payment received. Your order needs a stock check; contact the store with your order number."
            : "Payment confirmed. Your order has been placed and is saved in your order history.",
        );
      } else {
        setMessage(
          "Your payment is still being confirmed. Use Check payment status to check again without making another payment.",
        );
      }
      void loadUserOrders();
    } catch (error) {
      setMessage(
        `${error.message || "We could not confirm your payment."} Use Check payment status to retry confirmation without paying again.`,
      );
    } finally {
      verifying.current = false;
      busy.current = false;
      setPhase("idle");
    }
  };

  const handleCheckout = async () => {
    if (busy.current) return;
    if (pendingVerification) {
      await verifyPayment(pendingVerification);
      return;
    }
    if (cart.length === 0) {
      setMessage("Your cart is empty. Add a few items before checkout.");
      return;
    }

    const deliveryAddress = localStorage.getItem("deliveryAddress")?.trim();
    if (!deliveryAddress) {
      setMessage("Enter your home address in the header before checkout.");
      return;
    }

    if (!userEmail) {
      setMessage("Please sign in to place and save your order.");
      return;
    }

    if (!paymentConfig) {
      setMessage(
        "Payment methods are unavailable. Please reload the payment methods and try again.",
      );
      return;
    }

    busy.current = true;
    setPhase("preparing");
    setMessage("Preparing your secure payment checkout...");

    const payload = {
      customer: currentUser?.name || userEmail,
      userEmail,
      deliveryAddress,
      items: cartItems(cart),
    };

    try {
      const fingerprint = JSON.stringify(payload);
      if (checkoutAttempt.current?.fingerprint !== fingerprint) {
        checkoutAttempt.current = { fingerprint, checkoutId: newCheckoutId() };
        savePaymentSession(checkoutStorageKey, checkoutAttempt.current);
      }
      const checkoutId = checkoutAttempt.current.checkoutId;
      const Razorpay = await loadRazorpayCheckout();
      if (!mounted.current) return;
      const data = await paymentRequest("/orders", { ...payload, checkoutId });
      if (!mounted.current) return;
      if (
        !data.success ||
        !data.keyId ||
        !data.razorpayOrderId ||
        !Number.isInteger(data.amount)
      ) {
        throw new Error(
          data.message || "Unable to prepare your payment. Please try again.",
        );
      }
      if (data.order?.paymentStatus === "paid") {
        if (cartFingerprint(latestCart.current) === cartFingerprint(cart)) {
          clearCart();
        }
        savePaymentSession(checkoutStorageKey, null);
        checkoutAttempt.current = null;
        busy.current = false;
        setPhase("idle");
        setMessage(
          data.order.inventoryStatus === "attention"
            ? "Payment received. Your order needs a stock check; contact the store with your order number."
            : "Payment already confirmed. Your order is saved in your order history.",
        );
        void loadUserOrders();
        return;
      }
      const instruments = Object.entries(data.methods || {})
        .filter(([, enabled]) => enabled === true)
        .map(([method]) => ({ method }));
      if (!instruments.length)
        throw new Error("No payment methods are currently enabled.");

      let paymentReceived = false;
      let paymentError = "";
      const checkout = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "Smart Cart",
        description: "Payment for your order",
        prefill: { name: currentUser?.name || "", email: userEmail },
        config: {
          display: {
            blocks: {
              payment_methods: { name: "Payment methods", instruments },
            },
            sequence: ["block.payment_methods"],
            preferences: { show_default_blocks: false },
          },
        },
        handler: (response) => {
          if (paymentReceived) return;
          paymentReceived = true;
          const payment = {
            userEmail,
            orderId: data.orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            cartFingerprint: cartFingerprint(cart),
          };
          savePaymentSession(pendingStorageKey, payment);
          setPendingVerification(payment);
          void verifyPayment(payment);
        },
        modal: {
          ondismiss: () => {
            checkoutInstance.current = null;
            if (paymentReceived) return;
            busy.current = false;
            setPhase("idle");
            setMessage(
              paymentError ||
                "Payment checkout closed. Your cart is saved; you can try again when ready.",
            );
            void loadUserOrders();
          },
        },
        theme: { color: "#2563eb" },
      });
      checkout.on("payment.failed", (response) => {
        paymentError =
          response.error?.description ||
          "The payment was unsuccessful. Your cart is saved. You can try another payment method.";
        setMessage(paymentError);
      });
      checkoutInstance.current = checkout;
      setPhase("open");
      setMessage("Choose a payment method in the secure Razorpay checkout.");
      checkout.open();
      void loadUserOrders();
    } catch (error) {
      busy.current = false;
      setPhase("idle");
      setMessage(
        error.message ||
          "Unable to open payment checkout. Your cart is saved. Please try again.",
      );
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
                <p>
                  Add products, update quantity, remove items, and keep track of
                  your order total in one place.
                </p>
              </div>
              <NavLink className="cart-hero-btn" to="/products">
                Explore products
              </NavLink>
            </div>
          )}

          {message ? (
            <div className="cart-message" role="status" aria-live="polite">
              {message}
            </div>
          ) : null}
          {pendingVerification && !message ? (
            <div className="cart-message" role="status">
              A payment is awaiting confirmation. Check its status below before
              making another payment.
            </div>
          ) : null}

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
                    <p>{formatCurrency(Number(item.price || 0))}</p>
                  </div>
                  <div className="cart-quantity-controls">
                    <button
                      type="button"
                      disabled={isPlacingOrder}
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() => decreaseQuantity(item.id)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      disabled={isPlacingOrder}
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => increaseQuantity(item.id)}
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-remove">
                    <button
                      type="button"
                      disabled={isPlacingOrder}
                      aria-label={`Remove ${item.name}`}
                      onClick={() => remove(item.id)}
                    >
                      &times;
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
                <p>
                  {userEmail
                    ? "Review your orders and payment status here."
                    : "Sign in to save and review your orders."}
                </p>
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
                    <div
                      key={order._id || order.id}
                      className="cart-order-item"
                    >
                      <div>
                        <h3>
                          Order #
                          {(order._id || order.id).slice(-6).toUpperCase()}
                        </h3>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="cart-order-status">
                          {order.status || "Pending"}
                          {order.inventoryStatus === "attention"
                            ? " · Stock check needed"
                            : ""}
                        </p>
                      </div>
                      <div className="cart-order-meta">
                        <span>
                          {Array.isArray(order.items)
                            ? `${order.items.length} item(s)`
                            : "1 item"}
                        </span>
                        <strong>
                          {formatCurrency(Number(order.total || 0))}
                        </strong>
                        <span
                          className={`cart-payment-status ${order.paymentStatus === "paid" ? "is-paid" : ""}`}
                        >
                          {order.paymentStatus === "paid"
                            ? "Payment received"
                            : order.paymentStatus === "pending"
                              ? "Awaiting payment"
                              : order.paymentStatus === "failed"
                                ? "Payment failed"
                                : "Payment status unavailable"}
                          {order.paymentMethod
                            ? ` · ${order.paymentMethod.toUpperCase()}`
                            : ""}
                        </span>
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
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div className="checkout-row">
            <span>Shipping & tax</span>
            <strong>{formatCurrency(shipping)}</strong>
          </div>
          <div className="checkout-row total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <p className="checkout-note">
            The final amount is confirmed in the payment window.
          </p>
          <div className="checkout-methods" aria-live="polite">
            <h3>Payment methods</h3>
            {configLoading ? (
              <p>Loading payment methods...</p>
            ) : configError ? (
              <>
                <p role="alert">{configError}</p>
                <button
                  className="checkout-retry"
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={() => {
                    setConfigLoading(true);
                    void loadPaymentConfig();
                  }}
                >
                  Reload payment methods
                </button>
              </>
            ) : (
              <>
                <ul
                  className="checkout-method-list"
                  aria-label="Available payment methods"
                >
                  {(paymentConfig?.methodLabels || [])
                    .filter((method) => paymentConfig.methods?.[method.id])
                    .map((method) => (
                      <li key={method.id}>{method.label}</li>
                    ))}
                </ul>
                <p>
                  Choose your method in Razorpay. Available options depend on
                  your payment provider.
                </p>
              </>
            )}
          </div>
          <button
            className="checkout-btn"
            type="button"
            onClick={handleCheckout}
            disabled={
              isPlacingOrder ||
              (!pendingVerification &&
                (!cart.length || !paymentConfig || configLoading))
            }
          >
            {phase === "preparing"
              ? "Preparing payment..."
              : phase === "open"
                ? "Payment checkout open..."
                : phase === "verifying"
                  ? "Confirming payment..."
                  : pendingVerification
                    ? "Check payment status"
                    : "Pay securely with Razorpay"}
          </button>
        </aside>
      </div>
    </section>
  );
}

export default Cart;
