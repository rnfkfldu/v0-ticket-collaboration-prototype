import { TicketDetail } from "@/components/ticket-detail"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getTicketById } from "@/lib/storage"
import { notFound } from "next/navigation"

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const ticket = getTicketById(id)

  if (!ticket) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Tickets
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Ticket Details</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <TicketDetail ticket={ticket} />
      </main>
    </div>
  )
}
