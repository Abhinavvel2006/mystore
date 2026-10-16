import { Icon } from "./Workspace";
import formatCurrency from "../../currency";

const paymentMethodLabels = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
  wallet: "Wallet",
  emi: "EMI",
  paylater: "Pay later",
};

export default function OrderTable({ orders, onStatusChange, savingId }) {
  return (
    <div className="aw-table-scroll">
      <table className="aw-table">
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Customer</th>
            <th scope="col">Delivery address</th>
            <th scope="col">Total</th>
            <th scope="col">Payment</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const id = order._id || order.id;
            const label = String(id).slice(-6).toUpperCase();
            const status = order.status || "Pending";
            const normalized = status.toLowerCase();
            const paymentStatus = order.paymentStatus || "";
            const isPaid = paymentStatus.toLowerCase() === "paid";
            const awaitingPayment =
              order.paymentProvider === "razorpay" && !isPaid;
            const awaitingInventory =
              order.paymentProvider === "razorpay" &&
              isPaid &&
              order.inventoryStatus !== "deducted";
            const tone =
              normalized === "delivered"
                ? ""
                : normalized === "pending"
                  ? "warn"
                  : "neutral";
            const knownStatus = ["Pending", "Packed", "Delivered"].find(
              (value) => value.toLowerCase() === normalized,
            );
            return (
              <tr key={id}>
                <td>
                  <div className="aw-product-cell">
                    <span className="aw-thumb">
                      <Icon name="order" />
                    </span>
                    <div>
                      <strong>#{label}</strong>
                      <small>
                        {Array.isArray(order.items) ? order.items.length : 0}{" "}
                        items
                      </small>
                    </div>
                  </div>
                </td>
                <td>{order.customer || order.userEmail || "Guest"}</td>
                <td>{order.deliveryAddress || "—"}</td>
                <td>
                  <strong>{formatCurrency(Number(order.total || 0))}</strong>
                </td>
                <td>
                  <span
                    className={`aw-pill ${isPaid ? "" : paymentStatus ? "warn" : "neutral"}`}
                  >
                    {paymentStatus
                      ? paymentStatus.charAt(0).toUpperCase() +
                        paymentStatus.slice(1)
                      : "Not recorded"}
                  </span>
                  {order.paymentMethod && (
                    <div>
                      <small>
                        {paymentMethodLabels[order.paymentMethod] ||
                          order.paymentMethod}
                      </small>
                    </div>
                  )}
                </td>
                <td>
                  <div className="aw-order-status">
                    <span className={`aw-pill ${tone}`}>{status}</span>
                    {awaitingInventory && (
                      <span
                        className="aw-pill warn"
                        title={(order.inventoryIssues || []).join(" ")}
                      >
                        {order.inventoryStatus === "attention"
                          ? "Stock needs attention"
                          : "Updating stock"}
                      </span>
                    )}
                    {onStatusChange && (
                      <select
                        aria-label={`Update status for order ${label}`}
                        value={knownStatus || status}
                        disabled={
                          savingId !== null ||
                          awaitingPayment ||
                          awaitingInventory
                        }
                        title={
                          awaitingPayment
                            ? "Payment must be confirmed before fulfillment."
                            : awaitingInventory
                              ? "Resolve the stock issue before fulfillment. Inventory retries automatically after restocking."
                              : undefined
                        }
                        onChange={(event) =>
                          onStatusChange(id, event.target.value)
                        }
                      >
                        {!knownStatus && (
                          <option value={status}>{status}</option>
                        )}
                        <option value="Pending">Pending</option>
                        <option value="Packed">Packed</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    )}
                    {savingId === id && <span role="status">Saving...</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
