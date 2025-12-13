/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useUser } from "@/hooks/useUser";
import { UserContext } from "@/components/contexts/user-context";
import { User } from "@/types";

export default function AppContext({
  children,
}: {
  children: React.ReactNode;
  me?: {
    user: User | null;
    errCode: number | null;
  };
}) {
  const { user, logout, loading, isAuthenticated } = useUser();

  // Redirect logic is handled by NextAuth middleware now
  // No need for complex broadcast channel logic with NextAuth

  return (
    <UserContext value={{ user, loading, logout, isAuthenticated } as any}>
      {children}
    </UserContext>
  );
}
