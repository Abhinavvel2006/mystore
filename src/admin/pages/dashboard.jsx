import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { EmptyState, Icon, Metric, PageHeading } from "../components/Workspace";
import OrderTable from "../components/OrderTable";
import useOrders from "../useOrders";
import formatCurrency from "../../currency";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    reload: reloadOrders,
  } = useOrders();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("http://localhost:5000/api/products")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error();
        if (active) {
          setProducts(data);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "We couldn't load your catalogue. Check your connection and try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  const inStock = products.filter((p) => Number(p.quantity) > 5).length;
  const lowStock = products.filter(
    (p) => Number(p.quantity) > 0 && Number(p.quantity) <= 5,
  ).length;
  const outOfStock = products.filter(
    (p) => Number(p.quantity || 0) <= 0,
  ).length;
  const units = products.reduce(
    (sum, p) => sum + Math.max(0, Number(p.quantity) || 0),
    0,
  );
  const categoryCount = new Set(products.map((p) => p.category || "General"))
    .size;
  const metric = (value) => (loading || error ? "—" : value);
  const date = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Calcutta",
  }).format(new Date());

  return (
    <div className="aw">
      <PageHeading
        title="Store overview"
        section="Dashboard"
        description="Your catalogue, inventory, and next steps at a glance."
      >
        <span className="aw-pill neutral">{date}</span>
        <Link
          className="aw-button aw-button-primary"
          to="/admin/products?new=1"
        >
          <Icon name="plus" /> Add product
        </Link>
      </PageHeading>
      {error && (
        <div className="aw-notice error" role="alert">
          {error}{" "}
          <button
            className="aw-button"
            onClick={() => {
              setLoading(true);
              setRevision((value) => value + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      <div className="aw-metrics">
        <Metric
          label="Total products"
          value={metric(products.length)}
          detail="Products in your catalogue"
          icon="box"
        />
        <Metric
          label="Units in stock"
          value={metric(units)}
          detail="Available across all products"
          icon="check"
          tone="blue"
        />
        <Metric
          label="Low stock"
          value={metric(lowStock)}
          detail="Products with 1–5 units left"
          icon="warning"
          tone="amber"
        />
        <Metric
          label="Active categories"
          value={metric(categoryCount)}
          detail="Categories with products"
          icon="category"
          tone="purple"
        />
      </div>
      <div className="aw-split">
        <section className="aw-surface">
          <div className="aw-panel-heading">
            <div>
              <h2>Catalogue snapshot</h2>
              <p>Keep your product listings up to date.</p>
            </div>
            <Link className="aw-text-link" to="/admin/products">
              Manage <Icon name="arrow" />
            </Link>
          </div>
          {loading ? (
            <EmptyState
              title="Loading your catalogue"
              description="Fetching your latest products."
            />
          ) : error ? (
            <EmptyState
              title="Catalogue unavailable"
              description="Your products will appear here when the connection is restored."
            />
          ) : products.length ? (
            <div className="aw-table-scroll">
              <table className="aw-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((p) => (
                    <tr key={p._id || p.id}>
                      <td>
                        <div className="aw-product-cell">
                          {p.image ? (
                            <img className="aw-thumb" src={p.image} alt="" />
                          ) : (
                            <span className="aw-thumb">
                              <Icon name="box" />
                            </span>
                          )}
                          <div>
                            <strong>{p.name}</strong>
                            <small>{p.category || "General"}</small>
                          </div>
                        </div>
                      </td>
                      <td>{formatCurrency(Number(p.price || 0))}</td>
                      <td>
                        <span
                          className={`aw-pill ${Number(p.quantity) > 5 ? "" : "warn"}`}
                        >
                          {Number(p.quantity) > 0
                            ? `${p.quantity} in stock`
                            : "Out of stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Your catalogue starts here"
              description="Add your first product to start building your storefront."
            >
              <Link
                className="aw-button aw-button-primary"
                to="/admin/products?new=1"
              >
                <Icon name="plus" /> Create product
              </Link>
            </EmptyState>
          )}
          <div className="aw-help-panel">
            A complete name, clear image, and accurate stock count help
            customers shop with confidence.
          </div>
        </section>
        <section className="aw-surface">
          <div className="aw-panel-heading">
            <div>
              <h2>Inventory health</h2>
              <p>Product availability across your store</p>
            </div>
            <Icon name="box" />
          </div>
          {loading || error ? (
            <EmptyState
              title={loading ? "Loading inventory" : "Inventory unavailable"}
              description="Stock levels appear after the catalogue loads."
            />
          ) : (
            <div className="aw-panel-body">
              {[
                ["Healthy stock", inStock],
                ["Running low", lowStock],
                ["Out of stock", outOfStock],
              ].map(([label, count]) => (
                <div className="aw-health-row" key={label}>
                  <span>{label}</span>
                  <progress
                    max={products.length || 1}
                    value={count}
                    aria-label={label}
                  />
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="aw-help-panel">
            <Link className="aw-text-link" to="/admin/notifications">
              Review inventory alerts <Icon name="arrow" />
            </Link>
          </div>
        </section>
      </div>
      <div className="aw-split">
        <section className="aw-surface">
          <div className="aw-panel-heading">
            <div>
              <h2>Recent orders</h2>
              <p>Track your latest customer orders.</p>
            </div>
            <Link className="aw-text-link" to="/admin/orders">
              View all <Icon name="arrow" />
            </Link>
          </div>
          {ordersLoading ? (
            <EmptyState
              icon="order"
              title="Loading orders"
              description="Fetching your latest order activity."
            />
          ) : ordersError ? (
            <EmptyState
              icon="order"
              title="Orders unavailable"
              description={ordersError}
            >
              <button className="aw-button" onClick={reloadOrders}>
                Try again
              </button>
            </EmptyState>
          ) : orders.length ? (
            <OrderTable orders={orders.slice(0, 5)} />
          ) : (
            <EmptyState
              icon="order"
              title="No orders yet"
              description="New customer orders will appear here."
            />
          )}
        </section>
        <section className="aw-surface">
          <div className="aw-panel-heading">
            <div>
              <h2>Quick access</h2>
              <p>A shorter path to everyday tasks</p>
            </div>
          </div>
          <div className="aw-task-list">
            {[
              [
                "category",
                "Organize categories",
                "Group products for easy discovery",
                "/admin/categories",
              ],
              [
                "wallet",
                "Expenses & revenue",
                "Review income and expenses",
                "/admin/payment",
              ],
              [
                "settings",
                "Workspace settings",
                "Manage your preferences",
                "/admin/settings",
              ],
            ].map(([icon, title, detail, path]) => (
              <Link className="aw-task" key={path} to={path}>
                <span className="aw-task-icon">
                  <Icon name={icon} />
                </span>
                <span className="aw-task-copy">
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </span>
                <Icon name="arrow" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
