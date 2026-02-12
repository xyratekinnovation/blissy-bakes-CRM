import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, Plus, History, Home, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "@/components/Sparkles";

interface Confetti {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
}

export default function BillSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { total = 0, customer = {}, orderNumber, cart = [] } = location.state || {};
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    const emojis = ["🧁", "🍰", "🎂", "🍪", "🥐", "🍩", "🎉", "✨", "💖"];
    const newConfetti = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }));
    setConfetti(newConfetti);
  }, []);

  const handleShareWhatsApp = () => {
    const itemsList = cart.length > 0
      ? cart
          .map((item: any) => `• ${item.name} - Qty: ${item.quantity} - ₹${item.price} each - ₹${item.price * item.quantity}`)
          .join("\n")
      : `Total: ₹${total}`;
    const message = encodeURIComponent(
      `🧁 *THE BLISSY BAKES*\n\n` +
      `Hi ${customer.name}!\n\n` +
      `*Your Order:*\n${itemsList}\n\n` +
      `*Total: ₹${total}*\n\n` +
      `Thank you for choosing THE BLISSY BAKES! 💖`
    );
    window.open(`https://wa.me/${customer.phone}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen gradient-hero relative overflow-hidden flex flex-col items-center justify-center px-4">
      <Sparkles count={30} />
      
      {/* Confetti Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confetti.map((item) => (
          <div
            key={item.id}
            className="absolute text-3xl animate-confetti"
            style={{
              left: `${item.left}%`,
              bottom: "-10%",
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Success Content */}
      <div className="relative z-10 text-center max-w-sm mx-auto">
        {/* Success Icon */}
        <div className="mb-8 animate-bounce-soft">
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-full gradient-button flex items-center justify-center shadow-glow">
              <CheckCircle className="w-14 h-14 text-card" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gold-sparkle flex items-center justify-center animate-wiggle shadow-gold">
              <span className="text-xl">🎉</span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="font-playfair text-3xl font-bold text-gradient mb-2">
          Order Complete!
        </h1>
        <p className="text-muted-foreground text-lg mb-2">
          Bill generated successfully
        </p>
        {orderNumber && (
          <p className="text-lg font-semibold text-foreground mb-2">
            Order ID: <span className="text-gradient">#{orderNumber}</span>
          </p>
        )}
        <p className="text-2xl font-bold text-foreground mb-8">
          Total: <span className="text-gradient">₹{total}</span>
        </p>

        {/* Customer Badge */}
        {customer.name && (
          <div className="glass-card rounded-2xl p-4 mb-8 animate-slide-up">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-semibold text-foreground">{customer.name}</p>
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button
            onClick={handleShareWhatsApp}
            variant="bakery"
            size="lg"
            className="w-full"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Share Bill on WhatsApp
          </Button>
          
          <Button
            onClick={() => navigate("/new-order")}
            variant="soft"
            size="lg"
            className="w-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Record Another Order
          </Button>
          
          <Button
            onClick={() => navigate("/orders")}
            variant="lavender"
            size="lg"
            className="w-full"
          >
            <History className="w-5 h-5 mr-2" />
            View Order History
          </Button>
          
          <Button
            onClick={() => navigate("/home")}
            variant="ghost"
            size="lg"
            className="w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Thank You Note */}
        <p className="mt-8 text-sm text-muted-foreground">
          Thank you for using THE BLISSY BAKES! 💖
        </p>
      </div>
    </div>
  );
}
