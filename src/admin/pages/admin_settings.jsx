import React, {useState} from "react";
import {NavLink} from "react-router-dom";
import "./admin_settings.css";

function AdminSettings() {
	const [credit, setCredit] = useState("");
	const [balance, setBalance] = useState(1000);
	const [dark, setDark] = useState(false);
	const [stocks, setStocks] = useState([
		{id: 1, name: "Product A", qty: 12},
		{id: 2, name: "Product B", qty: 5},
		{id: 3, name: "Product C", qty: 0},
	]);

	const addCredit = () => {
		const amt = parseFloat(credit);
		if (!isNaN(amt) && amt > 0) {
			setBalance((p) => p + amt);
			setCredit("");
			alert(`Credited $${amt.toFixed(2)} to account`);
		} else {
			alert("Enter a valid amount");
		}
	};

	const quickSet = (amt) => setCredit(String(amt));

	const toggleTheme = () => {
		setDark((d) => !d);
		document.documentElement.classList.toggle("dark-theme");
	};

	const updateStock = (id, delta) => {
		setStocks((prev) =>
			prev.map((p) => (p.id === id ? {...p, qty: Math.max(0, p.qty + delta)} : p))
		);
	};

	return (
		<div className="admin-settings">
			<h2>Admin Settings</h2>

			<div className="admin-settings-grid">
				<aside className="panel profile-panel">
					<div className="avatar">AD</div>
					<div className="profile-info">
						<h3>Admin</h3>
					</div>

					<div className="panel-block">
						<div className="label">Current Balance</div>
						<div className="balance big">${balance.toFixed(2)}</div>
					</div>

					<div className="panel-block pinned-section">
						<div className="section-title">Pinned Section</div>
						<div className="toggle-row">
							<span className="toggle-label">{dark ? "Dark mode on" : "Dark mode off"}</span>
							<button type="button" className={`toggle-btn ${dark ? "active" : ""}`} onClick={toggleTheme}>
								{dark ? "On" : "Off"}
							</button>
						</div>
					</div>
				</aside>

				<main className="settings-panel main-panel">
					<section className="settings-card account-card">
						<h3>Account Credits</h3>
						<p className="section-desc">Add funds to the admin account quickly.</p>
						<div className="credit-row">
							<input
								type="number"
								value={credit}
								onChange={(e) => setCredit(e.target.value)}
								placeholder="Enter amount"
							/>
							<button onClick={addCredit} className="primary">Add</button>
						</div>
						<div className="help-row">
							<NavLink to="/admin/order" className="link">Credit from Orders</NavLink>
						</div>
					</section>

					<section className="settings-stocks-card stocks-card">
						<h3>Inventory Status</h3>
						<p className="section-desc">Adjust the available stock for each item.</p>
						<ul className="stocks-list">
							{stocks.map((p) => (
								<li key={p.id} className="stock-item">
									<div className="stock-left">
										<div className="stock-name">{p.name}</div>
										<div className="muted">SKU: #{p.id}</div>
									</div>
									<div className="stock-controls">
										<button onClick={() => updateStock(p.id, -1)} className="small">-</button>
										<span className="qty">{p.qty}</span>
										<button onClick={() => updateStock(p.id, 1)} className="small">+</button>
									</div>
								</li>
							))}
						</ul>
					</section>
				</main>
			</div>
		</div>
	);
}

export default AdminSettings;