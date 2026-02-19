"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { updateTicket } from "@/lib/storage"
import type { Ticket } from "@/lib/types"

interface TicketEditDialogProps {
  ticket: Ticket
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TicketEditDialog({ ticket, open, onOpenChange, onSuccess }: TicketEditDialogProps) {
  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description,
    ticketType: ticket.ticketType,
    priority: ticket.priority,
    impact: ticket.impact,
    owner: ticket.owner,
    dueDate: ticket.dueDate || "",
    accessLevel: ticket.accessLevel,
    allowedTeams: ticket.allowedTeams || [],
  })

  const availableTeams = ["Engineering", "Operations", "Maintenance", "QA", "Management"]

  useEffect(() => {
    if (open) {
      setFormData({
        title: ticket.title,
        description: ticket.description,
        ticketType: ticket.ticketType,
        priority: ticket.priority,
        impact: ticket.impact,
        owner: ticket.owner,
        dueDate: ticket.dueDate || "",
        accessLevel: ticket.accessLevel,
        allowedTeams: ticket.allowedTeams || [],
      })
    }
  }, [open, ticket])

  const toggleTeam = (team: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedTeams: prev.allowedTeams.includes(team)
        ? prev.allowedTeams.filter((t) => t !== team)
        : [...prev.allowedTeams, team],
    }))
  }

  const handleSubmit = () => {
    updateTicket(ticket.id, {
      title: formData.title,
      description: formData.description,
      ticketType: formData.ticketType as "Improvement" | "Trouble" | "Change" | "Analysis",
      priority: formData.priority as "P1" | "P2" | "P3" | "P4",
      impact: formData.impact as "Safety" | "Quality" | "Throughput" | "Cost" | "Energy",
      owner: formData.owner,
      dueDate: formData.dueDate,
      accessLevel: formData.accessLevel as "Private" | "Team" | "Public",
      allowedTeams: formData.accessLevel === "Team" ? formData.allowedTeams : undefined,
    })

    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>이벤트 수정</DialogTitle>
          <DialogDescription>이벤트 정보를 수정합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">이벤트 제목</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">상세 설명</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-ticketType">이벤트 유형</Label>
              <Select
                value={formData.ticketType}
                onValueChange={(value) => setFormData({ ...formData, ticketType: value })}
              >
                <SelectTrigger id="edit-ticketType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Improvement">개선</SelectItem>
                  <SelectItem value="Trouble">문제</SelectItem>
                  <SelectItem value="Change">변경</SelectItem>
                  <SelectItem value="Analysis">분석</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">우선순위</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">P1 - 긴급</SelectItem>
                  <SelectItem value="P2">P2 - 높음</SelectItem>
                  <SelectItem value="P3">P3 - 보통</SelectItem>
                  <SelectItem value="P4">P4 - 낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-impact">영향 범위</Label>
              <Select value={formData.impact} onValueChange={(value) => setFormData({ ...formData, impact: value })}>
                <SelectTrigger id="edit-impact">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Safety">안전</SelectItem>
                  <SelectItem value="Quality">품질</SelectItem>
                  <SelectItem value="Throughput">처리량</SelectItem>
                  <SelectItem value="Cost">비용</SelectItem>
                  <SelectItem value="Energy">에너지</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-owner">담당자</Label>
              <Input
                id="edit-owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-dueDate">마감일</Label>
            <Input
              id="edit-dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="edit-accessLevel" className="text-base font-semibold">
                접근 권한
              </Label>
              <Select
                value={formData.accessLevel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    accessLevel: value,
                    allowedTeams: value === "Team" ? formData.allowedTeams : [],
                  })
                }
              >
                <SelectTrigger id="edit-accessLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private">비공개 - 나만 보기</SelectItem>
                  <SelectItem value="Team">팀 - 특정 팀</SelectItem>
                  <SelectItem value="Public">공개 - 모두</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.accessLevel === "Team" && (
              <div className="space-y-3">
                <Label className="text-sm">접근 가능한 팀 선택</Label>
                <div className="space-y-2">
                  {availableTeams.map((team) => (
                    <div key={team} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${team}`}
                        checked={formData.allowedTeams.includes(team)}
                        onCheckedChange={() => toggleTeam(team)}
                      />
                      <label
                        htmlFor={`edit-${team}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {team}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
