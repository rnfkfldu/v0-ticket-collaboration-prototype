"use client"

import { TicketsList } from "@/components/tickets-list"
import { NotificationPanel } from "@/components/notification-panel"
import { AppShell } from "@/components/app-shell"

export default function TicketsPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">내 이벤트</h1>
            <NotificationPanel />
          </div>
        </header>
        <main className="p-6">
          <TicketsList />
        </main>
      </div>
    </AppShell>
  )
}
