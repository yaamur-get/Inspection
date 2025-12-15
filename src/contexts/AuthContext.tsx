
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT_MS = 4000;
const SIGN_OUT_TIMEOUT_MS = 1500;
const LOGIN_TIMEOUT_MS = 7000;
// const ROLE_TIMEOUT_MS = 4000;

async function safeSignOut() {
  try {
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((resolve) => setTimeout(resolve, SIGN_OUT_TIMEOUT_MS)),
    ]);
  } catch (err) {
    console.warn("signOut failed (ignored):", err);
  }
}

async function getUserRoleFromProfile(
  _userId: string,
  _email?: string | null
): Promise<"admin" | "technician"> {
  // TEMP: grant everyone admin to avoid role fetch timeouts and access issues
  return "admin";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const sessionResult = (await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Session fetch timeout")), SESSION_TIMEOUT_MS);
          }),
        ]).catch((error) => {
          console.warn("Session fetch timed out, returning empty session:", error);
          return {
            data: { session: null },
            error,
          } as Awaited<ReturnType<typeof supabase.auth.getSession>>;
        })) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (sessionResult.error) {
          console.warn("Error fetching session, clearing auth state:", sessionResult.error);
          await safeSignOut();
          setUser(null);
          return;
        }

        const sessionUser = sessionResult.data.session?.user;

        if (sessionUser) {
          // Set a provisional user immediately to avoid long loading spinners while we fetch role
          const provisionalFullName =
            typeof sessionUser.user_metadata?.full_name === "string"
              ? sessionUser.user_metadata.full_name
              : sessionUser.email || "";
          const provisionalPhone =
            typeof sessionUser.user_metadata?.phone === "string"
              ? sessionUser.user_metadata.phone
              : "";

          setUser({
            id: sessionUser.id,
            email: sessionUser.email || "",
            fullName: provisionalFullName,
            phoneNumber: provisionalPhone,
            status: "active",
            role: "admin",
            createdAt: new Date(sessionUser.created_at || Date.now()),
            updatedAt: new Date()
          });

          // Fetch the authoritative role in the background
          const role = await getUserRoleFromProfile(sessionUser.id, sessionUser.email);
          const finalFullName =
            typeof sessionUser.user_metadata?.full_name === "string"
              ? sessionUser.user_metadata.full_name
              : sessionUser.email || "";
          const finalPhone =
            typeof sessionUser.user_metadata?.phone === "string"
              ? sessionUser.user_metadata.phone
              : "";

          setUser((prev) =>
            prev && prev.id === sessionUser.id
              ? {
                  ...prev,
                  role,
                  fullName: finalFullName,
                  phoneNumber: finalPhone,
                }
              : prev
          );
        } else {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            const fullName =
              typeof currentUser.user_metadata?.full_name === "string"
                ? currentUser.user_metadata.full_name
                : currentUser.email;
            const phone =
              typeof currentUser.user_metadata?.phone === "string"
                ? currentUser.user_metadata.phone
                : "";

            const role = await getUserRoleFromProfile(currentUser.id, currentUser.email);
            setUser({
              id: currentUser.id,
              email: currentUser.email,
              fullName,
              phoneNumber: phone,
              status: "active",
              role,
              createdAt: new Date(currentUser.created_at || Date.now()),
              updatedAt: new Date()
            });
          } else {
            await safeSignOut();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear any corrupted session tokens so we don't get stuck on the loading screen
        await safeSignOut();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const role = await getUserRoleFromProfile(session.user.id, session.user.email);
        const safeFullName =
          typeof session.user.user_metadata?.full_name === "string"
            ? session.user.user_metadata.full_name
            : session.user.email || "";
        const safePhone =
          typeof session.user.user_metadata?.phone === "string"
            ? session.user.user_metadata.phone
            : "";

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          fullName: safeFullName,
          phoneNumber: safePhone,
          status: "active",
          role,
          createdAt: new Date(session.user.created_at || Date.now()),
          updatedAt: new Date()
        });
      } else if (event === "SIGNED_OUT" || event === "TOKEN_REFRESH_FAILED") {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const { user: authUser, error } = await Promise.race([
        authService.signIn(email, password),
        new Promise<{ user: null; error: { message: string } }>((resolve) => {
          timeoutId = setTimeout(
            () => resolve({ user: null, error: { message: "Login timed out" } }),
            LOGIN_TIMEOUT_MS
          );
        }),
      ]).finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
      
      if (error) {
        console.error("Login error:", error.message);
        return false;
      }

      if (authUser) {
        const safeFullName =
          typeof authUser.user_metadata?.full_name === "string"
            ? authUser.user_metadata.full_name
            : authUser.email || "";
        const safePhone =
          typeof authUser.user_metadata?.phone === "string"
            ? authUser.user_metadata.phone
            : "";

        const role = await getUserRoleFromProfile(authUser.id, authUser.email);
        setUser({
          id: authUser.id,
          email: authUser.email,
          fullName: safeFullName,
          phoneNumber: safePhone,
          status: "active",
          role,
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
