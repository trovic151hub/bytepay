import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./contexts/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import TransferBankPage from "./pages/TransferBankPage.jsx";
import TransferBytepayPage from "./pages/TransferBytepayPage.jsx";
import AirtimePage from "./pages/AirtimePage.jsx";
import DataPage from "./pages/DataPage.jsx";
import BettingPage from "./pages/BettingPage.jsx";
import ElectricityPage from "./pages/ElectricityPage.jsx";
import SavingsPage from "./pages/SavingsPage.jsx";
import WealthPage from "./pages/WealthPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AssetsPage from "./pages/AssetsPage.jsx";
import AddMoneyPage from "./pages/AddMoneyPage.jsx";
import RewardPage from "./pages/RewardPage.jsx";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

function ProtectedRoute({ component: Component }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function PublicRoute({ component: Component }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Redirect to="/dashboard" />;
  return <Component />;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Redirect to="/dashboard" />;
  return <LandingPage />;
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/login" component={() => <PublicRoute component={LoginPage} />} />
      <Route path="/signup" component={() => <PublicRoute component={SignUpPage} />} />
      <Route path="/forgot-password" component={() => <PublicRoute component={ForgotPasswordPage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/transfer/bank" component={() => <ProtectedRoute component={TransferBankPage} />} />
      <Route path="/transfer/bytepay" component={() => <ProtectedRoute component={TransferBytepayPage} />} />
      <Route path="/airtime" component={() => <ProtectedRoute component={AirtimePage} />} />
      <Route path="/data" component={() => <ProtectedRoute component={DataPage} />} />
      <Route path="/betting" component={() => <ProtectedRoute component={BettingPage} />} />
      <Route path="/electricity" component={() => <ProtectedRoute component={ElectricityPage} />} />
      <Route path="/savings" component={() => <ProtectedRoute component={SavingsPage} />} />
      <Route path="/wealth" component={() => <ProtectedRoute component={WealthPage} />} />
      <Route path="/history" component={() => <ProtectedRoute component={HistoryPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/assets" component={() => <ProtectedRoute component={AssetsPage} />} />
      <Route path="/add-money" component={() => <ProtectedRoute component={AddMoneyPage} />} />
      <Route path="/reward" component={() => <ProtectedRoute component={RewardPage} />} />
      <Route component={() => <Redirect to="/" />} />
    </Switch>
  );
}
