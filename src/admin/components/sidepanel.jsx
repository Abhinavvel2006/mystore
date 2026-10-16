import Logo from "../assets/images/mystore-logo.svg";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faChartPie,
  faCreditCard,
  faGear,
  faLayerGroup,
  faRightFromBracket,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import "./sidepanel.css";

function Sidepanel() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="sidepanel-container">
      <div className="sidepanel-header">
        <img src={Logo} alt="logo" />
        <h6>ADMIN PANEL</h6>
      </div>
      <div className="sidepanel-navigation">
        <nav className="sidepanelnav">
          <ul className="sidepanel-lists">
            <li>
              <NavLink to="/admin/dashboard">
                <FontAwesomeIcon icon={faChartPie} /> Dashboard
              </NavLink>
            </li>
            <h6>MANAGEMENT</h6>
            <li>
              <NavLink to="/admin/Products">
                <FontAwesomeIcon icon={faBoxOpen} /> Products
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/orders">
                <FontAwesomeIcon icon={faReceipt} /> Orders
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/Categories">
                <FontAwesomeIcon icon={faLayerGroup} /> Categories
              </NavLink>
            </li>
            <h6>SETTINGS</h6>
            <li>
              <NavLink to="/admin/Payment">
                <FontAwesomeIcon icon={faCreditCard} /> Expenses & revenue
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/Settings">
                <FontAwesomeIcon icon={faGear} /> Settings
              </NavLink>
            </li>
            <li className="sidepanel-logout">
              <button
                type="button"
                className="sidepanel-logout-btn"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faRightFromBracket} /> Sign out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Sidepanel;
