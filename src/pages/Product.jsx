import { NavLink } from "react-router-dom";
import product1 from "../assets/product1.jpg";
import product5 from "../assets/product5.jpg";
import crock from "../assets/crook.jpg";
import puma from "../assets/puma.jpg";
import electonics1 from "../assets/product6.jpg";
import electronics2 from "../assets/electronics2.jpg";
import electronics3 from "../assets/electronics3.jpg";
import electronics4 from "../assets/electronics4.jpg";
import clothing1 from "../assets/clothing1.jpg";
import clothing2 from "../assets/clothing2.jpg";
import clothing3 from "../assets/clothing3.jpg";
import clothing4 from "../assets/clothing4.jpg";
import home1 from "../assets/home1.jpg"; 
import home2 from "../assets/home2.jpg";
import home3 from "../assets/home3.jpg";
import home4 from "../assets/home4.jpg";
import mobile1 from "../assets/product3.jpg";
import mobile2 from "../assets/mobile2.jpg";
import mobile3 from "../assets/mobile3.jpg";
import mobile4 from "../assets/mobile4.jpg";
import pc1 from "../assets/pc1.jpg";
import pc2 from "../assets/pc2.jpg";
import pc3 from "../assets/pc3.jpg";
import pc4 from "../assets/pc4.jpg";
import accessory1 from "../assets/monitor.jpg";
import accessory2 from "../assets/keyboard.jpg";
import accessory3 from "../assets/mouse.jpg";
import accessory4 from "../assets/webcam.jpg";
import furniture1 from "../assets/furniture1.jpg";
import furniture2 from "../assets/furniture2.jpg";
import furniture3 from "../assets/furniture3.jpg";
import furniture4 from "../assets/furniture4.jpg";
import "./Product.css";
import { useEffect , useState , useContext } from "react";
import { CartContext } from "../context/CartContext";

function Product(){
    const { addToCart } = useContext(CartContext);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/products');
                const data = await res.json();
                setProducts(data || []);
            } catch (err) {
                console.error('Load products', err);
            }
        };
        load();
    }, []);
    return(
        <>
        <div className="product-page">
            <h2>Product</h2>
            <nav className="category-nav" aria-label="Product Categories">
                <a href="#footwear">Footwear</a>
                <a href="#Electronics">Electronics</a>
                <a href="#Clothing">Clothing</a>
                <a href="#Home">Home & Living</a>
                <a href="#Mobile">Mobiles</a>
                <a href="#PCs">PCs</a>
                <a href="#accessories">Accessories</a>
                <a href="#furnitures">Furnitures</a>
            </nav>
            {products.length > 0 && (
                <div className="products-list dynamic">
                    <h3>Products from backend</h3>
                    <div className="product-grid">
                        {products.map((p) => (
                            <div key={p._id || p.id} className="product-card-item">
                                {p.image ? <img src={p.image} alt={p.name} /> : <div className="thumb">{p.name.charAt(0)}</div>}
                                <h4 className="product-title">{p.name}</h4>
                                <div className="price">${Number(p.price).toFixed(2)}</div>
                                <div className="card-actions">
                                    <button className="order-btn" onClick={() => addToCart({ id: p._id || p.id, name: p.name, price: p.price, image: p.image })}>Buy Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="products-list">
                <div className="product-card" id="footwear">
                    <h3>Footwear</h3>
                    <div className="footwear-item">
                        <div className="f1">
                            <img src={product1} alt="Nike Footwear"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Nike Footwear</h4>
                                    <div className="price">$2.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn" 
                                        onClick={() =>
                                            addToCart({
                                                id: 1,
                                                name: "Nike Footwear",
                                                price: 2.32,
                                                image: product1
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="f2">
                            <img src={product5} alt="Adidas Footwear"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Adidas Footwear</h4>
                                    <div className="price">$1.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() =>
                                            addToCart({
                                                id: 2,
                                                name: "Adidas Footwear",
                                                price: 1.99,
                                                image: product5
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="f3">
                            <img src={crock} alt="crock footwear"></img>
                                <div className="card-body">
                                    <h4 className="product-title">crock Footwear</h4>
                                    <div className="price">$3.12</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() =>
                                            addToCart({
                                                id: 3,
                                                name: "crock Footwear",
                                                price: 3.12,
                                                image: crock
                                            })
                                        }>
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="f4">
                            <img src={puma} alt="Puma Footwear"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Puma Footwear</h4>
                                    <div className="price">$2.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() =>
                                            addToCart({
                                                id: 4,
                                                name: "Puma Footwear",
                                                price: 2.99,
                                                image: puma
                                            })
                                        }>
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                    <div className="product-card" id="Electronics">
                         <div className="E1">
                            <img src={electonics1} alt="Wireless Headphone"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Wireless Headphone</h4>
                                    <div className="price">$12.42</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() =>
                                            addToCart({
                                                id: 5,
                                                name: "Wireless Headphone",
                                                price: 12.42,
                                                image: electronics1
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="E2">
                            <img src={electronics2} alt="Speaker"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Bluetooth Speaker</h4>
                                    <div className="price">$32.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() =>
                                            addToCart({
                                                id: 6,
                                                name: "Bluetooth Speaker",
                                                price: 32.32,
                                                image: electronics2 
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="E3">
                            <img src={electronics3} alt="Smart watches"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Smart watch</h4>
                                    <div className="price">$21.44</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 7,
                                                name: "Smart watch",
                                                price: 21.44,
                                                image: electronics3
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="E4">
                            <img src={electronics4} alt="Charger"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Portable Charger</h4>
                                    <div className="price">$11.02</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 8,
                                                name: "Portable Charger",
                                                price: 11.02,
                                                image: electronics4
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                    <div className="Product-card" id="Clothing">
                        <div className="c1">
                            <img src={clothing1} alt="Clothing"></img>
                                <div className="card-body">
                                    <h4 className="product-title">T-shirts</h4>
                                    <div className="price">$10.23</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() =>
                                            addToCart({
                                                id: 9,
                                                name: "T-shirts",
                                                price: 10.23,
                                                image: cloting1
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="c2">
                            <img src={clothing2} alt="Clothing"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Jeans</h4>
                                    <div className="price">$25.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() =>
                                            addToCart({
                                                id: 10,
                                                name: "Jeans",
                                                price: 25.99,
                                                image: clothing2
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="c3">
                            <img src={clothing3} alt="Clothing"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Dresses</h4>
                                    <div className="price">$2.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 11,
                                                name: "Dresses",
                                                price: 2.32,
                                                image: clothing3
                                            })
                                        }
                                        
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="c4">
                            <img src={clothing4} alt="Clothing"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Shirts</h4>
                                    <div className="price">$2.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 12,
                                                name: "Shirts",
                                                price: 2.32,
                                                image: clothing4
                                            })
                                        }
                                        
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                    <div className="product-card" id="Home">
                         <div className="h1">
                            <img src={home1} alt="Home"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Floor lamp</h4>
                                    <div className="price">$2.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 13,
                                                name: "Floor lamp",
                                                price: 2.32,
                                                image: home1
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="h2">
                            <img src={home2} alt="Home"></img>
                                <div className="card-body">
                                    <h4 className="product-title">table vase</h4>
                                    <div className="price">$5.43</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 14,
                                                name: "table vase",
                                                price: 5.43,
                                                image: home2
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="h3">
                            <img src={home3} alt="Home"></img>
                                <div className="card-body">
                                    <h4 className="product-title">wall shelf</h4>
                                    <div className="price">$7.89</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 15,
                                                name: "wall shelf",
                                                price: 7.89,
                                                image: home3
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                         <div className="h4">
                            <img src={home4} alt="Home"></img>
                                <div className="card-body">
                                    <h4 className="product-title">cozy cushion</h4>
                                    <div className="price">$12.50</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 16,
                                                name: "cozy cushion",
                                                price: 12.50,
                                                image: home4
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                    <div className="product-card" id="Mobile">
                        <div className="m1">
                            <img src={mobile1} alt="mobile"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Iphone 15</h4>
                                    <div className="price">$999.23</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 17,
                                                name: "Iphone 15",
                                                price: 999.23,
                                                image: mobile1
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="m2">
                            <img src={mobile2} alt="mobile"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Samsung Galaxy S23</h4>
                                    <div className="price">$899.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 18,
                                                name: "Samsung Galaxy S23",
                                                price: 899.99,
                                                image: mobile2
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="m3">
                            <img src={mobile3} alt="mobile"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Onplus 12</h4>
                                    <div className="price">$279.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 19,
                                                name: "Onplus 12",
                                                price: 279.32,
                                                image: mobile3
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="m4">
                            <img src={mobile4} alt="mobile"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Google Pixel 8</h4>
                                    <div className="price">$972.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 20,
                                                name: "Google Pixel 8",
                                                price: 972.32,
                                                image: mobile4
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                    <div className="product-card" id="PCs">
                        <div className="P1">
                            <img src={pc1} alt="PC"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Intel Core i7 Desktop Pc</h4>
                                    <div className="price">$999.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 21,
                                                name: "Intel Core i7 Desktop Pc",
                                                price: 999.32,
                                                image: pc1
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="P2">
                            <img src={pc2} alt="PC"></img>
                                <div className="card-body">
                                    <h4 className="product-title">AMD Ryzen 9 Desktop Pc</h4>
                                    <div className="price">$1299.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 22,
                                                name: "AMD Ryzen 9 Desktop Pc",
                                                price: 1299.32,
                                                image: pc2
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="P3">
                            <img src={pc3} alt="PC"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Dell Inspiron Laptop</h4>
                                    <div className="price">$799.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 23,
                                                name: "Dell Inspiron Laptop",
                                                price: 799.32,
                                                image: pc3
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="P4">
                            <img src={pc4} alt="PC"></img>
                                <div className="card-body">
                                    <h4 className="product-title">HP Pavilion Laptop</h4>
                                    <div className="price">$972.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 24,
                                                name: "HP Pavilion Laptop",
                                                price: 972.32,
                                                image: pc4
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                    <div className="product-card" id="accessories">
                        <div className="a1">
                            <img src={accessory1} alt="Accessory"></img>
                                <div className="card-body">
                                    <h4 className="product-title">24 inch Monitor</h4>
                                    <div className="price">$599.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 25,
                                                name: "24 inch Monitor",
                                                price: 599.32,
                                                image: accessory1
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="a2">
                            <img src={accessory2} alt="Accessory"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Mechanical Keyboard</h4>
                                    <div className="price">$39.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 26,
                                                name: "Mechanical Keyboard",
                                                price: 39.99,
                                                image: accessory2
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="a3">
                            <img src={accessory3} alt="Accessory"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Wireless Mouse</h4>
                                    <div className="price">$19.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 27,
                                                name: "Wireless Mouse",
                                                price: 19.99,
                                                image: accessory3
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="a4">
                            <img src={accessory4} alt="Accessory"></img>
                                <div className="card-body">
                                    <h4 className="product-title">webcam</h4>
                                    <div className="price">$29.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 28,
                                                name: "webcam",
                                                price: 29.99,
                                                image: accessory4
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                    <div className="product-card" id="furnitures">
                        <div className="f1">
                            <img src={furniture1} alt="Furniture"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Wooden Furniture</h4>
                                    <div className="price">$68.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 29,
                                                name: "Wooden Furniture",
                                                price: 68.32,
                                                image: furniture1
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="f2">
                            <img src={furniture2} alt="Furniture"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Modern Chair</h4>
                                    <div className="price">$45.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 30,
                                                name: "Modern Chair",
                                                price: 45.99,
                                                image: furniture2
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="f3">
                            <img src={furniture3} alt="Furniture"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Glass Table</h4>
                                    <div className="price">$2.32</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 31,
                                                name: "Glass Table",
                                                price: 2.32,
                                                image: furniture3
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                        <div className="f4">
                            <img src={furniture4} alt="Furniture"></img>
                                <div className="card-body">
                                    <h4 className="product-title">Modern Sofa</h4>
                                    <div className="price">$199.99</div>
                                    <div className="card-actions">
                                        <button className="order-btn"
                                        onClick={() => 
                                            addToCart({
                                                id: 32,
                                                name: "Modern Sofa",
                                                price: 199.99,
                                                image: furniture4
                                            })
                                        }
                                        >
                                        Buy Now
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default Product;