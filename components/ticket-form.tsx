"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveTicket, addWorkPackageToTicket } from "@/lib/storage"
import { Checkbox } from "@/components/ui/checkbox"
import { X, PlusCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { DataInsertBox } from "@/lib/types"
import { DataInsertBoxConfig } from "@/components/data-insert-box-config"
import { DataVisualization } from "@/components/data-visualization"
import { UNIT_OWNERS, AVAILABLE_TAGS } from "@/lib/process-data"

export function TicketForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ticketType: "Improvement",
    priority: "P3",
    unit: "VDU",
    area: "",
    equipment: "", // Added equipment field
    tags: [] as string[],
    tagInput: "",
    fromTime: "",
    toTime: "",
    impact: "Throughput",
    owner: UNIT_OWNERS["VDU"] || "", // Auto-populate owner based on unit
    dueDate: "", // Added dueDate field
    accessLevel: "Team",
    allowedTeams: [] as string[],
  })

  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false)
  const [additionalContent, setAdditionalContent] = useState("")
  const [additionalDataBoxes, setAdditionalDataBoxes] = useState<DataInsertBox[]>([])
  const [showDataBoxConfig, setShowDataBoxConfig] = useState(false)
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string }[]>([])

  const availableTeams = ["Engineering", "Operations", "Maintenance", "QA", "Management"]

  const toggleTeam = (team: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedTeams: prev.allowedTeams.includes(team)
        ? prev.allowedTeams.filter((t) => t !== team)
        : [...prev.allowedTeams, team],
    }))
  }

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: "",
      })
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  const handleAddDataBox = (box: Omit<DataInsertBox, "id">) => {
    const newBox: DataInsertBox = {
      ...box,
      id: `box-${Date.now()}`,
    }
    setAdditionalDataBoxes([...additionalDataBoxes, newBox])
    setShowDataBoxConfig(false)
  }

  const handleRemoveDataBox = (id: string) => {
    setAdditionalDataBoxes(additionalDataBoxes.filter((box) => box.id !== id))
  }

  const handleTableDataChange = (boxId: string, data: string[][]) => {
    setAdditionalDataBoxes(
      additionalDataBoxes.map((box) =>
        box.id === boxId ? { ...box, config: { ...box.config, tableData: data } } : box,
      ),
    )
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newAttachments = Array.from(files).map((file) => ({
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
      }))
      setAttachments([...attachments, ...newAttachments])
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const getBoxTypeLabel = (type: string) => {
    switch (type) {
      case "trend":
        return "트렌드 그래프"
      case "dcs":
        return "DCS 화면"
      case "table":
        return "데이터 테이블"
      default:
        return type
    }
  }

  const handleUnitChange = (value: string) => {
    setFormData({
      ...formData,
      unit: value,
      owner: UNIT_OWNERS[value] || "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let finalDescription = formData.description
    if (showAdditionalDetails && (additionalContent || additionalDataBoxes.length > 0 || attachments.length > 0)) {
      finalDescription += "\n\n### 추가 설명\n" + additionalContent
      if (additionalDataBoxes.length > 0) {
        finalDescription +=
          "\n\n#### 참조 데이터\n" +
          additionalDataBoxes
            .map(
              (box) =>
                `- ${box.config.title || getBoxTypeLabel(box.type)}: ${box.config.tags?.join(", ") || box.config.graphicNumber || "테이블"}`,
            )
            .join("\n")
      }
      if (attachments.length > 0) {
        finalDescription += "\n\n#### 첨부 파일\n" + attachments.map((att) => `- ${att.fileName}`).join("\n")
      }
    }

    const newTicket = {
      id: Date.now().toString(),
      title: formData.title,
      description: finalDescription,
      ticketType: formData.ticketType as "Improvement" | "Trouble" | "Change" | "Analysis",
      priority: formData.priority as "P1" | "P2" | "P3" | "P4",
      impact: formData.impact as "Safety" | "Quality" | "Throughput" | "Cost" | "Energy",
      owner: formData.owner || "미배정",
      status: "Open" as const,
      createdDate: new Date().toISOString().split("T")[0],
      dueDate: formData.dueDate, // Include dueDate
      bottleneck: "시작 전",
      accessLevel: formData.accessLevel as "Private" | "Team" | "Public",
      allowedTeams: formData.accessLevel === "Team" ? formData.allowedTeams : undefined,
      unit: formData.unit,
      area: formData.area || undefined,
      equipment: formData.equipment || undefined, // Include equipment
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      fromTime: formData.fromTime || undefined,
      toTime: formData.toTime || undefined,
      context: {
        unit: formData.unit,
        area: formData.area || undefined,
        equipment: formData.equipment || undefined, // Include equipment in context
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      },
      workPackages: [],
      additionalDetails:
        showAdditionalDetails && (additionalContent || additionalDataBoxes.length > 0)
          ? {
              text: additionalContent,
              dataBoxes: additionalDataBoxes,
            }
          : undefined,
    }

    saveTicket(newTicket)

    const defaultWorkPackages = [
      {
        ticketId: newTicket.id,
        wpType: "Analysis" as const,
        title: "현상 분석",
        description: "문제 또는 개선사항에 대한 근본 원인 및 데이터 분석",
        ownerTeam: "Process Engineering",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Decision" as const,
        title: "의사결정",
        description: "분석 결과를 바탕으로 실행 방안 결정",
        ownerTeam: "Operations Coordination",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Execution" as const,
        title: "실행",
        description: "결정된 방안의 실제 실행 및 구현",
        ownerTeam: "Project / Facility",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Validation" as const,
        title: "검증",
        description: "실행 결과의 효과성 검증 및 모니터링",
        ownerTeam: "DX / Modeling",
        status: "Not Started" as const,
        dueDate: "",
      },
    ]

    defaultWorkPackages.forEach((wp) => {
      addWorkPackageToTicket(newTicket.id, wp)
    })

    router.push("/")
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">이벤트 제목</Label>
          <Input
            id="title"
            placeholder="문제 또는 개선사항에 대한 간략한 설명"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">상세 설명</Label>
          <Textarea
            id="description"
            placeholder="이벤트에 대한 상세 설명"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
            className="w-full"
          >
            {showAdditionalDetails ? "추가 설명 숨기기" : "추가 설명 기입"}
          </Button>

          {showAdditionalDetails && (
            <Card className="p-4 space-y-4 bg-muted/30">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">참조 데이터</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    onClick={() => setShowDataBoxConfig(true)}
                  >
                    <PlusCircle className="h-3 w-3" />
                    데이터 삽입
                  </Button>
                </div>

                {additionalDataBoxes.length > 0 && (
                  <div className="space-y-3">
                    {additionalDataBoxes.map((box) => (
                      <Card key={box.id} className="p-4 bg-background border-border relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveDataBox(box.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="mb-3">
                          <p className="text-sm font-medium">{box.config.title || getBoxTypeLabel(box.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {box.type === "trend" && box.config.tags?.join(", ")}
                            {box.type === "dcs" && `${box.config.unit} - ${box.config.graphicNumber}`}
                            {box.type === "table" && `${box.config.rows}행 x ${box.config.columns}열`}
                          </p>
                        </div>
                        <DataVisualization
                          dataBox={box}
                          onTableDataChange={(data) => handleTableDataChange(box.id, data)}
                        />
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <label htmlFor="additional-file-upload" className="flex-1">
                    <Button type="button" variant="outline" size="sm" className="w-full gap-2 bg-transparent" asChild>
                      <span>
                        <PlusCircle className="h-4 w-4" />
                        파일 첨부
                      </span>
                    </Button>
                  </label>
                  <Input
                    id="additional-file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                        <span className="text-sm truncate flex-1">{att.fileName}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveAttachment(index)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Textarea
                placeholder="추가 설명을 입력하세요..."
                value={additionalContent}
                onChange={(e) => setAdditionalContent(e.target.value)}
                rows={6}
              />
            </Card>
          )}
        </div>

        <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">공정 정보</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={handleUnitChange}>
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDU">CDU</SelectItem>
                  <SelectItem value="VDU">VDU</SelectItem>
                  <SelectItem value="HCR">HCR</SelectItem>
                  <SelectItem value="CCR">CCR</SelectItem>
                  <SelectItem value="DHT">DHT</SelectItem>
                  <SelectItem value="NHT">NHT</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area (선택사항)</Label>
              <Input
                id="area"
                placeholder="예: Furnace section, Reactor zone"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment">장치명 (선택사항)</Label>
            <Input
              id="equipment"
              placeholder="예: Furnace-101, Reactor-A"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">태그</Label>
            <div className="flex gap-2">
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !formData.tags.includes(value)) {
                    setFormData({
                      ...formData,
                      tags: [...formData.tags, value],
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="태그 선택" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TAGS[formData.unit]?.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:bg-muted rounded-full">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromTime">시작 시간</Label>
              <Input
                id="fromTime"
                type="datetime-local"
                value={formData.fromTime}
                onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toTime">종료 시간</Label>
              <Input
                id="toTime"
                type="datetime-local"
                value={formData.toTime}
                onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ticketType">이벤트 유형</Label>
            <Select
              value={formData.ticketType}
              onValueChange={(value) => setFormData({ ...formData, ticketType: value })}
            >
              <SelectTrigger id="ticketType">
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
            <Label htmlFor="priority">우선순위</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger id="priority">
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
            <Label htmlFor="impact">영향 범위</Label>
            <Select value={formData.impact} onValueChange={(value) => setFormData({ ...formData, impact: value })}>
              <SelectTrigger id="impact">
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
            <Label htmlFor="dueDate">희망 마감일</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner">담당자</Label>
          <Input
            id="owner"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Unit 선택 시 자동 설정됩니다</p>
        </div>

        <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label htmlFor="accessLevel" className="text-base font-semibold">
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
              <SelectTrigger id="accessLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">비공개 - 나만 보기</SelectItem>
                <SelectItem value="Team">팀 - 특정 팀</SelectItem>
                <SelectItem value="Public">공개 - 모두</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.accessLevel === "Private" && "나만 이 이벤트을 보고 편집할 수 있습니다"}
              {formData.accessLevel === "Team" && "선택된 팀이 이 이벤트을 보고 협업할 수 있습니다"}
              {formData.accessLevel === "Public" && "모든 팀이 이 이벤트을 보고 협업할 수 있습니다"}
            </p>
          </div>

          {formData.accessLevel === "Team" && (
            <div className="space-y-3">
              <Label className="text-sm">접근 가능한 팀 선택</Label>
              <div className="space-y-2">
                {availableTeams.map((team) => (
                  <div key={team} className="flex items-center space-x-2">
                    <Checkbox
                      id={team}
                      checked={formData.allowedTeams.includes(team)}
                      onCheckedChange={() => toggleTeam(team)}
                    />
                    <label
                      htmlFor={team}
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

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            이벤트 생성
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/")}>
            취소
          </Button>
        </div>
      </form>

      {showDataBoxConfig && (
        <DataInsertBoxConfig
          onConfirm={handleAddDataBox}
          onCancel={() => setShowDataBoxConfig(false)}
          defaultUnit={formData.unit}
        />
      )}
    </Card>
  )
}
