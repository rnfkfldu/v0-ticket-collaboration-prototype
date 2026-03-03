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

// 이벤트 유형 자동 판정
function autoMapEventType(unit: string): { type: string; impact: string } {
  if (["HCR", "CCR"].includes(unit)) return { type: "Trouble", impact: "Safety" }
  if (["CDU", "VDU"].includes(unit)) return { type: "Improvement", impact: "Throughput" }
  return { type: "Improvement", impact: "Cost" }
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
  const autoEvent = autoMapEventType(formData.unit)
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
    const mapped = autoMapEventType(value)
    setFormData({
      ...formData,
      unit: value,
      owner: UNIT_OWNERS[value] || "",
      ticketType: mapped.type,
      impact: mapped.impact,
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

    const newTicket = {
      id: Date.now().toString(),
      title: formData.title,
      description: finalDescription,
      ticketType: autoPriority.priority === "P1" ? "Trouble" : autoEvent.type as "Improvement" | "Trouble" | "Change" | "Analysis",
      priority: autoPriority.priority as "P1" | "P2" | "P3" | "P4",
      impact: autoEvent.impact as "Safety" | "Quality" | "Throughput" | "Cost" | "Energy",
      owner: formData.owner || "미배정",
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
        {/* ===== ROW 1: 공정명(기능위치) / 설비번호 + 관련 태그 ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit" className="flex items-center gap-1">
              <span className="text-destructive">*</span> 공정명 (기능위치)
            </Label>
            <div className="flex gap-2">
              <Select value={formData.unit} onValueChange={handleUnitChange}>
                <SelectTrigger id="unit" className="flex-1">
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
              <Input
                placeholder="Area (예: Reactor Section)"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipment">설비번호</Label>
            <Input
              id="equipment"
              placeholder="입력 후 엔터.. (예: R-2001, E-101)"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">관련 태그</Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !formData.tags.includes(value)) {
                  setFormData({ ...formData, tags: [...formData.tags, value] })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="태그 선택" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TAGS[formData.unit]?.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:bg-muted rounded-full">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== ROW 2: 제목 (full width) ===== */}
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

        {/* ===== ROW 2.5: 상세 설명 (제목 바로 아래) ===== */}
        <div className="space-y-2">
          <Label htmlFor="description">상세 설명</Label>
          <Textarea
            id="description"
            placeholder="세부내용을 입력하여 주십시오."
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* ===== ROW 3: 자동 판정 영역 (우선순위, 요청자, 수신자, 유형/영향) ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 p-4 border border-border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">우선순위</Label>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs",
                autoPriority.priority === "P1" ? "bg-red-500 hover:bg-red-500" :
                autoPriority.priority === "P2" ? "bg-orange-500 hover:bg-orange-500" : "bg-blue-500 hover:bg-blue-500"
              )}>
                {autoPriority.label}
              </Badge>
              <span className="text-xs text-muted-foreground">자동판정</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">요청자</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{currentUser}</span>
              <Badge variant="outline" className="text-xs">자동</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">수신자 (담당자)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{formData.owner || "미배정"}</span>
              <Badge variant="outline" className="text-xs">자동 맵핑</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">이벤트 유형 / 영향 범위</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{TYPE_LABELS[autoEvent.type] || autoEvent.type}</Badge>
              <span className="text-xs text-muted-foreground">/</span>
              <Badge variant="secondary" className="text-xs">{IMPACT_LABELS[autoEvent.impact] || autoEvent.impact}</Badge>
              <Badge variant="outline" className="text-xs">자동</Badge>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 pt-1 border-t border-border/50">
            <p className="text-xs text-muted-foreground italic">
              {autoPriority.reason}
            </p>
          </div>
        </div>

        {/* ===== ROW 4: 발생 기간 (복수 추가/삭제 가능) ===== */}
        <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-1">
              <span className="text-destructive">*</span> 발생 기간
            </Label>
            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs bg-transparent" onClick={addTimePeriod}>
              <PlusCircle className="h-3.5 w-3.5" />
              기간 추가
            </Button>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">동일 이벤트가 여러 차례 발생한 경우 각 기간을 추가하세요</p>
          <div className="space-y-2">
            {formData.timePeriods.map((tp, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-6 shrink-0 text-center">{index + 1}</span>
                <Input
                  type="date"
                  value={tp.from}
                  onChange={(e) => updateTimePeriod(index, "from", e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm shrink-0">~</span>
                <Input
                  type="date"
                  value={tp.to}
                  onChange={(e) => updateTimePeriod(index, "to", e.target.value)}
                  className="flex-1"
                />
                {formData.timePeriods.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeTimePeriod(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {formData.timePeriods.length > 1 && (
            <p className="text-xs text-muted-foreground">
              총 {formData.timePeriods.length}개 발생 기간이 등록되었습니다
            </p>
          )}
        </div>

        {/* ===== ROW 5: 추가 설명 기입 (데이터 삽입, 첨부 등) ===== */}
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

        {/* ===== ROW 6: 접근 권한 설정 ===== */}
        <Collapsible open={showAccessSettings} onOpenChange={setShowAccessSettings}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                접근 권한 설정
                {accessLevel === "Private" && <Badge variant="secondary" className="text-xs">기본: 관련자만</Badge>}
                {accessLevel === "Team" && <Badge variant="secondary" className="text-xs">팀 공유</Badge>}
                {accessLevel === "Public" && <Badge variant="secondary" className="text-xs">전체 공개</Badge>}
              </div>
              {showAccessSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-3 p-4 space-y-4 bg-muted/30">
              <div className="space-y-3">
                <Label className="text-sm font-medium">공개 범위</Label>
                <RadioGroup value={accessLevel} onValueChange={(v) => setAccessLevel(v as "Private" | "Team" | "Public")} className="space-y-2">
                  <div className={cn("flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors", accessLevel === "Private" ? "border-primary bg-primary/5" : "hover:bg-muted/50")} onClick={() => setAccessLevel("Private")}>
                    <RadioGroupItem value="Private" id="access-private" />
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label htmlFor="access-private" className="text-sm font-medium cursor-pointer">관련자만 (기본)</Label>
                      <p className="text-xs text-muted-foreground">발행자, 담당자, 추가 검토자만 접근 가능</p>
                    </div>
                  </div>
                  <div className={cn("flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors", accessLevel === "Team" ? "border-primary bg-primary/5" : "hover:bg-muted/50")} onClick={() => setAccessLevel("Team")}>
                    <RadioGroupItem value="Team" id="access-team" />
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label htmlFor="access-team" className="text-sm font-medium cursor-pointer">팀 공유</Label>
                      <p className="text-xs text-muted-foreground">선택한 팀 전체가 열람 가능</p>
                    </div>
                  </div>
                  <div className={cn("flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors", accessLevel === "Public" ? "border-primary bg-primary/5" : "hover:bg-muted/50")} onClick={() => setAccessLevel("Public")}>
                    <RadioGroupItem value="Public" id="access-public" />
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label htmlFor="access-public" className="text-sm font-medium cursor-pointer">전체 공개</Label>
                      <p className="text-xs text-muted-foreground">모든 사용자가 열람 가능</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Team selection for Team access level */}
              {accessLevel === "Team" && (
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium">공유 대상 팀 선택</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AVAILABLE_TEAMS.map(team => (
                      <div key={team.id} className={cn("flex items-center space-x-2 rounded-lg border p-2.5 cursor-pointer transition-colors", allowedTeams.includes(team.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50")} onClick={() => {
                        if (allowedTeams.includes(team.id)) {
                          setAllowedTeams(allowedTeams.filter(t => t !== team.id))
                        } else {
                          setAllowedTeams([...allowedTeams, team.id])
                        }
                      }}>
                        <Checkbox checked={allowedTeams.includes(team.id)} />
                        <span className="text-sm">{team.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional users - always available */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">추가 접근 허용 사용자</Label>
                  <Badge variant="outline" className="text-xs">{allowedUsers.length}명 선택됨</Badge>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">공개 범위와 관계없이 특정 사용자에게 접근 권한을 부여합니다.</p>
                
                <div className="relative">
                  <Input
                    placeholder="사용자 검색..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pr-8"
                  />
                  <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                
                {userSearchQuery && (
                  <Card className="p-2 space-y-1 max-h-40 overflow-y-auto">
                    {AVAILABLE_USERS.filter(u => 
                      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      u.team.toLowerCase().includes(userSearchQuery.toLowerCase())
                    ).filter(u => !allowedUsers.includes(u.name)).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer" onClick={() => {
                        setAllowedUsers([...allowedUsers, user.name])
                        setUserSearchQuery("")
                      }}>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">{user.name[0]}</div>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.team} · {user.role}</p>
                          </div>
                        </div>
                        <PlusCircle className="h-4 w-4 text-primary" />
                      </div>
                    ))}
                  </Card>
                )}
                
                {allowedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allowedUsers.map(userName => (
                      <Badge key={userName} variant="secondary" className="text-xs flex items-center gap-1 pr-1">
                        {userName}
                        <button type="button" onClick={() => setAllowedUsers(allowedUsers.filter(u => u !== userName))} className="ml-1 hover:bg-muted rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

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
