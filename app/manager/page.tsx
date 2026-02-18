import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getMockTickets } from "@/lib/mock-data"

export default function ManagerViewPage() {
  const tickets = getMockTickets()
  const totalTickets = tickets.length
  const blockedTickets = tickets.filter((t) => t.status === "Blocked")

  const blockedByType: Record<string, number> = {}
  const blockedByTeam: Record<string, number> = {}

  tickets.forEach((ticket) => {
    ticket.workPackages
      .filter((wp) => wp.status === "Blocked")
      .forEach((wp) => {
        blockedByType[wp.wpType] = (blockedByType[wp.wpType] || 0) + 1
        blockedByTeam[wp.ownerTeam] = (blockedByTeam[wp.ownerTeam] || 0) + 1
      })
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Manager View</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Tickets</h3>
            <p className="text-3xl font-bold text-foreground">{totalTickets}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Blocked Tickets</h3>
            <p className="text-3xl font-bold text-status-execution">{blockedTickets.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Tickets</h3>
            <p className="text-3xl font-bold text-status-decision">
              {tickets.filter((t) => t.status === "In Progress").length}
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Bottleneck Analysis</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Blocked by Work Package Type</h3>
              <div className="space-y-2">
                {Object.entries(blockedByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-foreground">{type}</div>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-6 flex items-center px-3 text-xs font-medium ${
                            type === "Execution"
                              ? "bg-status-execution text-status-execution-foreground"
                              : "bg-muted-foreground/20 text-foreground"
                          }`}
                          style={{
                            width: `${(count / Math.max(...Object.values(blockedByType))) * 100}%`,
                          }}
                        >
                          {count} blocked
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Blocked by Team</h3>
              <div className="space-y-2">
                {Object.entries(blockedByTeam)
                  .sort((a, b) => b[1] - a[1])
                  .map(([team, count]) => (
                    <div key={team} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-foreground">{team}</div>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className="h-6 bg-muted-foreground/20 flex items-center px-3 text-xs font-medium text-foreground"
                          style={{
                            width: `${(count / Math.max(...Object.values(blockedByTeam))) * 100}%`,
                          }}
                        >
                          {count} blocked
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-card-highlight rounded-lg border border-border">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Insight:</span> Execution accounts for{" "}
              {Math.round((blockedByType["Execution"] / Object.values(blockedByType).reduce((a, b) => a + b, 0)) * 100)}
              % of current delays. Decision stage is not a bottleneck.
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}
