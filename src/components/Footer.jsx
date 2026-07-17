import { NavLink } from "react-router-dom";
import Logo from "../assets/mystore-logo.svg";
import brand from "../assets/logo.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faFacebook, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import "./Footer.css";
import Product from "../pages/Product"

function Footer(){
    return(
        <footer className="footer">
        <img src={Logo} alt="logo" />

        <div className="footernav">
            <ul className="footernav-link">
                <li><NavLink to="/">Home</NavLink></li>
                <li><NavLink to="/products">Product</NavLink></li>
                <li><NavLink to="/contact">Contact</NavLink></li>
                <li><NavLink to="/cart"><FontAwesomeIcon icon={faCartShopping} /></NavLink></li>
            </ul>

            <p>Email: <NavLink to="mailto:info@mystore.com">info@mystore.com</NavLink></p>
            <p>Contact: +1 (234) 567-890</p>

            <div className="social-icons">
                <NavLink to="https://instagram.com" target="_blank">
                    <FontAwesomeIcon icon={faInstagram} />
                </NavLink>
                <NavLink to="https://facebook.com" target="_blank">
                    <FontAwesomeIcon icon={faFacebook} />
                </NavLink>
                <NavLink to="https://linkedin.com" target="_blank">
                    <FontAwesomeIcon icon={faLinkedin} />
                </NavLink>
            </div>

            <p className="copyright">
            © 2025 MyStore. All rights reserved.
            </p>
         </div>
        </footer>
    );
}

export default Footer;