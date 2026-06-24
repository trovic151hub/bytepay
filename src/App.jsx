import { useEffect, useState } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import BottomNav from "./components/BottomNav.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
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
import TopupPage from "./pages/TopupPage.jsx";
import FundHistoryPage from "./pages/FundHistoryPage.jsx";
import RewardPage from "./pages/RewardPage.jsx";
import MePage from "./pages/MePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import TransactionDetailPage from "./pages/TransactionDetailPage.jsx";

function ProtectedRoute({ component: Component }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return <Component />;
}

function PublicRoute({ component: Component }) {
  const { user, authBusy } = useAuth();
  if (user && !authBusy) return <Redirect to="/dashboard" />;
  return <Component />;
}

function HomeRoute() {
  const { user } = useAuth();
  if (user) return <Redirect to="/dashboard" />;
  return <LandingPage />;
}

// Stable (module-scope) wrapper components per route. Defining these inline
// inside App's render (e.g. `component={() => <PublicRoute .../>}`) creates a
// new function identity on every App re-render, which React treats as a new
// component type — fully remounting the page underneath (resetting its local
// state and replaying entrance animations) any time auth context changes,
// even mid-flow on the same screen.
const PublicLogin = () => <PublicRoute component={LoginPage} />;
const PublicSignUp = () => <PublicRoute component={SignUpPage} />;
const PublicForgotPassword = () => <PublicRoute component={ForgotPasswordPage} />;
const ProtectedDashboard = () => <ProtectedRoute component={DashboardPage} />;
const ProtectedTransferBank = () => <ProtectedRoute component={TransferBankPage} />;
const ProtectedTransferBytepay = () => <ProtectedRoute component={TransferBankPage} />;
const ProtectedAirtime = () => <ProtectedRoute component={AirtimePage} />;
const ProtectedData = () => <ProtectedRoute component={DataPage} />;
const ProtectedBetting = () => <ProtectedRoute component={BettingPage} />;
const ProtectedElectricity = () => <ProtectedRoute component={ElectricityPage} />;
const ProtectedSavings = () => <ProtectedRoute component={SavingsPage} />;
const ProtectedWealth = () => <ProtectedRoute component={WealthPage} />;
const ProtectedHistory = () => <ProtectedRoute component={HistoryPage} />;
const ProtectedProfile = () => <ProtectedRoute component={ProfilePage} />;
const ProtectedAssets = () => <ProtectedRoute component={AssetsPage} />;
const ProtectedAddMoney = () => <ProtectedRoute component={AddMoneyPage} />;
const ProtectedTopup = () => <ProtectedRoute component={TopupPage} />;
const ProtectedFundHistory = () => <ProtectedRoute component={FundHistoryPage} />;
const ProtectedReward = () => <ProtectedRoute component={RewardPage} />;
const ProtectedMe = () => <ProtectedRoute component={MePage} />;
const ProtectedSettings = () => <ProtectedRoute component={SettingsPage} />;
const ProtectedTxDetail = () => <ProtectedRoute component={TransactionDetailPage} />;
const RedirectHome = () => <Redirect to="/" />;

const TAB_ROUTES = ["/dashboard", "/wealth", "/savings", "/reward", "/me"];

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function ConditionalBottomNav() {
  const [location] = useLocation();
  const isTab = TAB_ROUTES.includes(location) || location === "/";
  return isTab ? <BottomNav /> : null;
}

const MIN_SPLASH_MS = 1200;

export default function App() {
  const { loading } = useAuth();
  const [splashTimerDone, setSplashTimerDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashTimerDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  if (loading || !splashTimerDone) return <SplashScreen />;

  return (
    <>
    <ScrollToTop />
    <ConditionalBottomNav />
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/login" component={PublicLogin} />
      <Route path="/signup" component={PublicSignUp} />
      <Route path="/forgot-password" component={PublicForgotPassword} />
      <Route path="/dashboard" component={ProtectedDashboard} />
      <Route path="/transfer/bank" component={ProtectedTransferBank} />
      <Route path="/transfer/bytepay" component={ProtectedTransferBytepay} />
      <Route path="/airtime" component={ProtectedAirtime} />
      <Route path="/data" component={ProtectedData} />
      <Route path="/betting" component={ProtectedBetting} />
      <Route path="/electricity" component={ProtectedElectricity} />
      <Route path="/savings" component={ProtectedSavings} />
      <Route path="/wealth" component={ProtectedWealth} />
      <Route path="/history" component={ProtectedHistory} />
      <Route path="/profile" component={ProtectedProfile} />
      <Route path="/assets" component={ProtectedAssets} />
      <Route path="/add-money" component={ProtectedAddMoney} />
      <Route path="/topup" component={ProtectedTopup} />
      <Route path="/fund-history" component={ProtectedFundHistory} />
      <Route path="/reward" component={ProtectedReward} />
      <Route path="/me" component={ProtectedMe} />
      <Route path="/settings" component={ProtectedSettings} />
      <Route path="/transaction/:id" component={ProtectedTxDetail} />
      <Route component={RedirectHome} />
    </Switch>
    </>
  );
}
