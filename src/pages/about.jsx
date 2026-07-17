import { NavLink } from "react-router-dom";
import about1 from "../assets/about_image2.jpg";
import team from "../assets/about_team.jpg";
import employee1 from "../assets/about_profile1.jpg";
import employee2 from "../assets/about_profile2.jpg";
import employee3 from "../assets/about_profile3.jpg";
import "./about.css";

function About() {
    return(
        <>
        <div className="about-container">
            <div className="about-us">
                <h1>About Us</h1>
                <p>Welcome to MyStore, your trusted destination for quality products at affordable prices. We are committed to providing a seamless online shopping experience with a wide selection of products, secure payments, and reliable delivery. Our goal is to make shopping simple, convenient, and enjoyable for every customer. </p>
                <button className="explore-btn">Explore Products</button>
            </div>
            <div className="about-story">
                <h2>Our Story</h2>
                <p>MyStore was created with the vision of making online shopping easy and accessible for everyone. We believe customers deserve high-quality products, transparent pricing, and exceptional service.From electronics and fashion to everyday essentials, we carefully select products that meet customer expectations. As our platform continues to grow, we remain committed to delivering value, trust, and satisfaction with every purchase.</p>
            </div>
            <div className="about-choose">
                <h2>Why Choose Us?</h2>
                <ul className="choose-list">
                    <li>
                        <h4>Quality Products</h4>
                        <p>We offer a carefully selected collection of products from trusted brands to ensure excellent quality.</p>
                    </li>
                    <li>
                        <h4>Fast Delivery</h4>
                        <p>Our efficient delivery process ensures your orders arrive safely and on time.</p>                        
                    </li>
                    <li>
                        <h4>Secure Payments</h4>
                        <p>Shop confidently with secure payment methods that protect your personal and financial information.</p>
                    </li>
                    <li>
                        <h4>Customer Support</h4>
                        <p>Our friendly support team is always available to assist you with any questions or concerns.</p>
                    </li>
                </ul>
            </div>
            <div className="about-mv">
                <div className="mission">
                    <h2>Our Mission</h2>
                    <p>Our mission is to provide customers with quality products, affordable prices, and a secure online shopping experience while delivering outstanding customer service.</p>
                </div>
                <div className="vision">
                    <h2>Our Vision</h2>
                    <p>Our vision is to become one of the most trusted and customer-focused eCommerce platforms by continuously improving our services and embracing innovation.</p>
                </div>
            </div>
            <div className="about-statistics">
                <img src={about1} alt="Statistics" />
                <h2>Our Statistics</h2>
                <p>We help you to unleash the power within your business.</p>
                <div className="statistics-cards">
                    <div className="card">
                        <h3>260+</h3>
                        <p>Active Employees</p>
                    </div>
                    <div className="card">
                        <h3>10000+</h3>
                        <p>Products</p>
                    </div>
                    <div className="card">
                        <h3>2500+</h3>
                        <p>Happy Customers</p>
                    </div>
                    <div className="card">
                        <h3>5000+</h3>
                        <p>Orders Delivered</p>
                    </div>
                </div>
            </div>
            <div className="about-team">
                <img src={team} alt="Team" />
                <h2>Meet Our Team</h2>
                <p>Our dedicated team works together to ensure every customer enjoys a smooth and reliable shopping experience. From managing products to processing orders and providing customer support, we are committed to delivering excellence every day.</p>
                <div className="team-members">
                    <h2>Team Members</h2>
                    <ul className="team-list">
                        <li>
                            <img src={employee1} alt="Employee 1" />
                            <h4>Alex John</h4>
                            <p>Fouder & CEO</p>
                        </li>
                        <li>
                            <img src={employee2} alt="Employee 2" />
                            <h4>Sarah Lee</h4>
                            <p>Co-Founder & Manager</p>
                        </li>
                        <li>
                            <img src={employee3} alt="Employee 3" />
                            <h4>David Joy</h4>
                            <p>Marketing Director & Product Manager</p>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="about-thankyou">
                <h2>Thank You for Choosing MyStore!</h2>
                <p>We appreciate your trust and support. Our team is dedicated to providing you with the best shopping experience possible. We look forward to serving you and helping you find the products you love.</p>
            </div>
        </div>
        </>
    )
}
export default About;