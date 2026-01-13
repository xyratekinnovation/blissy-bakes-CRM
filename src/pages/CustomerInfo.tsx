import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User, Phone, Gift, UserCheck, UserPlus, Cake, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { customersApi } from "@/api/customers";

export default function CustomerInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = location.state?.cart || [];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [customerType, setCustomerType] = useState<"new" | "repeat" | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handlePhoneChange = async (value: string) => {
    setPhone(value);
    
    // Check database for existing customer
    if (value.length >= 10) {
      setIsChecking(true);
      try {
        const customers = await customersApi.searchCustomers(value);
        if (customers && customers.length > 0) {
          const existingCustomer = customers[0];
          setCustomerType("repeat");
          setName(existingCustomer.name || "");
          if (existingCustomer.birthday) {
            setBirthday(existingCustomer.birthday);
          }
        } else {
          setCustomerType("new");
          setName("");
        }
      } catch (error) {
        console.error("Error checking customer:", error);
        setCustomerType("new");
      } finally {
        setIsChecking(false);
      }
    } else {
      setCustomerType(null);
      setName("");
    }
  };

  const handleContinue = () => {
    navigate("/bill-preview", {
      state: {
        cart,
        customer: { name, phone, birthday, customerType },
      },
    });
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-playfair text-xl font-bold text-foreground">Customer Details</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Decorative Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-pink-soft flex items-center justify-center animate-bounce-soft">
              <span className="text-5xl">🧁</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold-sparkle animate-sparkle" />
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-6 shadow-card space-y-5">
          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Phone Number *
            </label>
            <div className="relative">
              <Input
                type="tel"
                placeholder="Enter customer phone"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="h-14 rounded-2xl border-2 border-border focus:border-primary bg-card text-lg pr-10"
              />
              {isChecking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            {/* Customer Type Badge */}
            {customerType && !isChecking && (
              <div
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl animate-fade-in",
                  customerType === "repeat"
                    ? "bg-lavender-soft text-lavender-deep"
                    : "bg-pink-soft text-pink-deep"
                )}
              >
                {customerType === "repeat" ? (
                  <>
                    <UserCheck className="w-5 h-5" />
                    <span className="font-semibold">Welcome back! Repeat Customer ✨</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span className="font-semibold">New Customer! 🎉</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Customer Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Customer Name *
            </label>
            <Input
              type="text"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 rounded-2xl border-2 border-border focus:border-primary bg-card text-lg"
            />
          </div>

          {/* Birthday (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Gift className="w-4 h-4 text-gold-sparkle" />
              Birthday (Optional)
            </label>
            <Input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="h-14 rounded-2xl border-2 border-border focus:border-primary bg-card text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Get special offers on birthdays! 🎂
            </p>
          </div>

          {/* Order Summary */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Items in cart</span>
              <span className="font-semibold">
                {cart.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Order Total</span>
              <span className="text-xl font-bold text-gradient">
                ₹{cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-6">
          <Button
            onClick={handleContinue}
            variant="bakery"
            size="xl"
            className="w-full"
            disabled={!name || !phone || phone.length < 10}
          >
            Continue to Bill
            <Cake className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
