"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { User } from "@/types";

// Extended session user type that includes our custom fields
interface ExtendedSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string;
  linkedinUrl?: string;
  githubUsername?: string;
}

export const useUser = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Map NextAuth session to User type
  const sessionUser = session?.user as ExtendedSessionUser | undefined;
  const user: User | null = sessionUser ? {
    id: sessionUser.id || "",
    name: sessionUser.name || "",
    email: sessionUser.email || "",
    image: sessionUser.image || "",
    bio: sessionUser.bio || "",
    linkedinUrl: sessionUser.linkedinUrl || "",
    githubUsername: sessionUser.githubUsername || "",
  } : null;

  const openLoginWindow = async () => {
    router.push("/auth/signin");
  };

  const loginWithGithub = async () => {
    await signIn("github", { callbackUrl: "/projects" });
  };

  const loginWithCredentials = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(result.error);
      return false;
    }

    toast.success("Login successful");
    router.push("/projects");
    return true;
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/" });
    toast.success("Logged out successfully");
  };

  return {
    user,
    loading: status === "loading",
    isAuthenticated: status === "authenticated",
    openLoginWindow,
    loginWithGithub,
    loginWithCredentials,
    logout,
  };
};
