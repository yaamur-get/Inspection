
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


      <div className="flex">
     

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
