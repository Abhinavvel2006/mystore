import "./admin_payment.css";

function AdminPayment() {
    const paymentMethods = [
        { name: "Cash on Delivery", type: "Popular", status: "Active" },
        { name: "Credit Card", type: "Secure", status: "Active" },
        { name: "Bank Transfer", type: "Manual", status: "Paused" },
    ];

    const expenses = [
        { title: "Server Hosting", amount: "$180", date: "Jan 10" },
        { title: "Marketing", amount: "$320", date: "Jan 12" },
        { title: "Supplier Payment", amount: "$1,250", date: "Jan 15" },
    ];

    return (
        <div className="admin-payment-container">
            <div className="admin-payment-header">
                <div>
                    <h2>Payment Management</h2>
                    <p>Monitor payment options, available credit, and monthly expenses in one place.</p>
                </div>
                <button type="button" className="admin-payment-btn">+ Add Method</button>
            </div>

            <div className="admin-payment-summary">
                <div className="admin-payment-card highlight">
                    <span>Credit Balance</span>
                    <h3>$24,500</h3>
                    <p>+8.2% from last month</p>
                </div>
                <div className="admin-payment-card">
                    <span>Pending Payments</span>
                    <h3>12</h3>
                    <p>Needs review</p>
                </div>
                <div className="admin-payment-card">
                    <span>Monthly Expense</span>
                    <h3>$1,750</h3>
                    <p>Tracked this month</p>
                </div>
            </div>

            <div className="admin-payment-grid">
                <section className="admin-payment-panel">
                    <div className="admin-payment-panel-header">
                        <h3>Payment Methods</h3>
                        <button type="button">Manage</button>
                    </div>

                    <div className="payment-method-list">
                        {paymentMethods.map((method) => (
                            <div key={method.name} className="payment-method-item">
                                <div>
                                    <h4>{method.name}</h4>
                                    <p>{method.type}</p>
                                </div>
                                <span className={`payment-method-status ${method.status.toLowerCase()}`}>
                                    {method.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="admin-payment-panel">
                    <div className="admin-payment-panel-header">
                        <h3>Credit Overview</h3>
                        <button type="button">View</button>
                    </div>

                    <div className="credit-overview">
                        <div className="credit-box">
                            <h4>Available Credit</h4>
                            <p>$18,400</p>
                        </div>
                        <div className="credit-box">
                            <h4>Used Credit</h4>
                            <p>$6,100</p>
                        </div>
                        <div className="credit-box full">
                            <h4>Next Refill</h4>
                            <p>March 01, 2026</p>
                        </div>
                    </div>
                </section>
            </div>

            <section className="admin-payment-panel expenses-panel">
                <div className="admin-payment-panel-header">
                    <h3>Monthly Expenses</h3>
                    <button type="button">Export</button>
                </div>

                <table className="expenses-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((expense) => (
                            <tr key={expense.title}>
                                <td>{expense.title}</td>
                                <td>{expense.amount}</td>
                                <td>{expense.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

export default AdminPayment;