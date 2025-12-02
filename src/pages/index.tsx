
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError("");

    try {
      const success = await login(email, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      console.error("Login failed", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yaamur-primary" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yaamur-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yaamur-secondary via-white to-yaamur-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
          <div className="relative w-full h-16">
            <Image
              src="/logo/logo-topline.svg"
              alt="Yaamur Logo"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 80vw, 400px"
            />
          </div>
        <div className="text-center mb-8 fade-in-up mt-20">
          
          <h1 className="text-4xl font-bold text-yaamur-text mb-3">نظام المعاينة</h1>
          <div className="w-24 h-1 yaamur-gradient rounded-full mx-auto mt-4"></div>
        </div>

        <Card className="yaamur-card fade-in-up border-0 shadow-xl">
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-2xl font-bold text-yaamur-text">أهلاً وسهلاً</CardTitle>
            
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {error && (
              <Alert className="mb-6 bg-red-50 border-red-200 slide-in-right">
                <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-yaamur-text">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="xxxx@yaamur.org.sa"
                  required
                  className="yaamur-input h-12 text-base border-2 rounded-xl transition-all duration-300 focus:shadow-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-yaamur-text">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="yaamur-input h-12 text-base border-2 rounded-xl pr-12 transition-all duration-300 focus:shadow-lg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-yaamur-secondary rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-yaamur-text-light" />
                    ) : (
                      <Eye className="w-4 h-4 text-yaamur-text-light" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="yaamur-button-primary w-full h-13 text-lg font-semibold rounded-xl shadow-lg"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

          </CardContent>
        </Card>

        <div className="text-center mt-8 fade-in-up">
          <p className="text-yaamur-text-light text-sm">
            © 2025 Yaamur Association. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
