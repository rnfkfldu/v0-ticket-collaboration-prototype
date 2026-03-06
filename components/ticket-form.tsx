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
import { X, PlusCircle, Trash2, Shield, Users, Globe, Lock, UserPlus, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { DataInsertBox } from "@/lib/types"
import { DataInsertBoxConfig } from "@/components/data-insert-box-config"
import { DataVisualization } from "@/components/data-visualization"
import { UNIT_OWNERS, AVAILABLE_TAGS } from "@/lib/process-data"
import { cn } from "@/lib/utils"

// 우선순위 자동 판정 로직
function autoDeterminePriority(unit: string, equipment: string): { priority: string; label: string; reason: string } {
  // Safety-critical units or reactor equipment -> P1
  if (unit === "HCR" && equipment.toLowerCase().includes("reactor")) {
    return { priority: "P1", label: "P1 - 긴급", reason: "HCR Reactor 관련 → Safety Critical" }
  }
  // Reactor-related
  if (["HCR", "CCR"].includes(unit)) {
    return { priority: "P2", label: "P2 - 높음", reason: `${unit} Unit → 공정 영향도 높음` }
  }
  // Main distillation
  if (["CDU", "VDU"].includes(unit)) {
    return { priority: "P2", label: "P2 - 높음", reason: `${unit} Unit → 처리량 직접 영향` }
  }
  return { priority: "P3", label: "P3 - 보통", reason: "일반 공정 기술검토" }
}

// 이벤트 유형 자동 판정 (제목과 설명 기반)
function autoMapEventType(unit: string, title: string, description: string): { type: string; impact: string } {
  const text = (title + " " + description).toLowerCase()
  
  // 키워드 기반 유형 판정
  const troubleKeywords = ["문제", "이상", "고장", "불량", "오류", "에러", "트러블", "trouble", "alarm", "알람", "비정상", "누출", "leak"]
  const changeKeywords = ["변경", "교체", "수정", "업데이트", "change", "update", "modification"]
  const analysisKeywords = ["분석", "검토", "조사", "원인", "analysis", "investigate", "review"]
  
  const hasTrouble = troubleKeywords.some(k => text.includes(k))
  const hasChange = changeKeywords.some(k => text.includes(k))
  const hasAnalysis = analysisKeywords.some(k => text.includes(k))
  
  // 우선순위: Trouble > Change > Analysis > Improvement
  let type = "Improvement"
  if (hasTrouble) type = "Trouble"
  else if (hasChange) type = "Change"
  else if (hasAnalysis) type = "Analysis"
  
  // 영향 범위도 유닛과 키워드 기반으로 판정
  let impact = "Cost"
  if (["HCR", "CCR"].includes(unit) || text.includes("안전") || text.includes("safety")) {
    impact = "Safety"
  } else if (["CDU", "VDU"].includes(unit) || text.includes("처리량") || text.includes("throughput")) {
    impact = "Throughput"
  } else if (text.includes("품질") || text.includes("quality")) {
    impact = "Quality"
  } else if (text.includes("에너지") || text.includes("energy")) {
    impact = "Energy"
  }
  
  return { type, impact }
}

const IMPACT_LABELS: Record<string, string> = {
  Safety: "안전", Quality: "품질", Throughput: "처리량", Cost: "비용", Energy: "에너지",
}
const TYPE_LABELS: Record<string, string> = {
  Improvement: "개선", Trouble: "문제", Change: "변경", Analysis: "분석",
}

export function TicketForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ticketType: "Improvement",
    priority: "P3",
    unit: "VDU",
    area: "",
    equipment: "",
    tags: [] as string[],
    tagInput: "",
    timePeriods: [{ from: "", to: "" }] as { from: string; to: string }[],
    impact: "Throughput",
    owner: UNIT_OWNERS["VDU"] || "",
  })

  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false)
  const [additionalContent, setAdditionalContent] = useState("")
  const [additionalDataBoxes, setAdditionalDataBoxes] = useState<DataInsertBox[]>([])
  const [showDataBoxConfig, setShowDataBoxConfig] = useState(false)
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string }[]>([])

  // Access control state
  const [showAccessSettings, setShowAccessSettings] = useState(false)
  const [accessLevel, setAccessLevel] = useState<"Private" | "Team" | "Public">("Private")
  const [allowedTeams, setAllowedTeams] = useState<string[]>([])
  const [allowedUsers, setAllowedUsers] = useState<string[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  
  // Available teams and users for selection
  const AVAILABLE_TEAMS = [
    { id: "proc-eng", name: "공정기술팀" },
    { id: "maint", name: "장치기술팀" },
    { id: "ops", name: "운전팀" },
    { id: "safety", name: "안전환경팀" },
    { id: "dx", name: "DX팀" },
    { id: "quality", name: "품질관리팀" },
  ]
  
  const AVAILABLE_USERS = [
    { id: "user-1", name: "김철수", team: "공정기술팀", role: "팀원" },
    { id: "user-2", name: "박영희", team: "공정기술팀", role: "팀장" },
    { id: "user-3", name: "이민호", team: "장치기술팀", role: "팀원" },
    { id: "user-4", name: "정수민", team: "장치기술팀", role: "팀장" },
    { id: "user-5", name: "최지은", team: "운전팀", role: "팀원" },
    { id: "user-6", name: "강동원", team: "운전팀", role: "팀장" },
    { id: "user-7", name: "한소희", team: "안전환경팀", role: "팀원" },
    { id: "user-8", name: "유재석", team: "DX팀", role: "팀장" },
  ]

  // Auto-determined values
  const autoPriority = autoDeterminePriority(formData.unit, formData.equipment)
  const autoEvent = autoMapEventType(formData.unit, formData.title, formData.description)
  const currentUser = "김철수 (Hydroprocessing기술팀)"

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

  const addTimePeriod = () => {
    setFormData({ ...formData, timePeriods: [...formData.timePeriods, { from: "", to: "" }] })
  }

  const removeTimePeriod = (index: number) => {
    if (formData.timePeriods.length <= 1) return
    setFormData({ ...formData, timePeriods: formData.timePeriods.filter((_, i) => i !== index) })
  }

  const updateTimePeriod = (index: number, field: "from" | "to", value: string) => {
    const updated = formData.timePeriods.map((tp, i) => i === index ? { ...tp, [field]: value } : tp)
    setFormData({ ...formData, timePeriods: updated })
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

    const CURRENT_USER = "김지수"
    const ticketId = `EVT-${Date.now().toString().slice(-6)}`
    const timestamp = new Date().toLocaleString("ko-KR")
    
    const newTicket = {
      id: ticketId,
      title: formData.title,
      description: finalDescription,
      ticketType: autoPriority.priority === "P1" ? "Trouble" : autoEvent.type as "Improvement" | "Trouble" | "Change" | "Analysis",
      priority: autoPriority.priority as "P1" | "P2" | "P3" | "P4",
      impact: autoEvent.impact as "Safety" | "Quality" | "Throughput" | "Cost" | "Energy",
      owner: formData.owner || "미배정",
      requester: CURRENT_USER,
      status: "Open" as const,
      createdDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      bottleneck: "시작 전",
      accessLevel: accessLevel,
      allowedTeams: accessLevel === "Team" ? allowedTeams : undefined,
      allowedUsers: allowedUsers.length > 0 ? allowedUsers : undefined,
      unit: formData.unit,
      area: formData.area || undefined,
      equipment: formData.equipment || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      fromTime: formData.timePeriods[0]?.from || undefined,
      toTime: formData.timePeriods[0]?.to || undefined,
      context: {
        unit: formData.unit,
        area: formData.area || undefined,
        equipment: formData.equipment || undefined,
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
      // 이벤트 프로세스 플로우 초기화
      processStatus: "issued" as const,
      processFlow: [
        { step: "issued" as const, label: "이벤트 발행", status: "current" as const, assignee: CURRENT_USER, team: "공정기술팀", timestamp },
        { step: "accepted" as const, label: "접수", status: "upcoming" as const },
        { step: "review" as const, label: "기술검토", status: "upcoming" as const },
        { step: "publisher-confirm" as const, label: "발행자 확인", status: "upcoming" as const },
        { step: "closed" as const, label: "종결", status: "upcoming" as const },
      ],
      messages: [
        {
          id: `msg-${Date.now()}`,
          ticketId: ticketId,
          author: CURRENT_USER,
          role: "requester" as const,
          messageType: "opinion" as const,
          content: `새로운 이벤트가 발행되었습니다: ${formData.title}`,
          timestamp: new Date().toISOString(),
        },
      ],
      opinions: [],
      comments: [],
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

    // 생성된 이벤트 상세 페이지로 이동
    router.push(`/tickets/${newTicket.id}`)
  }

return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===== ROW 1: 공정명 (필수) ===== */}
        <div className="space-y-2">
          <Label htmlFor="unit" className="flex items-center gap-1">
            <span className="text-destructive">*</span> 공정명
          </Label>
          <Select value={formData.unit} onValueChange={handleUnitChange}>
            <SelectTrigger id="unit" className="w-full max-w-xs">
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
          <p className="text-xs text-muted-foreground">
            공정 선택 시 담당자가 자동 배정됩니다: <span className="font-medium text-foreground">{formData.owner || "미배정"}</span>
          </p>
        </div>

        {/* ===== ROW 2: 제목 (필수) ===== */}
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-1">
            <span className="text-destructive">*</span> 제목
          </Label>
          <Input
            id="title"
            placeholder="기술검토 요청 제목을 입력하세요"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="text-base"
          />
        </div>

        {/* ===== ROW 3: 상세 설명 (필수) ===== */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-1">
            <span className="text-destructive">*</span> 상세 설명
          </Label>
          <Textarea
            id="description"
            placeholder="문의하고자 하는 내용을 상세히 기술해주세요. 제목과 내용을 바탕으로 이벤트 유형과 우선순위가 자동 분류됩니다."
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        {/* ===== ROW 4: 추가 설명 기입 (데이터 삽입, 첨부 등) ===== */}
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
            className="w-full"
          >
            {showAdditionalDetails ? "추가 설명 숨기기" : "추가 설명 기입 (태그/DCS 화면/데이터 삽입)"}
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
                rows={4}
              />
            </Card>
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
