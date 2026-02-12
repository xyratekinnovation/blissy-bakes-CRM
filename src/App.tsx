import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NewOrder from "./pages/NewOrder";
import CustomerInfo from "./pages/CustomerInfo";
import BillPreview from "./pages/BillPreview";
import BillSuccess from "./pages/BillSuccess";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Inventory from "./pages/Inventory";
import Offers from "./pages/Offers";
import Expenses from "./pages/Expenses";
import BulkOrders from "./pages/BulkOrders";
import Menu from "./pages/Menu";
import StaffManagement from "./pages/StaffManagement";
import AccountSettings from "./pages/AccountSettings";
import Security from "./pages/Security";
import EditOrder from "./pages/EditOrder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
