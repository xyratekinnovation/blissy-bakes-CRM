import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Lazy-load pages for faster initial load; each tab loads its chunk on first visit
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Home"));
const NewOrder = lazy(() => import("./pages/NewOrder"));
const CustomerInfo = lazy(() => import("./pages/CustomerInfo"));
const BillPreview = lazy(() => import("./pages/BillPreview"));
const BillSuccess = lazy(() => import("./pages/BillSuccess"));
const Orders = lazy(() => import("./pages/Orders"));
const Customers = lazy(() => import("./pages/Customers"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Offers = lazy(() => import("./pages/Offers"));
const Expenses = lazy(() => import("./pages/Expenses"));
const BulkOrders = lazy(() => import("./pages/BulkOrders"));
const Menu = lazy(() => import("./pages/Menu"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Security = lazy(() => import("./pages/Security"));
const EditOrder = lazy(() => import("./pages/EditOrder"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path="/customer-info" element={<CustomerInfo />} />
            <Route path="/bill-preview" element={<BillPreview />} />
            <Route path="/bill-success" element={<BillSuccess />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/edit-order" element={<EditOrder />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/bulk-orders" element={<BulkOrders />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/settings/staff" element={<StaffManagement />} />
            <Route path="/settings/account" element={<AccountSettings />} />
            <Route path="/settings/security" element={<Security />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
