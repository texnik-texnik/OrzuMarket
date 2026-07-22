import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { CartProvider } from './cart/CartProvider';
import { WishlistProvider } from './cart/WishlistProvider';
import { LanguageProvider } from './localization/LanguageProvider';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './pages/common/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded page components for Code Splitting (Bundle Splitting)
const HomePage = lazy(() => import('./pages/common/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/common/LoginPage').then(m => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() => import('./pages/common/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ShopPage = lazy(() => import('./pages/common/ShopPage').then(m => ({ default: m.ShopPage })));
const SellerShopPage = lazy(() => import('./pages/common/SellerShopPage').then(m => ({ default: m.SellerShopPage })));
const ProductDetailPage = lazy(() => import('./pages/common/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const WishlistPage = lazy(() => import('./pages/common/WishlistPage').then(m => ({ default: m.WishlistPage })));
const ProfilePage = lazy(() => import('./pages/common/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CheckoutPage = lazy(() => import('./pages/common/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const BlockedPage = lazy(() => import('./pages/common/BlockedPage').then(m => ({ default: m.BlockedPage })));
const NotFoundPage = lazy(() => import('./pages/common/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Admin Lazy Routes
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminDisputesPage = lazy(() => import('./pages/admin/AdminDisputesPage').then(m => ({ default: m.AdminDisputesPage })));

// Seller Lazy Routes
const SellerLayout = lazy(() => import('./pages/seller/SellerLayout').then(m => ({ default: m.SellerLayout })));
const SellerOverviewPage = lazy(() => import('./pages/seller/SellerOverviewPage').then(m => ({ default: m.SellerOverviewPage })));
const SellerProductsPage = lazy(() => import('./pages/seller/SellerProductsPage').then(m => ({ default: m.SellerProductsPage })));
const SellerOrdersPage = lazy(() => import('./pages/seller/SellerOrdersPage').then(m => ({ default: m.SellerOrdersPage })));

function PageFallbackLoader() {
  return (
    <div className="screen-center">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Загрузка...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <Suspense fallback={<PageFallbackLoader />}>
                  <Routes>
                    <Route element={<AppLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="login" element={<LoginPage />} />
                      <Route path="reset-password" element={<ResetPasswordPage />} />
                      <Route path="blocked" element={<BlockedPage />} />

                      {/* /admin/* — только admin */}
                      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="admin" element={<AdminLayout />}>
                          <Route index element={<AdminOverviewPage />} />
                          <Route path="users" element={<AdminUsersPage />} />
                          <Route path="products" element={<AdminProductsPage />} />
                          <Route path="disputes" element={<AdminDisputesPage />} />
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
                        <Route path="product/:productId" element={<ProductDetailPage />} />
                        <Route path="wishlist" element={<WishlistPage />} />
                        <Route path="seller-shop/:sellerId" element={<SellerShopPage />} />
                        <Route path="checkout" element={<CheckoutPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                      </Route>

                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
