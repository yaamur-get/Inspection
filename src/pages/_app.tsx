import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  const noLayoutRoutes = ["/", "/dashboard"];
  const shouldUseLayout = !noLayoutRoutes.includes(router.pathname);

  return (
    <ThemeProvider>
      <AuthProvider>
        {shouldUseLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
