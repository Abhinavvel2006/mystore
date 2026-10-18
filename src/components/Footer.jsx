import { NavLink } from "react-router-dom";
import Logo from "../assets/mystore-logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faHeadset,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import "./Footer.css";
function Footer() {
  return (
    <footer className="store-footer">
      <div className="footer-grid">
        <section className="footer-brand">
          <img src={Logo} alt="MyStore" />
          <p>Everyday finds, thoughtfully selected and delivered with care.</p>
        </section>
        <section>
          <h3>Explore</h3>
          <NavLink to="/Home">Home</NavLink>
          <NavLink to="/products">Shop all</NavLink>
          <NavLink to="/about">About us</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </section>
        <section>
          <h3>Customer care</h3>
          <NavLink to="/cart">Your cart</NavLink>
          <a href="mailto:info@mystore.com">
            <FontAwesomeIcon icon={faEnvelope} /> info@mystore.com
          </a>
          <a href="tel:+1234567890">
            <FontAwesomeIcon icon={faHeadset} /> +1 (234) 567-890
          </a>
        </section>
        <section>
          <h3>Visit us</h3>
          <p>
            <FontAwesomeIcon icon={faLocationDot} /> Shopping made simple,
            wherever you are.
          </p>
          <p className="footer-note">
            Secure checkout · Fast support · Easy returns
          </p>
        </section>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MyStore</span>
        <span>Made for better everyday shopping</span>
      </div>
    </footer>
  );
}
export default Footer;
