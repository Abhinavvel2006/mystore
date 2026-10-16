import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon, Metric, PageHeading } from "../components/Workspace";

const methods = [
  {
    name: "Cash on delivery",
    description: "Customers pay when their order arrives",
    status: "Active",
    icon: "box",
  },
  {
    name: "Credit card",
    description: "Card payments at checkout",
    status: "Active",
    icon: "wallet",
  },
  {
    name: "Bank transfer",
    description: "Manual transfer and verification",
    status: "Paused",
    icon: "wallet",
  },
];
const expenses = [
  {
    title: "Server hosting",
    category: "Infrastructure",
    amount: 180,
    date: "Jan 10",
  },
  { title: "Marketing", category: "Growth", amount: 320, date: "Jan 12" },
  {
    title: "Supplier payment",
    category: "Inventory",
    amount: 1250,
    date: "Jan 15",
  },
];

export default function AdminPayment() {
  const [filter, setFilter] = useState("all");
  const exportExpenses = () => {
    const csv = [
      "Item,Category,Amount (USD),Date",
      ...expenses.map(
        (item) => `${item.title},${item.category},${item.amount},${item.date}`,
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mystore-sample-expenses.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="aw">
      <PageHeading
        title="Payments"
        section="Finance"
        description="A clear view of payment methods, credit, and expenses."
      >
        <Link className="aw-button" to="/admin/orders">
          View orders <Icon name="arrow" />
        </Link>
        <button
          className="aw-button aw-button-primary"
          onClick={exportExpenses}
        >
          Export sample report
        </button>
      </PageHeading>
      <div className="aw-notice">
        <strong>Sample financial overview.</strong> These figures and methods
        are illustrative, not live account balances.
      </div>
      <div className="aw-payment-summary">
        <Metric
          label="Sample credit balance"
          value="$24,500"
          detail="Illustrative account total"
          icon="wallet"
        />
        <Metric
          label="Pending payments"
          value="12"
          detail="Sample items awaiting review"
          icon="warning"
          tone="amber"
        />
        <Metric
          label="Sample expenses"
          value="$1,750"
          detail="Across 3 expense records"
          icon="category"
          tone="blue"
        />
      </div>
      <div className="aw-split">
        <section className="aw-surface">
          <div className="aw-panel-heading">
            <div>
              <h2>Payment methods</h2>
              <p>Sample checkout options and their availability</p>
            </div>
            <span className="aw-pill neutral">3 methods</span>
          </div>
          <div className="aw-toolbar">
            <select
              aria-label="Filter payment methods"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All methods</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
          {methods
            .filter((method) => filter === "all" || method.status === filter)
            .map((method) => (
              <div className="aw-payment-method" key={method.name}>
                <span className="aw-thumb">
                  <Icon name={method.icon} />
                </span>
                <div>
                  <h3>{method.name}</h3>
                  <p>{method.description}</p>
                </div>
                <span
                  className={`aw-pill ${method.status === "Paused" ? "warn" : ""}`}
                >
                  {method.status}
                </span>
              </div>
            ))}
        </section>
        <section className="aw-surface">
          <div className="aw-panel-heading">
            <div>
              <h2>Credit allocation</h2>
              <p>Sample credit utilization</p>
            </div>
            <Icon name="wallet" />
          </div>
          <div className="aw-panel-body">
            <div className="aw-credit-legend">
              <span>
                Used credit<strong>$6,100</strong>
              </span>
              <span>
                Available<strong>$18,400</strong>
              </span>
            </div>
            <progress
              className="aw-credit-bar"
              value={6100}
              max={24500}
              aria-label="Sample used credit"
            />
            <span className="aw-pill neutral">24.9% of total credit used</span>
          </div>
          <div className="aw-help-panel">
            This overview is for display only. No payment or transfer is
            initiated here.
          </div>
        </section>
      </div>
      <section className="aw-surface">
        <div className="aw-panel-heading">
          <div>
            <h2>Expense ledger</h2>
            <p>Sample records for a quick financial overview</p>
          </div>
          <span className="aw-pill neutral">USD</span>
        </div>
        <div className="aw-table-scroll">
          <table className="aw-table">
            <thead>
              <tr>
                <th>Expense</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.title}>
                  <td>
                    <div className="aw-product-cell">
                      <span className="aw-thumb">
                        <Icon name="wallet" />
                      </span>
                      <strong>{expense.title}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="aw-pill neutral">{expense.category}</span>
                  </td>
                  <td>{expense.date}</td>
                  <td>
                    <strong>
                      $
                      {expense.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
