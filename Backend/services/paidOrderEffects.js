const OrderModel = require("../model/order");
const ProductModel = require("../model/product");
const RevenueModel = require("../model/revenue");

// Each write is independently idempotent. This also works on standalone MongoDB,
// where multi-document transactions are not available.
function createPaidOrderEffects({
  Order = OrderModel,
  Product = ProductModel,
  Revenue = RevenueModel,
} = {}) {
  let reconciling = false;

  async function apply(order) {
    if (
      order.paymentProvider !== "razorpay" ||
      order.paymentStatus !== "paid" ||
      order.effectsAppliedAt
    ) {
      return order;
    }
    const orderId = String(order._id);
    if (
      !Number.isSafeInteger(order.amount) ||
      order.amount <= 0 ||
      !order.razorpayPaymentId
    ) {
      throw new Error("Paid order has invalid payment details.");
    }

    // Revenue reflects captured receipts even if an inventory issue needs attention.
    // _id is already unique in MongoDB, so concurrent callbacks cannot insert twice.
    const revenue = {
      orderId,
      title: `Order #${orderId.slice(-6).toUpperCase()}`,
      source: "Razorpay order",
      amount: order.amount / 100,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      razorpayPaymentId: order.razorpayPaymentId,
      date: order.paidAt || order.updatedAt || new Date(),
    };
    try {
      await Revenue.findOneAndUpdate(
        { _id: order._id, orderId },
        { $setOnInsert: revenue },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    } catch (error) {
      if (
        error.code !== 11000 ||
        !(await Revenue.findOne({ _id: order._id, orderId }))
      ) {
        throw error;
      }
    }

    const quantities = new Map();
    const issues = [];
    for (const item of order.items || []) {
      if (
        !/^[a-f\d]{24}$/i.test(item.productId) ||
        !Number.isSafeInteger(item.qty) ||
        item.qty < 1
      ) {
        issues.push("An order item has invalid inventory details.");
        continue;
      }
      const productId = item.productId.toLowerCase();
      const previous = quantities.get(productId);
      quantities.set(productId, {
        qty: (previous?.qty || 0) + item.qty,
        name: item.name || "Product",
      });
    }
    if (!quantities.size && !issues.length)
      issues.push("The paid order has no inventory items.");

    for (const [productId, item] of quantities) {
      if (!Number.isSafeInteger(item.qty)) {
        issues.push(`Invalid quantity for ${item.name}.`);
        continue;
      }
      // The decrement and marker are one atomic write: retrying after a crash or
      // duplicate webhook cannot decrement this product again for the same order.
      const result = await Product.updateOne(
        {
          _id: productId,
          quantity: { $gte: item.qty },
          inventoryOrderIds: { $ne: orderId },
        },
        {
          $inc: { quantity: -item.qty },
          $addToSet: { inventoryOrderIds: orderId },
        },
      );
      if (result.matchedCount === 0) {
        const applied = await Product.findOne({
          _id: productId,
          inventoryOrderIds: orderId,
        });
        if (!applied)
          issues.push(
            `${item.name}: product missing or not enough stock for ${item.qty} unit(s).`,
          );
      }
    }

    const update = issues.length
      ? { inventoryStatus: "attention", inventoryIssues: issues }
      : {
          inventoryStatus: "deducted",
          inventoryIssues: [],
          effectsAppliedAt: new Date(),
        };
    const updated = await Order.findOneAndUpdate(
      {
        _id: order._id,
        paymentStatus: "paid",
        effectsAppliedAt: { $exists: false },
      },
      { $set: update },
      { new: true, runValidators: true },
    );
    // A concurrent successful retry takes precedence over a stale shortage report.
    return updated || (await Order.findById(order._id));
  }

  async function reconcile() {
    if (reconciling) return;
    reconciling = true;
    const result = { completed: 0, attention: 0, failed: 0 };
    try {
      const orders = Order.find({
        paymentProvider: "razorpay",
        paymentStatus: "paid",
        effectsAppliedAt: { $exists: false },
      })
        .sort({ paidAt: 1, _id: 1 })
        .cursor();
      for await (const order of orders) {
        try {
          const updated = await apply(order);
          if (updated?.effectsAppliedAt) result.completed += 1;
          else result.attention += 1;
        } catch {
          result.failed += 1;
        }
      }
      return result;
    } finally {
      reconciling = false;
    }
  }

  return { apply, reconcile };
}

module.exports = { createPaidOrderEffects };
