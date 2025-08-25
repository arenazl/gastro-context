import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CollapsibleLayout as Layout } from './components/CollapsibleLayout';
import { LoginModern as Login } from './pages/LoginModern';
import { DashboardModern as Dashboard } from './pages/DashboardModern';
import { TablesModern as Tables } from './pages/TablesModern';
import { TablesVisual } from './pages/TablesVisual';
import { NewOrderWithCache } from './pages/NewOrderWithCache';
import { KitchenKanban as Kitchen } from './pages/KitchenKanban';
import { KitchenDragDrop } from './pages/KitchenDragDrop';
import { POSModern as POS } from './pages/POSModern';
import { ProductsModern as Products } from './pages/ProductsModern';
import { ProductsManagement } from './pages/ProductsManagement';
import { ProductsDynamic as ProductsComplete } from './pages/ProductsDynamic';
import { CustomersManagement } from './pages/CustomersManagement';
import { CompaniesManagement } from './pages/CompaniesManagement';
import { CompanySettings } from './pages/CompanySettings';
import { SettingsHub } from './pages/SettingsHub';
import { UnifiedSettings } from './pages/UnifiedSettings';
import { GeneralSettings } from './pages/GeneralSettings';
import { BusinessSettings } from './pages/BusinessSettings';
import { LocalizationSettings } from './pages/LocalizationSettings';
import { TablesManagement } from './pages/TablesManagement';
import { Reports } from './pages/Reports';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { CustomerMenu } from './pages/CustomerMenu';
import { InteractiveMenuAI } from './pages/InteractiveMenuAI';
import { InteractiveMenuSingleScreen } from './pages/InteractiveMenuSingleScreen';
import { QRManager } from './pages/QRManager';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeSwitcher } from './components/ThemeSwitcher';

function App() {
  return (
    <ThemeProvider>
      <LocalizationProvider>
        <Router>
          <AuthProvider>
          <ThemeSwitcher />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            style={{ zIndex: 9999 }}
          />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tables"
            element={
              <ProtectedRoute>
                <Layout>
                  <TablesVisual />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <NewOrderWithCache />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute>
                <Layout>
                  <Kitchen />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/kitchen-drag"
            element={
              <ProtectedRoute>
                <Layout>
                  <KitchenDragDrop />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <Layout>
                  <POS />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductsComplete />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/products-management"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductsManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/products-old"
            element={
              <ProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomersManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <Layout>
                  <CompaniesManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsHub />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/unified-settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <UnifiedSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/general-settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <GeneralSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/business-settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <BusinessSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/localization-settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <LocalizationSettings />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings/general"
            element={
              <ProtectedRoute>
                <Layout>
                  <CompanySettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tables-management"
            element={
              <ProtectedRoute>
                <Layout>
                  <TablesManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          /> */}
          
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnalyticsDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/qr-manager"
            element={
              <ProtectedRoute>
                <Layout>
                  <QRManager />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Ruta pública para menú de clientes (QR) */}
          <Route
            path="/menu"
            element={<InteractiveMenuSingleScreen />}
          />
          <Route
            path="/menu/:tableId"
            element={<InteractiveMenuSingleScreen />}
          />
          <Route
            path="/menu-chat/:tableId"
            element={<InteractiveMenuAI />}
          />
          <Route
            path="/menu-classic/:tableId"
            element={<CustomerMenu />}
          />
        </Routes>
          </AuthProvider>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;