"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Ticket, WorkPackage } from "@/lib/types"
import { useState } from "react"
import { WorkPackageDetail } from "@/components/work-package-detail"
import { WorkPackageForm } from "@/components/work-package-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { addWorkPackageToTicket } from "@/lib/storage"

interface WorkPackageFlowProps {
  ticket: Ticket
  onUpdate?: () => void
  readOnly?: boolean // 읽기 전용 모드 추가 (완료된 이벤트용)
}

export function WorkPackageFlow({ ticket, onUpdate, readOnly = false }: WorkPackageFlowProps) {
  const [selectedWP, setSelectedWP] = useState<WorkPackage | null>(null)
  const [showForm, setShowForm] = useState(false)

  const wpTypes = ["Analysis", "Decision", "Execution", "Validation"]
  const wpTypesKorean: Record<string, string> = {
    Analysis: "분석",
    Decision: "의사결정",
    Execution: "실행",
    Validation: "검증",
  }

  const getWPsByType = (type: string) => {
    return ticket.workPackages.filter((wp) => wp.wpType === type)
  }

  const getWPStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-status-validation text-status-validation-foreground"
      case "In Progress":
        return "bg-status-decision text-status-decision-foreground"
      case "Blocked":
        return "bg-status-execution text-status-execution-foreground"
      case "Not Started":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Analysis":
        return "border-t-status-analysis"
      case "Decision":
        return "border-t-status-decision"
      case "Execution":
        return "border-t-status-execution"
      case "Validation":
        return "border-t-status-validation"
      default:
        return "border-t-muted"
    }
  }

  const handleSaveWP = (wp: Omit<WorkPackage, "id">) => {
    addWorkPackageToTicket(ticket.id, wp)
    setShowForm(false)
    if (onUpdate) {
      onUpdate()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">워크 패키지 흐름</h3>
        {!readOnly && (
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            워크 패키지 추가
          </Button>
        )}
      </div>

      {showForm && !readOnly && (
        <WorkPackageForm ticketId={ticket.id} onSave={handleSaveWP} onCancel={() => setShowForm(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {wpTypes.map((type) => {
          const wps = getWPsByType(type)
          return (
            <div key={type} className="space-y-3">
              <div className="text-center">
                <h4 className="text-sm font-medium text-foreground">{wpTypesKorean[type]}</h4>
                <div className="h-1 bg-border rounded-full mt-2">
                  <div
                    className={`h-1 rounded-full ${type === "Analysis" ? "bg-status-analysis" : type === "Decision" ? "bg-status-decision" : type === "Execution" ? "bg-status-execution" : "bg-status-validation"}`}
                    style={{
                      width: `${wps.length > 0 ? (wps.filter((wp) => wp.status === "Done").length / wps.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {wps.map((wp) => (
                  <Card
                    key={wp.id}
                    className={`p-3 cursor-pointer hover:shadow-md transition-shadow border-t-2 ${getTypeColor(type)} ${
                      selectedWP?.id === wp.id ? "ring-2 ring-ring" : ""
                    }`}
                    onClick={() => setSelectedWP(wp)}
                  >
                    <h5 className="text-sm font-medium text-foreground mb-2">{wp.title}</h5>
                    <div className="space-y-1">
                      <Badge variant="secondary" className={`${getWPStatusColor(wp.status)} text-xs`}>
                        {wp.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{wp.ownerTeam}</p>
                      {wp.dueDate && <p className="text-xs text-muted-foreground">Due: {wp.dueDate}</p>}
                      {wp.status === "Blocked" && wp.blockageReason && (
                        <p className="text-xs text-status-execution mt-2">⚠️ {wp.blockageReason}</p>
                      )}
                    </div>
                  </Card>
                ))}
                {wps.length === 0 && (
                  <Card className="p-3 border-dashed">
                    <p className="text-xs text-muted-foreground text-center">워크 패키지 없음</p>
                  </Card>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedWP && (
        <WorkPackageDetail
          workPackage={selectedWP}
          onClose={() => setSelectedWP(null)}
          onUpdate={onUpdate}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}
