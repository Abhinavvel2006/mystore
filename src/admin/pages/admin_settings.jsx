import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon, PageHeading } from "../components/Workspace";

export default function AdminSettings() {
  const [tab, setTab] = useState("general");
  const [dark, setDark] = useState(false);
  const [credit, setCredit] = useState("");
  const [balance, setBalance] = useState(1000);
  const [notice, setNotice] = useState("");
  const [stocks, setStocks] = useState([
    { id: 1, name: "Product A", qty: 12 },
    { id: 2, name: "Product B", qty: 5 },
    { id: 3, name: "Product C", qty: 0 },
  ]);
  const [admin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin")) || {};
    } catch {
      return {};
    }
  });

  const addCredit = (event) => {
    event.preventDefault();
    const amount = Number(credit);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBalance((value) => value + amount);
    setCredit("");
    setNotice(`$ ${amount.toFixed(2)} added to the demo balance.`);
  };
  const updateStock = (id, delta) =>
    setStocks((items) =>
      items.map((p) =>
        p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p,
      ),
    );

  return (
    <div className={`aw ${dark ? "aw-dark" : ""}`}>
      <PageHeading
        title="Settings"
        description="A workspace that works the way you do."
      >
        <span className="aw-pill neutral">
          <Icon name="settings" /> Workspace preferences
        </span>
      </PageHeading>
      <div className="aw-tabs" role="tablist" aria-label="Settings sections">
        {[
          ["general", "General"],
          ["credits", "Account credits"],
          ["inventory", "Inventory"],
        ].map(([key, label]) => (
          <button
            key={key}
            id={`settings-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            aria-controls={`settings-panel-${key}`}
            onClick={() => {
              setTab(key);
              setNotice("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
      >
        {tab === "general" && (
          <>
            <section className="aw-setting-section">
              <div className="aw-setting-description">
                <h2>Account profile</h2>
                <p>
                  Your signed-in administrator account and workspace access.
                </p>
              </div>
              <div className="aw-surface">
                <div className="aw-setting-row">
                  <div className="aw-product-cell">
                    <span className="aw-avatar">
                      {(admin.name || "Admin").slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3>{admin.name || "Admin"}</h3>
                      <p>{admin.email || "Store administrator"}</p>
                    </div>
                  </div>
                  <span className="aw-pill">
                    <Icon name="check" /> Administrator
                  </span>
                </div>
                <div className="aw-setting-row">
                  <div>
                    <h3>MyStore workspace</h3>
                    <p>Products, categories, inventory, and store operations</p>
                  </div>
                  <Link className="aw-text-link" to="/admin/dashboard">
                    Open overview <Icon name="arrow" />
                  </Link>
                </div>
              </div>
            </section>
            <section className="aw-setting-section">
              <div className="aw-setting-description">
                <h2>Appearance</h2>
                <p>
                  Choose a comfortable appearance for this settings workspace.
                </p>
              </div>
              <div className="aw-surface">
                <div className="aw-setting-row">
                  <div>
                    <h3>Workspace theme</h3>
                    <p>Applies while this settings page is open.</p>
                  </div>
                  <div className="aw-preference-options">
                    <button
                      className="aw-preference"
                      aria-pressed={!dark}
                      onClick={() => setDark(false)}
                    >
                      <span className="aw-theme-preview" />
                      Light
                    </button>
                    <button
                      className="aw-preference"
                      aria-pressed={dark}
                      onClick={() => setDark(true)}
                    >
                      <span className="aw-theme-preview dark" />
                      Dark
                    </button>
                  </div>
                </div>
              </div>
            </section>
            <section className="aw-setting-section">
              <div className="aw-setting-description">
                <h2>Store operations</h2>
                <p>Jump to the tools that keep your store running smoothly.</p>
              </div>
              <div className="aw-surface">
                <div className="aw-setting-row">
                  <div>
                    <h3>Inventory & availability</h3>
                    <p>Edit prices and stock for your published products.</p>
                  </div>
                  <Link className="aw-text-link" to="/admin/products">
                    Manage products <Icon name="arrow" />
                  </Link>
                </div>
                <div className="aw-setting-row">
                  <div>
                    <h3>Notifications</h3>
                    <p>Review stock warnings and order alerts.</p>
                  </div>
                  <Link className="aw-text-link" to="/admin/notifications">
                    View alerts <Icon name="arrow" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
        {tab === "credits" && (
          <section className="aw-setting-section">
            <div className="aw-setting-description">
              <h2>Account credits</h2>
              <p>Try the credit controls using a sample balance.</p>
            </div>
            <div className="aw-surface">
              <div className="aw-panel-heading">
                <h2>Credit balance</h2>
                <span className="aw-pill warn">Demo</span>
              </div>
              <div className="aw-panel-body">
                <p className="aw-subtitle">Sample available balance</p>
                <div className="aw-balance">${balance.toFixed(2)}</div>
                <div className="aw-notice">
                  Demo credits only. No money is transferred and changes reset
                  when you leave this page.
                </div>
                {notice && (
                  <div className="aw-notice success" role="status">
                    {notice}
                  </div>
                )}
                <form className="aw-form" onSubmit={addCredit}>
                  <label>
                    Amount ($)
                    <input
                      required
                      className="aw-input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={credit}
                      onChange={(e) => setCredit(e.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                  <div className="aw-actions">
                    {[50, 100, 250].map((amount) => (
                      <button
                        className="aw-button"
                        key={amount}
                        type="button"
                        onClick={() => setCredit(String(amount))}
                      >
                        +${amount}
                      </button>
                    ))}
                  </div>
                  <div className="aw-actions">
                    <button
                      className="aw-button aw-button-primary"
                      type="submit"
                    >
                      <Icon name="plus" /> Add demo credits
                    </button>
                    <Link className="aw-text-link" to="/admin/orders">
                      View orders <Icon name="arrow" />
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}
        {tab === "inventory" && (
          <section className="aw-setting-section">
            <div className="aw-setting-description">
              <h2>Inventory controls</h2>
              <p>Preview quantity adjustments using sample products.</p>
            </div>
            <div className="aw-surface">
              <div className="aw-panel-heading">
                <h2>Sample inventory</h2>
                <span className="aw-pill warn">Demo</span>
              </div>
              {stocks.map((p) => (
                <div className="aw-setting-row" key={p.id}>
                  <div className="aw-product-cell">
                    <span className="aw-thumb">
                      <Icon name="box" />
                    </span>
                    <div>
                      <h3>{p.name}</h3>
                      <p>Sample SKU · 00{p.id}</p>
                    </div>
                  </div>
                  <div className="aw-stepper">
                    <button
                      className="aw-button aw-icon-button"
                      disabled={p.qty === 0}
                      aria-label={`Decrease ${p.name} quantity`}
                      onClick={() => updateStock(p.id, -1)}
                    >
                      −
                    </button>
                    <output aria-live="polite">{p.qty}</output>
                    <button
                      className="aw-button aw-icon-button"
                      aria-label={`Increase ${p.name} quantity`}
                      onClick={() => updateStock(p.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="aw-help-panel">
                These samples reset when you leave.{" "}
                <Link className="aw-text-link" to="/admin/products">
                  Manage live inventory <Icon name="arrow" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
