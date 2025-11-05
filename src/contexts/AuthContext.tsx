
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { authService } from "@/services/authService";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            fullName: currentUser.user_metadata?.full_name || currentUser.email,
            phoneNumber: currentUser.user_metadata?.phone || "",
            status: "active",
            role: currentUser.user_metadata?.role || "technician",
            createdAt: new Date(currentUser.created_at || Date.now()),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name || session.user.email || "",
          phoneNumber: session.user.user_metadata?.phone || "",
          status: "active",
          role: session.user.user_metadata?.role || "technician",
          createdAt: new Date(session.user.created_at || Date.now()),
          updatedAt: new Date()
        });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: authUser, error } = await authService.signIn(email, password);
      
      if (error) {
        console.error("Login error:", error.message);
        return false;
      }

      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.user_metadata?.full_name || authUser.email,
          phoneNumber: authUser.user_metadata?.phone || "",
          status: "active",
          role: authUser.user_metadata?.role || "technician",
          createdAt: new Date(authUser.created_at || Date.now()),
          updatedAt: new Date()
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login exception:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
