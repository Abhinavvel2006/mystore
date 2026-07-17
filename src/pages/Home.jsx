import { NavLink } from "react-router-dom";
import background from "../assets/home.jpg";
import product1 from "../assets/product1.jpg";
import product2 from "../assets/product2.jpg";
import product3 from "../assets/product3.jpg";
import product4 from "../assets/product4.jpg";
import product5 from "../assets/product5.jpg";
import product6 from "../assets/product6.jpg";
import category1 from "../assets/category1.jpg";
import category2 from "../assets/category2.jpg";
import category3 from "../assets/category3.jpg";
import "./Home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect,useState } from "react";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";


function Home(){
    const [message,setMessage] = useState("");
    const { addToCart } = useContext(CartContext);
    useEffect(() =>{
        fetch("http://localhost:5000/api/message")
        .then((res) => res.json())
        .then((data) => setMessage(data.message))
        .catch((err) => console.log(err));
    }, []);
    return(
        <>
        <div className="home" style={{ backgroundImage: `url(${background})` }}>
            <div className="home-content">
                <h2>Discover Amazing</h2>
                <h3>Products!</h3>
                <div className="home-items">
                    <p>Explore our wide range of products and find the perfect items for you. From electronics to fashion, we have everything you need to enhance your lifestyle.</p>
                </div>
                <button className="shop-now-btn"><NavLink to="/products">Shop Now</NavLink></button>
                <div className="home-offer">
                    <div className="offers-card1">
                        <FontAwesomeIcon></FontAwesomeIcon>
                        <h6>Secure payment</h6>
                        <p>100% secure</p>
                    </div>
                    <div className="offers-card2">
                        <FontAwesomeIcon></FontAwesomeIcon>
                        <h6>Fast delivery</h6>
                        <p>on time delivery</p>
                    </div>
                    <div className="offers-card3">
                        <FontAwesomeIcon></FontAwesomeIcon>
                        <h6>Best Quality</h6>
                        <p>Premium Quality</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="home-about-us">
            <h2>Personalized Recommendations Just for You!</h2>
            <p>Our AI-powered recommendation engine analyzes your browsing and purchase history to suggest products that match your preferences. Discover new items you'll love with our personalized recommendations.</p>
            <div className="categories">
                <div className="category-card">
                    <img src={category1} alt="category1"></img>
                    <div className="card-body">
                    <h3 className="product-title">Electronics</h3>
                    <div className="card-actions">
                    <button className="visit-btn"><NavLink to="/products">Visit Product</NavLink></button>
                    </div>
                    </div>
                </div>
                <div className="category-card">
                    <img src={category2} alt="category2"></img>
                    <div className="card-body">
                    <h3 className="product-title">Fashion</h3>
                    <div className="card-actions">
                    <button className="visit-btn"><NavLink to="/products">Visit Product</NavLink></button>
                    </div>
                    </div>
                </div>
                <div className="category-card">
                    <img src={category3} alt="category3"></img>
                    <div className="card-body">
                    <h3 className="product-title">Home & Living</h3>
                    <div className="card-actions">
                    <button className="visit-btn"><NavLink to="/products">Visit Product</NavLink></button>
                    </div>
                    </div>
                </div>
                <div className="category-card">
                    <img src={product3} alt="category4"></img>
                    <div className="card-body">
                    <h3 className="product-title">Mobiles</h3>
                    <div className="card-actions">
                    <button className="visit-btn"><NavLink to="/products">Visit Product</NavLink></button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="products-preview">
            <h2>Featured Products</h2>
            <div className="slider-wrapper">
                <div className="product-list">
                    <div className="card1">
                        <img src={product1} alt="product1"></img>
                        <h3>Nike Footwear</h3>
                    <p>$2.99</p>
                    <button className="order-btn"
                    onClick={() => 
                        addToCart({
                            id: 1,
                            name: "Nike Footwear",
                            price: 2.99, 
                            image: product1
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className="card2">
                    <img src={product2} alt="product2"></img>
                    <h3>Casio Watch</h3>
                    <p>$29.99</p>
                    <button className="order-btn" 
                    onClick={() => 
                        addToCart({
                            id: 2,
                            name: "Casio Watch",
                            price: 29.99,
                            image: product2
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className ="card3">
                    <img src={product3} alt="product3"></img>
                    <h3>Apple iPhone</h3>
                    <p>$999.99</p>
                    <button className="order-btn" 
                    onClick={() => 
                        addToCart({
                            id: 3,
                            name: "Apple iphone",
                            price: 999.99,
                            image: product3
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className="card4">
                    <img src={product4} alt="product4"></img>
                    <h3>Samsung TV</h3>
                    <p>$499.99</p>
                    <button className="order-btn"
                    onClick={() => 
                        addToCart({
                            id: 4,
                            name: "Samsung TV",
                            price: 499.99,
                            image: product4
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className="card5">
                    <img src={product5} alt="product5"></img>
                    <h3>Adidas Sneakers</h3>
                    <p>$79.99</p>
                    <button className="order-btn"
                    onClick={() =>
                        addToCart({
                            id: 5,
                            name: "Adidas Sneakers",
                            price: 79.99,
                            image: product5
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className="card6">
                    <img src={product6} alt="product6"></img>
                    <h3>Sony Headphones</h3>
                    <p>$199.99</p>
                    <button className="order-btn"
                    onClick={() =>
                        addToCart({
                            id: 6,
                            name: "Sony HeadPhones",
                            price: 199.99,
                            image: product6
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                {/* <duplicate> */}
                <div className="card1">
                    <img src={product1} alt="product1"></img>
                    <h3>Nike Footwear</h3>
                    <p>$2.99</p>
                    <button className="order-btn"
                    onClick={() =>
                        addToCart({
                            id: 1,
                            name: "Nike Footwear",
                            price: 2.99,
                            image: product1
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className="card2">
                    <img src={product2} alt="product2"></img>
                    <h3>Casio Watch</h3>
                    <p>$29.99</p>
                    <button className="order-btn"
                    onClick={() =>
                        addToCart({
                            id: 2,
                            name: "Casio Watch",
                            price: 29.99,
                            image: product2
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className ="card3">
                    <img src={product3} alt="product3"></img>
                    <h3>Apple iPhone</h3>
                    <p>$999.99</p>
                    <button className="order-btn"
                    onClick={() =>
                        addToCart({
                            id: 3,
                            name: "Apple iPhone",
                            price: 999.99,
                            image: product3
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className="card4">
                    <img src={product4} alt="product4"></img>
                    <h3>Samsung TV</h3>
                    <p>$499.99</p>
                    <button className="order-btn"
                    onClick={() =>
                        addToCart({
                            id: 4,
                            name: "Samsung TV",
                            price: 499.99,
                            image: product4
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className="card5">
                    <img src={product5} alt="product5"></img>
                    <h3>Adidas Sneakers</h3>
                    <p>$79.99</p>
                    <button className="order-btn"
                    onClick={() =>
                        addToCart({
                            id: 5,
                            name: "Adidas Sneakers",
                            price: 79.99,
                            image: product5
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
                <div className="card6">
                    <img src={product6} alt="product6"></img>
                    <h3>Sony Headphones</h3>
                    <p>$199.99</p>
                    <button className="order-btn"
                    onClick={() =>
                        addToCart({
                            id: 6,
                            name: "Sony Headphones",
                            price: 199.99,
                            image: product6
                        })
                    }
                    >
                    Order Now
                    </button>
                </div>
            </div>
        </div>
    </div>
    </>
    );
}

export default Home;
