import { 
  Users, 
  UtensilsCrossed, 
  User,
  ChevronRight,
  Shield,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

interface SettingItem {
  icon: React.ElementType;
  label: string;
  description: string;
  path?: string;
  color: "pink" | "lavender" | "gold" | "default";
  badge?: string;
}

const settingsGroups: { title: string; items: SettingItem[] }[] = [
  {
    title: "Shop Management",
    items: [
      { icon: Users, label: "Staff Management", description: "Manage team members & permissions", path: "/settings/staff", color: "pink" },
      { icon: UtensilsCrossed, label: "Menu Editing", description: "Add, edit or remove menu items", path: "/menu", color: "lavender" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: User, label: "Account Settings", description: "Profile & business info", path: "/settings/account", color: "default" },
      { icon: Shield, label: "Security", description: "Password & PIN settings", path: "/settings/security", color: "default" },
    ],
  },
];

const colorClasses = {
  pink: "bg-pink-soft text-pink-deep",
  lavender: "bg-lavender-soft text-lavender-deep",
  gold: "bg-gold-soft text-chocolate",
  default: "bg-muted text-foreground",
};

export default function Settings() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-hero px-4 pt-6 pb-6">
        <h1 className="font-playfair text-2xl font-bold text-foreground mb-4">Settings</h1>
        
        {/* Shop Card */}
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-button flex items-center justify-center shadow-button">
            <span className="text-2xl">🧁</span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Blissyy Bakes</h2>
            <p className="text-sm text-muted-foreground">Premium Plan Active</p>
          </div>
          <span className="px-3 py-1 bg-gold-soft text-chocolate text-xs font-semibold rounded-full">
            ✨ Pro
          </span>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              {group.title}
            </h2>
            <div className="space-y-2">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.path && navigate(item.path)}
                  className="w-full bakery-card flex items-center gap-4 text-left"
                >
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    colorClasses[item.color]
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{item.label}</p>
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-pink-medium text-primary-foreground text-xs font-semibold rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full p-4 rounded-2xl border-2 border-destructive/30 bg-destructive/5 flex items-center gap-4 transition-all duration-300 hover:bg-destructive/10"
        >
          <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-destructive">Logout</p>
            <p className="text-sm text-muted-foreground">Sign out of your account</p>
          </div>
        </button>

        {/* App Version */}
        <p className="text-center text-sm text-muted-foreground pt-4">
          Blissyy Bakes POS v1.0.0
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
