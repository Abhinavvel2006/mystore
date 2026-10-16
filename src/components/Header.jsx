import { useState } from "react";
import Logo from "../assets/mystore-logo.svg";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCartShopping,
  faLocationDot,
  faMagnifyingGlass,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import formatCurrency from "../currency";
import "./Header.css";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() =>
    JSON.parse(localStorage.getItem("currentUser")),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(
    () => localStorage.getItem("deliveryAddress") || "",
  );
  const navigate = useNavigate();
  const handleSearch = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    navigate(
      term ? `/products?search=${encodeURIComponent(term)}` : "/products",
    );
    setMenuOpen(false);
  };
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("deliveryAddress");
    setDeliveryAddress("");
    setCurrentUser(null);
    navigate("/");
  };
  const handleAddressChange = (event) => {
    const address = event.target.value;
    setDeliveryAddress(address);
    localStorage.setItem("deliveryAddress", address);
  };
  return (
    <header className="store-header">
      <div className="header-topline">
        Free delivery on orders over {formatCurrency(50)} <span>•</span> Easy
        7-day returns
      </div>
      <div className="header-main">
        <NavLink className="brand" to="/" aria-label="MyStore home">
          <img src={Logo} alt="MyStore" />
        </NavLink>
        <label className="delivery-location">
          <span>
            <FontAwesomeIcon icon={faLocationDot} /> Deliver to
          </span>
          <input
            type="text"
            name="deliveryAddress"
            autoComplete="street-address"
            placeholder="Enter your home address"
            aria-label="Home address for delivery"
            value={deliveryAddress}
            onChange={handleAddressChange}
          />
        </label>
        <form className="store-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search for products, brands and more"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit" aria-label="Search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </form>
        <button
          className="menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <nav className={`header-actions ${menuOpen ? "open" : ""}`}>
          <NavLink to="/products" onClick={() => setMenuOpen(false)}>
            Shop
          </NavLink>
          <NavLink
            className="cart-link"
            to="/cart"
            onClick={() => setMenuOpen(false)}
          >
            <FontAwesomeIcon icon={faCartShopping} /> <span>Cart</span>
          </NavLink>
          {currentUser ? (
            <button className="account-action" onClick={handleLogout}>
              Sign out
            </button>
          ) : (
            <NavLink
              className="account-action"
              to="/login"
              onClick={() => setMenuOpen(false)}
            >
              <FontAwesomeIcon icon={faUser} /> Sign in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
export default Header;
