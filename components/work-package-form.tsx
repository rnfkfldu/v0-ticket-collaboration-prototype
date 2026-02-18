"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { WorkPackage } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface WorkPackageFormProps {
  ticketId: string
  onSave: (wp: Omit<WorkPackage, "id">) => void
  onCancel: () => void
}

export function WorkPackageForm({ ticketId, onSave, onCancel }: WorkPackageFormProps) {
  const [formData, setFormData] = useState({
    wpType: "" as WorkPackage["wpType"] | "",
    title: "",
    description: "",
    ownerTeam: "",
    assignee: "",
    status: "Not Started" as WorkPackage["status"],
    dueDate: "",
    dependency: "",
    blockageReason: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.wpType || !formData.title || !formData.ownerTeam) {
      alert("Please fill in all required fields")
      return
    }

    onSave({
      ticketId,
      wpType: formData.wpType as WorkPackage["wpType"],
      title: formData.title,
      description: formData.description,
      ownerTeam: formData.ownerTeam,
      assignee: formData.assignee,
      status: formData.status,
      dueDate: formData.dueDate,
      dependency: formData.dependency || undefined,
      blockageReason: formData.blockageReason || undefined,
    })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">워크 패키지 추가</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wpType">
              WP 유형 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.wpType}
              onValueChange={(value) => setFormData({ ...formData, wpType: value as WorkPackage["wpType"] })}
            >
              <SelectTrigger id="wpType">
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Analysis">분석</SelectItem>
                <SelectItem value="Decision">의사결정</SelectItem>
                <SelectItem value="Execution">실행</SelectItem>
                <SelectItem value="Validation">검증</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerTeam">
              담당 팀 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.ownerTeam}
              onValueChange={(value) => setFormData({ ...formData, ownerTeam: value })}
            >
              <SelectTrigger id="ownerTeam">
                <SelectValue placeholder="팀 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Process Engineering">Process Engineering</SelectItem>
                <SelectItem value="Operations Coordination">Operations Coordination</SelectItem>
                <SelectItem value="Project / Facility">Project / Facility</SelectItem>
                <SelectItem value="DX / Modeling">DX / Modeling</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="예: Heat & Material Balance 검토"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">설명</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="워크 패키지에 대한 상세 설명"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignee">담당자 (선택)</Label>
          <Input
            id="assignee"
            value={formData.assignee}
            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
            placeholder="예: 김엔지니어"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as WorkPackage["status"] })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">시작 전</SelectItem>
                <SelectItem value="In Progress">진행 중</SelectItem>
                <SelectItem value="Blocked">차단됨</SelectItem>
                <SelectItem value="Done">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">마감일</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        {formData.status === "Blocked" && (
          <div className="space-y-2">
            <Label htmlFor="blockageReason">차단 사유</Label>
            <Textarea
              id="blockageReason"
              value={formData.blockageReason}
              onChange={(e) => setFormData({ ...formData, blockageReason: e.target.value })}
              placeholder="워크 패키지가 차단된 이유 설명"
              rows={2}
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            워크 패키지 추가
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        </div>
      </form>
    </Card>
  )
}
