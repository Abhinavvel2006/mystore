import { BrowserRouter, Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/Home";
import About from "./pages/About";
import Product from "./pages/Product";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";

import AdminLogin from "./admin/pages/Login";
import Dashboard from "./admin/pages/Dashboard";
import AdminProduct from "./admin/pages/admin_product";
import AdminOrder from "./admin/pages/admin_order";
import AdminCategories from "./admin/pages/admin_categories";
import AdminPayment from "./admin/pages/admin_payment";
import AdminSettings from "./admin/pages/admin_settings";

import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>

        <Routes>

          {/* User Website */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* User Login */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Login */}
          <Route path="/admin/" element={<AdminLogin />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<AdminProduct />} />
            <Route path="orders" element={<AdminOrder />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="payment" element={<AdminPayment />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

        </Routes>

      </BrowserRouter>
    </CartProvider>
  );
}

export default App;