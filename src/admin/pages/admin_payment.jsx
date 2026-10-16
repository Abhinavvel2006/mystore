import { Link } from "react-router-dom";
import { EmptyState, Icon, Metric, PageHeading } from "../components/Workspace";
import useFinance from "../useFinance";
import formatCurrency from "../../currency";
import "./admin_payment.css";

function amountInCents(amount) {
  if (amount === null || amount === undefined || amount === "") return null;
  const value = Number(amount);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function totalAmount(records) {
  const amounts = records.map((record) => amountInCents(record.amount));
  if (amounts.some((amount) => amount === null)) return null;
  return amounts.reduce((sum, amount) => sum + amount, 0) / 100;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function csvCell(value) {
  const text = String(value ?? "");
  // Keep record titles containing spreadsheet formulas as literal text.
  const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function FinanceLedger({ type, records, loading, error }) {
  const expense = type === "Expense";
  return (
    <section className="aw-surface aw-finance-ledger" aria-busy={loading}>
      <div className="aw-panel-heading">
        <div>
          <h2>{type} ledger</h2>
          <p>
            {expense ? "Track your store's expenses" : "Review recorded income"}
          </p>
        </div>
        <span className="aw-pill neutral">
          {loading || error ? "INR" : `${records.length} records · INR`}
        </span>
      </div>
      {loading ? (
        <div role="status">
          <EmptyState
            icon="wallet"
            title={`Loading ${type.toLowerCase()} records`}
            description="Getting your latest financial activity."
          />
        </div>
      ) : error ? (
        <EmptyState
          icon="warning"
          title={`${type} records unavailable`}
          description="Try refreshing to load your financial activity."
        />
      ) : records.length === 0 ? (
        <EmptyState
          icon={expense ? "order" : "wallet"}
          title={`No ${type.toLowerCase()} records yet`}
          description={`Your recorded ${expense ? "expenses" : "revenue"} will appear here.`}
        />
      ) : (
        <div className="aw-table-scroll">
          <table className="aw-table">
            <thead>
              <tr>
                <th scope="col">{type}</th>
                <th scope="col">{expense ? "Category" : "Source"}</th>
                <th scope="col">Date</th>
                <th scope="col" className="aw-finance-amount">
                  Amount (INR)
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const cents = amountInCents(record.amount);
                return (
                  <tr key={record._id}>
                    <td>
                      <div className="aw-product-cell">
                        <span className="aw-thumb">
                          <Icon name={expense ? "order" : "wallet"} />
                        </span>
                        <strong>
                          {record.title || `Untitled ${type.toLowerCase()}`}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <span className="aw-pill neutral">
                        {(expense ? record.category : record.source) ||
                          "Unspecified"}
                      </span>
                    </td>
                    <td>{formatDate(record.date || record.createdAt)}</td>
                    <td className="aw-finance-amount">
                      <strong>
                        {cents === null ? "—" : formatCurrency(cents / 100)}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminPayment() {
  const { expenses, revenues, loading, error, reload } = useFinance();
  const expenseTotal = totalAmount(expenses);
  const revenueTotal = totalAmount(revenues);
  const netTotal =
    expenseTotal === null || revenueTotal === null
      ? null
      : revenueTotal - expenseTotal;
  const metric = (value) =>
    loading || error || value === null ? "—" : formatCurrency(value);
  const count = (records) =>
    loading || error
      ? "All recorded activity"
      : `${records.length} recorded ${records.length === 1 ? "entry" : "entries"}`;

  const exportReport = () => {
    const rows = [
      ["Type", "Title", "Category or source", "Amount (INR)", "Date"],
      ...[
        ["Expense", expenses],
        ["Revenue", revenues],
      ].flatMap(([type, records]) =>
        records.map((record) => [
          type,
          record.title,
          type === "Expense" ? record.category : record.source,
          record.amount,
          record.date || record.createdAt,
        ]),
      ),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mystore-finance.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="aw">
      <PageHeading
        title="Expenses & revenue"
        section="Finance"
        description="Your recorded income, expenses, and net total in one place."
      >
        <Link className="aw-button" to="/admin/orders">
          View orders <Icon name="arrow" />
        </Link>
        <button
          className="aw-button"
          type="button"
          disabled={loading}
          onClick={reload}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        <button
          className="aw-button aw-button-primary"
          type="button"
          onClick={exportReport}
          disabled={
            loading || Boolean(error) || expenses.length + revenues.length === 0
          }
        >
          Export report
        </button>
      </PageHeading>
      {error && (
        <div className="aw-notice error" role="alert">
          {error}
          <button className="aw-button" type="button" onClick={reload}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && netTotal === null && (
        <div className="aw-notice" role="status">
          Some records are missing a valid amount. Their totals will appear once
          those amounts are updated.
        </div>
      )}
      <div className="aw-payment-summary">
        <Metric
          label="Total revenue"
          value={metric(revenueTotal)}
          detail={count(revenues)}
          icon="wallet"
        />
        <Metric
          label="Total expenses"
          value={metric(expenseTotal)}
          detail={count(expenses)}
          icon="order"
          tone="amber"
        />
        <Metric
          label="Net total"
          value={metric(netTotal)}
          detail="Recorded revenue minus expenses"
          icon="category"
          tone="blue"
        />
      </div>
      <div className="aw-finance-ledgers">
        <FinanceLedger
          type="Revenue"
          records={revenues}
          loading={loading}
          error={error}
        />
        <FinanceLedger
          type="Expense"
          records={expenses}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
