
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Building2, Users, Settings, FileText, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return <>{children}</>;
  }

  const isAdmin = user.role === "admin";
  const currentPath = router.pathname;

  const navigation = [
    {
      name: "Dashboard", 
      href: "/dashboard",
      icon: Home,
      show: true,
    },
    {
      name: "Field Reports",
      href: "/field",
      icon: FileText,
      show: !isAdmin,
    },
    {
      name: "User Management",
      href: "/admin/users", 
      icon: Users,
      show: isAdmin,
    },
    {
      name: "Item Management",
      href: "/admin/items",
      icon: Settings,
      show: isAdmin,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-yaamur-secondary-dark/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 yaamur-gradient rounded-2xl flex items-center justify-center shadow-lg floating-animation">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-yaamur-text">Mosque Inspection System</h1>
                <p className="text-sm text-yaamur-text-light font-medium">نظام المعاينة</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-base font-semibold text-yaamur-text">{user.fullName}</p>
                <p className="text-sm text-yaamur-text-light">
                  {user.role === "admin" ? "Administrator" : "Field Technician"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2 h-10 px-4 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200 rounded-xl border-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
     

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
