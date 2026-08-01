import { useState, useEffect } from "react";
import Logo from "../assets/mystore-logo.svg";
import { NavLink, useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faMagnifyingGlass, faBars } from "@fortawesome/free-solid-svg-icons";
import "./Header.css"

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        setCurrentUser(user);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("currentUser");
        setCurrentUser(null);
        window.location.href = "/";
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const term = searchTerm.trim();

        if (!term) {
            navigate("/products");
            return;
        }

        navigate(`/products?search=${encodeURIComponent(term)}`);
    };

    return (
        <header className="header">
            <img src={Logo} alt="logo"></img>
            <form className="search-box" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
            </form>
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
                {
                    currentUser ? (
                        <div className="user-info">

                            <span className="user-email">
                                {currentUser.email}
                            </span>

                            <button
                                className="login-btn"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </div>
                    ) : (
                        <NavLink to="/Login">
                            <button className="login-btn">
                                Login
                            </button>
                        </NavLink>
                    )
                }
            </nav>
        </header>
    );
}

export default Header;
