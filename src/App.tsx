import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { NAV_GROUPS } from '@/config/navigation';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AdminLayout   from '@/layouts/AdminLayout';
import LoginPage     from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard';
import UsersPage     from '@/features/users';
import AppealsPage   from '@/features/appeals';
import SwapsPage     from '@/features/swaps';
import StationsPage  from '@/features/stations';
import PortsPage     from '@/features/ports';
import TariffsPage        from '@/features/tariffs';
import CreateTariffPage   from '@/features/tariffs/CreateTariffPage';
import TariffDetailPage   from '@/features/tariffs/TariffDetailPage';
import TariffTypesPage    from '@/features/tariff-types';
import NotificationsPage        from '@/features/notifications';
import NotificationDetailPage  from '@/features/notifications/NotificationDetailPage';
import PromocodesPage         from '@/features/promocodes';
import PromocodeDetailPage    from '@/features/promocodes/PromocodeDetailPage';
import TransactionsPage       from '@/features/transactions';
import CardsPage              from '@/features/cards';
import BatteriesPage          from '@/features/batteries';
import AdminsPage             from '@/features/admins';
import UserOperationsPage     from '@/features/user-operations';
import CouponsPage            from '@/features/coupons';
import PenaltiesPage          from '@/features/penalties';
import SubscriptionsPage      from '@/features/subscriptions';
import DocumentsPage          from '@/features/documents';
import FaqPage                from '@/features/faq';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SmartRedirect() {
  const { menuPermsReady } = useAuth();
  const { canRead } = usePermissions();

  if (!menuPermsReady) return null;

  for (const group of NAV_GROUPS) {
    if (group.menuId && !canRead(group.menuId)) continue;
    for (const item of group.items) {
      const ok = item.alwaysVisible
        ? true
        : item.menuId
          ? canRead(item.menuId)
          : canRead(item.path.split('/').pop()?.replace(/-/g, '_') ?? '');
      if (ok) return <Navigate to={item.path} replace />;
    }
  }

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SmartRedirect />} />
          <Route path="dashboard"      element={<DashboardPage />} />
          <Route path="users"          element={<UsersPage />} />
          <Route path="admins"         element={<AdminsPage />} />
          <Route path="appeals"         element={<AppealsPage />} />
          <Route path="notifications"      element={<NotificationsPage />} />
          <Route path="notifications/:id"  element={<NotificationDetailPage />} />
          <Route path="swaps/log"      element={<SwapsPage />} />
          <Route path="stations"       element={<StationsPage />} />
          <Route path="ports"            element={<PortsPage />} />
          <Route path="payments/tariffs"            element={<TariffsPage />} />
          <Route path="payments/tariffs/new"       element={<CreateTariffPage />} />
          <Route path="payments/tariffs/:id"       element={<TariffDetailPage />} />
          <Route path="payments/tariff-types"      element={<TariffTypesPage />} />
          <Route path="payments/transactions"      element={<TransactionsPage />} />
          <Route path="payments/cards"             element={<CardsPage />} />
          <Route path="payments/subscriptions"        element={<SubscriptionsPage />} />
          <Route path="payments/coupons"            element={<CouponsPage />} />
          <Route path="payments/promo-codes"         element={<PromocodesPage />} />
          <Route path="payments/promo-codes/:id"   element={<PromocodeDetailPage />} />
          <Route path="payments/user-operations"   element={<UserOperationsPage />} />
          <Route path="payments/penalties"         element={<PenaltiesPage />} />
          <Route path="batteries"                 element={<BatteriesPage />} />
          <Route path="extra/documents"           element={<DocumentsPage />} />
          <Route path="extra/faq"                 element={<FaqPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}
