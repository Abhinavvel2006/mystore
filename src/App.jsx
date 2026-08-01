import { BrowserRouter, Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/Home";
import About from "./pages/about";
import Product from "./pages/Product";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";

import AdminLogin from "./admin/pages/login";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";
import Dashboard from "./admin/pages/dashboard";
import AdminProduct from "./admin/pages/admin_product";
import AdminOrder from "./admin/pages/admin_order";
import AdminCategories from "./admin/pages/admin_categories";
import AdminPayment from "./admin/pages/admin_payment";
import AdminSettings from "./admin/pages/admin_settings";
import AdminNotifications from "./admin/pages/admin_notifications";

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

          {/* Admin (protected — requires admin login) */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<AdminProduct />} />
            <Route path="orders" element={<AdminOrder />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="payment" element={<AdminPayment />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

        </Routes>

      </BrowserRouter>
    </CartProvider>
  );
}

export default App;