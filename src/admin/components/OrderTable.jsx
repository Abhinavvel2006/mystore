import { Icon } from "./Workspace";

export default function OrderTable({ orders, onStatusChange, savingId }) {
  return (
    <div className="aw-table-scroll">
      <table className="aw-table">
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Customer</th>
            <th scope="col">Total</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const id = order._id || order.id;
            const label = String(id).slice(-6).toUpperCase();
            const status = order.status || "Pending";
            const normalized = status.toLowerCase();
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
                <td>
                  <strong>${Number(order.total || 0).toFixed(2)}</strong>
                </td>
                <td>
                  <div className="aw-order-status">
                    <span className={`aw-pill ${tone}`}>{status}</span>
                    {onStatusChange && (
                      <select
                        aria-label={`Update status for order ${label}`}
                        value={knownStatus || status}
                        disabled={savingId !== null}
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
