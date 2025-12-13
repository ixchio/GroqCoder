"use client";

import { createContext } from "react";
import { User } from "@/types";

export const UserContext = createContext({
  user: undefined as User | undefined,
});
