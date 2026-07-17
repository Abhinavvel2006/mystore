import { useState } from "react";
import Logo from "../assets/mystore-logo.svg";
import {NavLink} from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faMagnifyingGlass, faBars } from "@fortawesome/free-solid-svg-icons";
import "./Header.css"

function Header(){
    const [menuOpen, setMenuOpen] = useState(false);

    return(
        <header className="header">
            <img src={Logo} alt="logo"></img>
            <div className="search-box">
                <input type="text" placeholder="Search products..."/>
                <button>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
            </div>
            <button
                className="menu-toggle"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((prev) => !prev)}
            >
                <FontAwesomeIcon icon={faBars} />
            </button>
            <nav className={`Headernv ${menuOpen ? "open" : ""}`}>
                <ul className="nav-link">
                    <li>
                        <NavLink to="/">Home</NavLink>
                    </li>
                    <li>
                        <NavLink to="/About">About</NavLink>
                    </li>
                    <li>
                        <NavLink to="/Products">Products</NavLink>
                    </li>
                    <li>
                        <NavLink to="/Contact">Contact</NavLink>
                    </li>
                    <li>
                        <NavLink to="/cart"><FontAwesomeIcon icon={faCartShopping} /></NavLink>
                    </li>
                </ul>
                <NavLink to="/Login">
                    <button className="login-btn">Login</button>
                </NavLink>
            </nav>
        </header>
    );
}

export default Header;
