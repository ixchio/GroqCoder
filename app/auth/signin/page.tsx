"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Github, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    await signIn("github", { callbackUrl: "/projects" });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/projects");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10" />
      
      {/* Content */}
      <div className="relative w-full max-w-md">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Image
              src="/groq-coder-icon.jpg"
              alt="Groq Coder"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="text-2xl font-bold text-white ml-3">Groq Coder</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-white text-center mb-2">
            Welcome back
          </h1>
          <p className="text-neutral-400 text-center mb-8">
            Sign in to continue building amazing things
          </p>

          {/* GitHub Button */}
          <button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-black font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-neutral-700" />
            <span className="text-neutral-500 text-sm">or</span>
            <div className="flex-1 h-px bg-neutral-700" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl py-3 px-10 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl py-3 px-4 pr-10 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-neutral-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-500 text-sm mt-6">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
