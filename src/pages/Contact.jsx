import { useState } from "react";
import "./Contact.css";

function Contact() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
    };

    return (
        <section className="contact-page">
            <div className="contact-container">
                <div className="contact-header">
                    <h1>Contact Us</h1>
                    <p>We are here to help. Send us your message anytime.</p>
                </div>

                <div className="contact-info">
                    <div className="info-box">
                        <h3>Email</h3>
                        <p>support@mystore.com</p>
                    </div>
                    <div className="info-box">
                        <h3>Phone</h3>
                        <p>+91 12345 67890</p>
                    </div>
                    <div className="info-box">
                        <h3>Address</h3>
                        <p>123 Road, Silicon Valley, CA 94000</p>
                    </div>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <h2>Send a Message</h2>

                    <label htmlFor="contact-name">Full Name</label>
                    <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleChange}
                    />

                    <label htmlFor="contact-email">Email</label>
                    <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <label htmlFor="contact-subject">Subject</label>
                    <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        placeholder="Enter subject"
                        value={formData.subject}
                        onChange={handleChange}
                    />

                    <label htmlFor="contact-message">Message</label>
                    <textarea
                        id="contact-message"
                        name="message"
                        rows="5"
                        placeholder="Write your message"
                        value={formData.message}
                        onChange={handleChange}
                    />

                    <button type="submit" className="contact-btn">
                        Send Message
                    </button>
                </form>
            </div>
        </section>
    );
}

export default Contact;
