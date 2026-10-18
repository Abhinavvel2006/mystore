const crypto = require("node:crypto");
const express = require("express");
const Razorpay = require("razorpay");
const OrderModel = require("../model/order");
const ProductModel = require("../model/product");
const RevenueModel = require("../model/revenue");
const { createPaidOrderEffects } = require("../services/paidOrderEffects");

const METHOD_LABELS = {
  upi: "UPI",
  card: "Credit / debit card",
  netbanking: "Net banking",
  wallet: "Wallets",
  emi: "EMI",
  paylater: "Pay later",
};
const objectId = /^[a-f\d]{24}$/i;
const gatewayOrderId = /^order_[a-zA-Z0-9]+$/;
const gatewayPaymentId = /^pay_[a-zA-Z0-9]+$/;
const publicError = Symbol("public payment error");

function fail(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error[publicError] = true;
  throw error;
}

function isAmountLimitError(error) {
  const description = error?.error?.description;
  if (typeof description !== "string") return false;
  return (
    /\bamount exceeds maximum amount allowed\b/i.test(description) ||
    /\bamount\b[^.\r\n]{0,80}\bexceeds?\b[^.\r\n]{0,80}\blimit\b/i.test(
      description,
    )
  );
}

function assertAmountLimit(amount, maxAmount) {
  if (maxAmount === null || amount <= maxAmount) return;
  const maximum = (maxAmount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  fail(
    422,
    `Your order total, including shipping and tax, exceeds this store's online payment limit of INR ${maximum}. Reduce your cart total or contact the store for help.`,
    "PAYMENT_AMOUNT_LIMIT",
  );
}

function validSignature(message, signature, secret) {
  if (typeof signature !== "string" || !/^[a-f\d]{64}$/i.test(signature)) {
    return false;
  }
  const expected = crypto.createHmac("sha256", secret).update(message).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

function createPaymentRoutes({
  Order = OrderModel,
  Product = ProductModel,
  Revenue = RevenueModel,
  env = process.env,
  gateway,
} = {}) {
  const router = express.Router();
  let client = gateway;
  const effects = createPaidOrderEffects({ Order, Product, Revenue });

  function config() {
    const keyId = env.RAZORPAY_KEY_ID?.trim();
    const secret = env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !secret) {
      fail(
        503,
        "Payments are unavailable. Configure the Razorpay keys in Backend/.env.",
      );
    }
    const enabled = (
      env.RAZORPAY_PAYMENT_METHODS ?? "upi,card,netbanking,wallet,emi"
    )
      .split(",")
      .map((method) => method.trim().toLowerCase())
      .filter(Boolean);
    if (
      !enabled.length ||
      enabled.some((method) => !Object.hasOwn(METHOD_LABELS, method))
    ) {
      fail(503, "The server payment methods configuration is invalid.");
    }
    const methods = Object.fromEntries(
      Object.keys(METHOD_LABELS).map((method) => [
        method,
        enabled.includes(method),
      ]),
    );
    const configuredMaximum = env.RAZORPAY_MAX_AMOUNT_INR?.trim() || "";
    let maxAmount = null;
    if (configuredMaximum) {
      // Parse decimal rupees exactly; never round a configured payment limit.
      if (!/^\d+(?:\.\d{1,2})?$/.test(configuredMaximum)) {
        fail(503, "The server payment amount limit configuration is invalid.");
      }
      const [rupees, paise = ""] = configuredMaximum.split(".");
      maxAmount = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
      if (!Number.isSafeInteger(maxAmount) || maxAmount <= 0) {
        fail(503, "The server payment amount limit configuration is invalid.");
      }
    }
    return {
      keyId,
      currency: "INR",
      maxAmount,
      methods,
      methodLabels: Object.entries(METHOD_LABELS)
        .filter(([id]) => methods[id])
        .map(([id, label]) => ({ id, label })),
    };
  }

  function getClient() {
    const { keyId } = config();
    if (!client) {
      client = new Razorpay({
        key_id: keyId,
        key_secret: env.RAZORPAY_KEY_SECRET.trim(),
      });
      // Bound upstream requests so checkout can recover from a gateway outage.
      client.api.rq.defaults.timeout = 15000;
    }
    return client;
  }

  const endpoint = (handler) => async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      await handler(req, res);
    } catch (error) {
      const exposed = error?.[publicError] === true;
      const status = exposed ? error.status : 503;
      // Gateway errors can contain credentials/request headers. Never return or log them.
      res.status(status).json({
        success: false,
        ...(exposed && error.code ? { code: error.code } : {}),
        message: exposed
          ? error.message
          : "The payment service is temporarily unavailable. Please retry; keep any payment reference.",
      });
    }
  };

  function checkoutResponse(order) {
    return {
      success: true,
      ...config(),
      orderId: String(order._id),
      razorpayOrderId: order.razorpayOrderId,
      amount: order.amount,
      order,
    };
  }

  async function createCheckout(req, res) {
    const { maxAmount } = config();
    const body = req.body || {};
    const userEmail =
      typeof body.userEmail === "string" ? body.userEmail.trim() : "";
    const deliveryAddress =
      typeof body.deliveryAddress === "string"
        ? body.deliveryAddress.trim()
        : "";
    if (
      !userEmail ||
      userEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)
    ) {
      fail(400, "A valid customer email is required.");
    }
    if (!deliveryAddress || deliveryAddress.length > 2000) {
      fail(400, "A delivery address of at most 2000 characters is required.");
    }
    if (
      !Array.isArray(body.items) ||
      !body.items.length ||
      body.items.length > 100
    ) {
      fail(400, "Your cart must contain between 1 and 100 products.");
    }
    const quantities = new Map();
    for (const item of body.items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !objectId.test(item.productId) ||
        !Number.isInteger(item.qty) ||
        item.qty < 1 ||
        item.qty > 100
      ) {
        fail(
          400,
          "Choose valid products and quantities from the product catalogue.",
        );
      }
      const id = item.productId.toLowerCase();
      const quantity = (quantities.get(id) || 0) + item.qty;
      if (quantity > 100)
        fail(400, "You can order at most 100 of each product.");
      quantities.set(id, quantity);
    }
    const requested = [...quantities].sort(([a], [b]) => a.localeCompare(b));
    const fingerprint = crypto
      .createHash("sha256")
      .update(JSON.stringify({ userEmail, deliveryAddress, items: requested }))
      .digest("hex");
    const checkoutId = body.checkoutId || crypto.randomUUID();
    if (
      typeof checkoutId !== "string" ||
      !/^[a-zA-Z0-9_-]{16,100}$/.test(checkoutId)
    ) {
      fail(400, "The checkout reference is invalid.");
    }

    // Ensure uniqueness before creating orders, including concurrent retries.
    await Order.init();
    const previous = await Order.findOne({ checkoutId });
    if (previous) {
      if (previous.checkoutFingerprint !== fingerprint) {
        fail(
          409,
          "This checkout reference belongs to a different cart. Start a new checkout.",
        );
      }
      if (previous.paymentStatus === "paid") {
        const completed = await effects.apply(previous);
        return res.json({ ...checkoutResponse(completed), alreadyPaid: true });
      }
      assertAmountLimit(previous.amount, maxAmount);
      if (!previous.razorpayOrderId) {
        fail(
          409,
          "This checkout is still being created. Please retry in a moment.",
        );
      }
      return res.json(checkoutResponse(previous));
    }

    const products = await Product.find({
      _id: { $in: requested.map(([id]) => id) },
    });
    const byId = new Map(
      products.map((product) => [String(product._id), product]),
    );
    let subtotalPaise = 0;
    const items = requested.map(([productId, qty]) => {
      const product = byId.get(productId);
      if (!product)
        fail(400, "A product is no longer available. Refresh your cart.");
      const pricePaise = Math.round(Number(product.price) * 100);
      if (!Number.isSafeInteger(pricePaise) || pricePaise <= 0) {
        fail(400, `${product.name} does not have a valid selling price.`);
      }
      if (!Number.isFinite(product.quantity) || product.quantity < qty) {
        fail(
          400,
          `There is not enough stock for ${product.name}. Please update your cart.`,
        );
      }
      subtotalPaise += pricePaise * qty;
      return { productId, name: product.name, qty, price: pricePaise / 100 };
    });
    // Preserve the storefront's existing 10% shipping & tax charge, rounded to paise.
    const shippingPaise = Math.round(subtotalPaise * 0.1);
    const amount = subtotalPaise + shippingPaise;
    if (!Number.isSafeInteger(amount) || amount < 100) {
      fail(
        400,
        "The order total must be at least INR 1 and within the supported range.",
      );
    }
    assertAmountLimit(amount, maxAmount);

    let order;
    try {
      order = await Order.create({
        customer: userEmail,
        userEmail,
        deliveryAddress,
        items,
        subtotal: subtotalPaise / 100,
        shipping: shippingPaise / 100,
        total: amount / 100,
        amount,
        currency: "INR",
        status: "Awaiting payment",
        paymentProvider: "razorpay",
        paymentStatus: "pending",
        checkoutId,
        checkoutFingerprint: fingerprint,
      });
    } catch (error) {
      if (error.code === 11000)
        fail(
          409,
          "Checkout is already being created. Please retry in a moment.",
        );
      throw error;
    }

    const localOrderId = order._id;
    try {
      const remote = await getClient().orders.create({
        amount,
        currency: "INR",
        receipt: String(order._id),
        notes: { store_order_id: String(order._id) },
      });
      if (
        !gatewayOrderId.test(remote.id) ||
        Number(remote.amount) !== amount ||
        remote.currency !== "INR"
      ) {
        fail(
          502,
          "The payment provider returned an invalid order. Please retry.",
        );
      }
      order = await Order.findOneAndUpdate(
        { _id: order._id },
        { $set: { razorpayOrderId: remote.id } },
        { new: true },
      );
      if (!order) fail(503, "Unable to save the checkout. Please retry.");
    } catch (error) {
      // No checkout was exposed to the browser, so it cannot have been paid.
      // Release the request key so a retry can create another provider order.
      await Order.updateOne(
        { _id: localOrderId, razorpayOrderId: { $exists: false } },
        {
          $unset: { checkoutId: 1 },
          $set: { status: "Payment setup failed", paymentStatus: "failed" },
        },
        { runValidators: true },
      );
      if (isAmountLimitError(error)) {
        fail(
          422,
          "This order exceeds the online payment limit currently allowed by the store's payment provider. Reduce your cart total or contact the store to arrange payment. The store owner can request a higher limit from Razorpay.",
          "PAYMENT_AMOUNT_LIMIT",
        );
      }
      throw error;
    }
    res.status(201).json(checkoutResponse(order));
  }

  function assertPayment(order, payment) {
    if (
      !payment ||
      payment.order_id !== order.razorpayOrderId ||
      Number(payment.amount) !== order.amount ||
      payment.currency !== order.currency
    ) {
      fail(400, "The payment does not match this order's amount or currency.");
    }
  }

  async function settle(order, paymentId, capture) {
    if (order.paymentStatus === "paid") {
      if (order.razorpayPaymentId !== paymentId)
        fail(409, "This order has a different payment reference.");
      return effects.apply(order);
    }
    const api = getClient();
    let payment = await api.payments.fetch(paymentId);
    assertPayment(order, payment);
    if (payment.id !== paymentId)
      fail(400, "The payment reference does not match.");
    if (capture && payment.status === "authorized") {
      try {
        payment = await api.payments.capture(
          paymentId,
          order.amount,
          order.currency,
        );
      } catch {
        // Auto capture or another callback may have captured it concurrently.
        payment = await api.payments.fetch(paymentId);
      }
      assertPayment(order, payment);
    }
    if (payment.status !== "captured" || payment.captured !== true) return null;
    const paid = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          paymentStatus: "paid",
          razorpayPaymentId: paymentId,
          paymentMethod: payment.method,
          paidAt: new Date(),
          status: "Pending",
        },
      },
      { new: true, runValidators: true },
    );
    // Duplicate webhook/callback must not reset a Packed/Delivered order.
    const result = paid || (await Order.findById(order._id));
    if (
      !result ||
      result.paymentStatus !== "paid" ||
      result.razorpayPaymentId !== paymentId
    ) {
      fail(
        409,
        "Payment confirmation is being updated. Please retry verification.",
      );
    }
    return effects.apply(result);
  }

  router.get(
    "/payments/config",
    endpoint(async (_req, res) => {
      res.json({ success: true, ...config() });
    }),
  );
  router.post("/payments/orders", endpoint(createCheckout));
  // Existing clients must also use trusted pricing and verified payments.
  router.post("/orders", endpoint(createCheckout));

  router.post(
    "/payments/verify",
    endpoint(async (req, res) => {
      config();
      const {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body || {};
      if (
        typeof orderId !== "string" ||
        !objectId.test(orderId) ||
        typeof razorpay_order_id !== "string" ||
        !gatewayOrderId.test(razorpay_order_id) ||
        typeof razorpay_payment_id !== "string" ||
        !gatewayPaymentId.test(razorpay_payment_id)
      ) {
        fail(400, "Valid order and payment references are required.");
      }
      const order = await Order.findById(orderId);
      if (!order || order.paymentProvider !== "razorpay")
        fail(404, "Payment order not found.");
      if (
        order.razorpayOrderId !== razorpay_order_id ||
        !validSignature(
          `${order.razorpayOrderId}|${razorpay_payment_id}`,
          razorpay_signature,
          env.RAZORPAY_KEY_SECRET.trim(),
        )
      ) {
        fail(400, "Payment signature verification failed.");
      }
      const paid = await settle(order, razorpay_payment_id, true);
      if (!paid) {
        return res.status(202).json({
          success: false,
          pending: true,
          message:
            "Your payment is awaiting confirmation. Retry verification without paying again.",
        });
      }
      res.json({ success: true, order: paid });
    }),
  );

  router.put(
    "/orders/:id",
    endpoint(async (req, res) => {
      const body = req.body || {};
      if (
        !objectId.test(req.params.id) ||
        Object.keys(body).some((key) => key !== "status") ||
        !["Pending", "Packed", "Delivered"].includes(body.status)
      ) {
        fail(
          400,
          "Only the fulfillment status (Pending, Packed or Delivered) can be updated.",
        );
      }
      const order = await Order.findOneAndUpdate(
        {
          _id: req.params.id,
          $or: [
            { paymentProvider: { $ne: "razorpay" } },
            { paymentStatus: "paid", inventoryStatus: "deducted" },
          ],
        },
        { $set: { status: body.status } },
        { new: true, runValidators: true },
      );
      if (!order)
        fail(
          409,
          "Order not found, payment is unconfirmed, or inventory needs attention.",
        );
      res.json({ success: true, order });
    }),
  );

  const webhook = endpoint(async (req, res) => {
    const secret = env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!secret) fail(503, "The payment webhook is not configured.");
    if (
      !Buffer.isBuffer(req.body) ||
      !validSignature(req.body, req.get("x-razorpay-signature"), secret)
    ) {
      fail(400, "Invalid webhook signature.");
    }
    let event;
    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      fail(400, "Invalid webhook payload.");
    }
    if (!["payment.captured", "order.paid"].includes(event.event)) {
      return res.json({ success: true });
    }
    const payment = event.payload?.payment?.entity;
    if (
      !payment ||
      !gatewayPaymentId.test(payment.id) ||
      !gatewayOrderId.test(payment.order_id)
    ) {
      fail(400, "Missing webhook payment reference.");
    }
    const order = await Order.findOne({ razorpayOrderId: payment.order_id });
    // The account may also be used by another application.
    if (!order) return res.json({ success: true });
    const paid = await settle(order, payment.id, false);
    if (!paid)
      fail(503, "The payment is not yet captured. Retry this webhook.");
    res.json({ success: true });
  });

  return { router, webhook, reconcilePaidOrders: effects.reconcile };
}

module.exports = { createPaymentRoutes };
