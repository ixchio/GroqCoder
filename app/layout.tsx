/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata, Viewport } from "next";
import { Inter, PT_Sans } from "next/font/google";
import { getServerSession } from "next-auth";

import TanstackProvider from "@/components/providers/tanstack-query-provider";
import { NextAuthProvider } from "@/components/providers/session-provider";
import "@/assets/globals.css";
import { Toaster } from "@/components/ui/sonner";
import AppContext from "@/components/contexts/app-context";
import IframeDetector from "@/components/iframe-detector";
import { authOptions } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

const ptSans = PT_Sans({
  variable: "--font-ptSans-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Groq Coder | Free AI Code Generation ⚡",
  description:
    "Groq Coder is a free, open-source AI code generation platform. Build websites with Llama, Mixtral, Gemma, and more. Powered by Groq, Cerebras, and Together AI.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Groq Coder | Free AI Code Generation ⚡",
    description:
      "Free, open-source AI code generation platform. Build websites with Llama, Mixtral, Gemma, and more. Powered by Groq.",
    url: "https://groq-coder.vercel.app",
    siteName: "Groq Coder",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Groq Coder - Free AI Code Generation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Groq Coder | Free AI Code Generation ⚡",
    description:
      "Free, open-source AI code generation platform. Build websites with Llama, Mixtral, Gemma, and more.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Groq Coder",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/groq-coder-icon.jpg",
    shortcut: "/groq-coder-icon.jpg",
    apple: "/groq-coder-icon.jpg",
  },
  keywords: [
    "AI code generation",
    "Groq",
    "Llama",
    "Mixtral",
    "free AI",
    "open source",
    "web development",
    "code generator",
  ],
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

async function getMe() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { user: null, errCode: null };
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        bio: session.user.bio,
        linkedinUrl: session.user.linkedinUrl,
        githubUsername: session.user.githubUsername,
      },
      errCode: null,
    };
  } catch (err: any) {
    return { user: null, errCode: err.status || 500 };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getMe();
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${ptSans.variable} antialiased bg-black dark`}
      >
        <IframeDetector />
        <Toaster richColors position="bottom-center" />
        <NextAuthProvider>
          <TanstackProvider>
            <AppContext me={data}>{children}</AppContext>
          </TanstackProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
