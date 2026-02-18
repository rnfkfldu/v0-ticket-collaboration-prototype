"use client"

import type { ReactNode } from "react"
import { UserProvider } from "@/lib/user-context"

export function UserProviderWrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>
}
