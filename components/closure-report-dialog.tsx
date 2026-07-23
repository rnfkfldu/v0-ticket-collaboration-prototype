"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sparkles,
  FileText,
  Loader2,
  CheckCircle,
  Send,
  Pencil,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// 종료 Report 필요 여부 판단 로직
export function requiresClosureReport(params: {
  type: "ticket" | "worklist"
  // 이벤트용
  ticketType?: string
  priority?: string
  impact?: string
  workPackageCount?: number
  // 워크리스트용
  worklistPriority?: string
  worklistCategory?: string
  linkedTicketCount?: number
}): { required: boolean; reason: string } {
  if (params.type === "ticket") {
    // P1/P2 이벤트은 반드시 리포트 필요
    if (params.priority === "P1" || params.priority === "P2") {
      return { required: true, reason: "고우선순위(P1/P2) 이벤트은 종료 리포트가 필수입니다." }
    }
    // Trouble 유형은 반드시 리포트 필요
    if (params.ticketType === "Trouble") {
      return { required: true, reason: "Troubleshooting 이벤트은 원인 분석 및 재발 방지를 위해 종료 리포트가 필수입니다." }
    }
    // ProcessTest 유형은 반드시 리포트 필요
    if (params.ticketType === "ProcessTest") {
      return { required: true, reason: "실공정 테스트 결과 자산화를 위해 종료 리포트가 필수입니다." }
    }
    // Safety/Quality impact는 반드시 리포트 필요
    if (params.impact === "Safety" || params.impact === "Quality") {
      return { required: true, reason: "안전/품질 영향 이벤트은 종료 리포트가 필수입니다." }
    }
    // WP가 3개 이상이면 리포트 필요
    if ((params.workPackageCount || 0) >= 3) {
      return { required: true, reason: "3개 이상의 Work Package가 포함된 이벤트은 종료 리포트가 필수입니다." }
    }
    return { required: false, reason: "" }
  }

  // 워크리스트용 판단
  if (params.type === "worklist") {
    if (params.worklistPriority === "critical" || params.worklistPriority === "high") {
      return { required: true, reason: "Critical/High 등급 워크리스트는 종결 리포트가 필수입니다." }
    }
    if (params.worklistCategory === "Catalyst" || params.worklistCategory === "Vessel Internal") {
      return { required: true, reason: "촉매/내부구조물 관련 항목은 종결 리포트가 필수입니다." }
    }
    if ((params.linkedTicketCount || 0) >= 2) {
      return { required: true, reason: "2개 이상의 이벤트이 연결된 워크리스트는 종결 리포트가 필수입니다." }
    }
    return { required: false, reason: "" }
  }

  return { required: false, reason: "" }
}

// GenAI 요약 생성 시뮬레이션
function generateAIReport(params: {
  title: string
  description: string
  type: "ticket" | "worklist"
  ticketType?: string
  linkedTickets?: { id: string; title: string }[]
  workPackages?: string[]
}) {
  const ticketSection = params.linkedTickets && params.linkedTickets.length > 0
    ? `\n\n[관련 이벤트]\n${params.linkedTickets.map(t => `- #${t.id}: ${t.title}`).join("\n")}`
    : ""

  const wpSection = params.workPackages && params.workPackages.length > 0
    ? `\n\n[수행 Work Packages]\n${params.workPackages.map((w, i) => `${i + 1}. ${w}`).join("\n")}`
    : ""

  return {
    summary: `${params.title}에 대한 종합 분석 결과, 초기 목표 대비 성과를 달성하였으며 공정 안정성이 확보되었습니다.${ticketSection}${wpSection}`,
    background: `${params.description}\n\n본 건은 공정 운전 최적화 및 설비 신뢰성 향상을 위해 추진되었습니다.`,
    actions: `1. 초기 현상 분석 및 원인 규명 완료\n2. 개선 방안 수립 및 실행\n3. 효과 검증 및 안정화 확인\n4. 관련 운전 가이드 업데이트`,
    results: `- 주요 KPI 달성률: 목표 대비 95% 이상\n- 공정 안정성: 개선 전 대비 향상\n- 부가 효과: 에너지 절감 및 운전 편의성 개선`,
    lessons: `- 향후 유사 이슈 발생 시 조기 대응 체계 구축 필요\n- 정기적인 모니터링을 통한 예방 정비 강화\n- 관련 운전 절차서 반영 완료`,
    recommendations: `- 후속 모니터링 기간: 3개월\n- 정기 점검 주기: 월 1회\n- 관련 교육 대상: 운전팀 전원`,
  }
}

interface ClosureReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  type: "ticket" | "worklist"
  ticketType?: string
  linkedTickets?: { id: string; title: string }[]
  workPackages?: string[]
  teamOpinions?: { team: string; reviewer: string; opinion: string }[]
  onSubmit: (report: ClosureReport) => void
}

export interface ClosureReport {
  id: string
  title: string
  sourceType: "ticket" | "worklist"
  sourceId: string
  summary: string
  background: string
  actions: string
  results: string
  lessons: string
  recommendations: string
  teamOpinions?: { team: string; reviewer: string; opinion: string }[]
  status: "draft" | "pending-approval" | "approved" | "rejected"
  createdDate: string
  author: string
  approver?: string
  approvedDate?: string
}

export function ClosureReportDialog({
  open,
  onOpenChange,
  title,
  description,
  type,
  ticketType,
  linkedTickets,
  workPackages,
  teamOpinions,
  onSubmit,
}: ClosureReportDialogProps) {
  const [step, setStep] = useState<"generating" | "editing" | "preview">("generating")
  const [isGenerating, setIsGenerating] = useState(false)

  const [reportTitle, setReportTitle] = useState(`${title} - 종료 Report`)
  const [summary, setSummary] = useState("")
  const [background, setBackground] = useState("")
  const [actions, setActions] = useState("")
  const [results, setResults] = useState("")
  const [lessons, setLessons] = useState("")
  const [recommendations, setRecommendations] = useState("")

  const handleGenerate = () => {
    setIsGenerating(true)
    // GenAI 기반 요약 시뮬레이션 (실제 환경에서는 API 호출)
    setTimeout(() => {
      const ai = generateAIReport({ title, description, type, ticketType, linkedTickets, workPackages })
      setSummary(ai.summary)
      setBackground(ai.background)
      setActions(ai.actions)
      setResults(ai.results)
      setLessons(ai.lessons)
      setRecommendations(ai.recommendations)
      setIsGenerating(false)
      setStep("editing")
    }, 2000)
  }

  const handleRegenerate = () => {
    setStep("generating")
    handleGenerate()
  }

  const handleSubmitForApproval = () => {
    const report: ClosureReport = {
      id: `RPT-${Date.now()}`,
      title: reportTitle,
      sourceType: type,
      sourceId: title,
      summary,
      background,
      actions,
      results,
      lessons,
      recommendations,
      teamOpinions: teamOpinions || [],
      status: "pending-approval",
      createdDate: new Date().toISOString().split("T")[0],
      author: "김지수",
    }
    onSubmit(report)
    // Reset state
    setStep("generating")
    setSummary("")
    setBackground("")
    setActions("")
    setResults("")
    setLessons("")
    setRecommendations("")
  }

  // Auto-generate when dialog opens
  useEffect(() => {
    if (open && step === "generating" && !isGenerating) {
      handleGenerate()
    }
    if (!open) {
      // Reset on close
      setStep("generating")
      setIsGenerating(false)
      setSummary("")
      setBackground("")
      setActions("")
      setResults("")
      setLessons("")
      setRecommendations("")
      setReportTitle(`${title} - 종료 Report`)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            종료 Report 작성
          </DialogTitle>
          <DialogDescription>
            GenAI가 관련 내용을 분석하여 리포트 초안을 생성합니다. 내용을 검토/수정한 후 결재를 올려주세요.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {["AI 생성", "검토/수정", "미리보기"].map((label, i) => {
            const stepIndex = i === 0 ? "generating" : i === 1 ? "editing" : "preview"
            const isActive = step === stepIndex
            const isDone = (step === "editing" && i === 0) || (step === "preview" && i <= 1)
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={cn("h-px w-8", isDone || isActive ? "bg-primary" : "bg-border")} />}
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                  isActive ? "bg-primary text-primary-foreground" :
                  isDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {isDone ? <CheckCircle className="h-3 w-3" /> : <span className="text-xs">{i + 1}</span>}
                  {label}
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Step 1: Generating */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {isGenerating ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Sparkles className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="text-center">
              <p className="font-medium">
                {isGenerating ? "GenAI가 리포트를 생성하고 있습니다..." : "리포트 생성 준비 중"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isGenerating ? "이벤트, 워크패키지, 이력 데이터를 종합 분석 중" : "잠시만 기다려주세요"}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Editing */}
        {step === "editing" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI 초안 생성 완료</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRegenerate} className="text-xs gap-1">
                <RotateCcw className="h-3 w-3" />
                재생성
              </Button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">
                  AI가 생성한 초안입니다. 각 필드를 검토하고 필요에 따라 수정해주세요. 수정된 내용으로 조직장 승인 결재가 올라갑니다.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>리포트 제목</Label>
              <Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                요약 (Executive Summary)
              </Label>
              <Textarea value={summary} onChange={e => setSummary(e.target.value)} className="min-h-20" />
            </div>

            <div className="space-y-2">
              <Label>배경 및 목적</Label>
              <Textarea value={background} onChange={e => setBackground(e.target.value)} className="min-h-16" />
            </div>

            <div className="space-y-2">
              <Label>수행 내역</Label>
              <Textarea value={actions} onChange={e => setActions(e.target.value)} className="min-h-16" />
            </div>

            <div className="space-y-2">
              <Label>결과 및 성과</Label>
              <Textarea value={results} onChange={e => setResults(e.target.value)} className="min-h-16" />
            </div>

            <div className="space-y-2">
              <Label>교훈 (Lessons Learned)</Label>
              <Textarea value={lessons} onChange={e => setLessons(e.target.value)} className="min-h-16" />
            </div>

            <div className="space-y-2">
              <Label>후속 조치 권고</Label>
              <Textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} className="min-h-16" />
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4 py-2">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/30 p-4 border-b">
                <h3 className="font-semibold text-lg">{reportTitle}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>작성자: 김지수</span>
                  <span>작성일: {new Date().toLocaleDateString("ko-KR")}</span>
                  <Badge className="bg-amber-100 text-amber-700 text-xs">결재 대기</Badge>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {[
                  { label: "요약", content: summary },
                  { label: "배경 및 목적", content: background },
                  { label: "수행 내역", content: actions },
                  { label: "결과 및 성과", content: results },
                  { label: "교훈", content: lessons },
                  { label: "후속 조치 권고", content: recommendations },
                ].map(section => (
                  <div key={section.label}>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{section.label}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted/20 p-3 rounded">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                결재 제출 시 조직장에게 승인 요청이 전송됩니다. 승인 완료된 리포트는 Knowledge &gt; Reports에서 조직 자산으로 관리됩니다.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "editing" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">취소</Button>
              <Button onClick={() => setStep("preview")}>
                미리보기
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("editing")} className="bg-transparent">
                <Pencil className="h-4 w-4 mr-1" />
                수정
              </Button>
              <Button onClick={handleSubmitForApproval}>
                <Send className="h-4 w-4 mr-1" />
                결재 제출
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
