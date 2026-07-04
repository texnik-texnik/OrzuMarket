import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { CartProvider } from './cart/CartProvider';
import { LanguageProvider } from './localization/LanguageProvider';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './pages/common/AppLayout';
import { HomePage } from './pages/common/HomePage';
import { LoginPage } from './pages/common/LoginPage';
import { ShopPage } from './pages/common/ShopPage';
import { ProfilePage } from './pages/common/ProfilePage';
import { CheckoutPage } from './pages/common/CheckoutPage';
import { BlockedPage } from './pages/common/BlockedPage';
import { NotFoundPage } from './pages/common/NotFoundPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { SellerLayout } from './pages/seller/SellerLayout';
import { SellerOverviewPage } from './pages/seller/SellerOverviewPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
          <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="blocked" element={<BlockedPage />} />

            {/* /admin/* — только admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="products" element={<AdminProductsPage />} />
              </Route>
            </Route>

            {/* /dashboard/* — только seller */}
            <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
              <Route path="dashboard" element={<SellerLayout />}>
                <Route index element={<SellerOverviewPage />} />
                <Route path="products" element={<SellerProductsPage />} />
                <Route path="orders" element={<SellerOrdersPage />} />
              </Route>
            </Route>

            {/* /shop и /profile — любой авторизованный пользователь */}
            <Route element={<ProtectedRoute />}>
              <Route path="shop" element={<ShopPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}
