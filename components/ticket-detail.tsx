"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Ticket } from "@/lib/types"
import { ClosureReportDialog, requiresClosureReport } from "@/components/closure-report-dialog"
import type { ClosureReport } from "@/components/closure-report-dialog"
import { WorkPackageFlow } from "@/components/work-package-flow"
import { ProcessContextPanel } from "@/components/process-context-panel"
import { SimilarTicketsPanel } from "@/components/similar-tickets-panel"
import { DirectTicketHandlingCanvas } from "@/components/direct-ticket-handling-canvas"
import { TicketHistoryTimeline } from "@/components/ticket-history-timeline"
import { markNotificationAsRead, addInquiryToTicket, closeTicket } from "@/lib/storage"
import { Textarea } from "@/components/ui/textarea"
import { DataVisualization } from "@/components/data-visualization"
import {
  Calendar,
  User,
  Target,
  AlertCircle,
  Lock,
  Users,
  Globe,
  CheckCircle,
  FileCheck,
  RotateCcw,
  Bell,
  MessageSquarePlus,
  FileText,
} from "lucide-react"
import { useState, useEffect } from "react"
import { getTicketById, reopenTicket } from "@/lib/storage"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TicketDetailProps {
  ticket: Ticket
}

export function TicketDetail({ ticket: initialTicket }: TicketDetailProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showReopenDialog, setShowReopenDialog] = useState(false)
  const [showDirectHandling, setShowDirectHandling] = useState(ticket.status !== "Closed")
  const [showWPFlow, setShowWPFlow] = useState(false)
  const [showInquiryDialog, setShowInquiryDialog] = useState(false)
  const [inquiryContent, setInquiryContent] = useState("")
  const [showClosureReport, setShowClosureReport] = useState(false)
  const router = useRouter()

  const CURRENT_USER = "김지수"

  const refreshTicket = () => {
    const updatedTicket = getTicketById(ticket.id)
    if (updatedTicket) {
      setTicket(updatedTicket)
      if (updatedTicket.workPackages.length > 0 && !showWPFlow) {
        setShowWPFlow(true)
      }
    }
  }

  useEffect(() => {
    if (ticket.hasUnreadNotification) {
      markNotificationAsRead(ticket.id)
      refreshTicket()
    }

    const handleFocus = () => {
      refreshTicket()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [ticket.id])

  const handleClose = () => {
    // 종료 Report 필요 여부 판단
    const check = requiresClosureReport({
      type: "ticket",
      ticketType: ticket.ticketType,
      priority: ticket.priority,
      impact: ticket.impact,
      workPackageCount: ticket.workPackages.length,
    })

    setShowCloseDialog(false)

    if (check.required) {
      // Report 필요 시 ClosureReportDialog 표시
      setShowClosureReport(true)
    } else {
      // Report 불필요 시 바로 종결
      closeTicket(ticket.id)
      refreshTicket()
    }
  }

  const handleClosureReportSubmit = (report: ClosureReport) => {
    closeTicket(ticket.id)
    refreshTicket()
    setShowClosureReport(false)
    alert("종료 Report가 조직장에게 결재 요청되었습니다. 승인 후 Knowledge > Reports에서 관리됩니다.")
  }

  const handleReopen = () => {
    reopenTicket(ticket.id)
    refreshTicket()
    setShowReopenDialog(false)
  }

  const handleDirectHandlingSuccess = () => {
    setShowDirectHandling(false)
    refreshTicket()
  }

  const handleEnableWPMode = () => {
    setShowDirectHandling(false)
    setShowWPFlow(true)
  }

  const handleConvertToDirectHandling = () => {
    setShowWPFlow(false)
    setShowDirectHandling(true)
  }

  const handleConvertToWP = () => {
    refreshTicket()
    setShowDirectHandling(false)
    setShowWPFlow(true)
  }

  const handleInquiry = () => {
    if (!inquiryContent.trim()) {
      alert("문의 내용을 입력해주세요")
      return
    }

    addInquiryToTicket(ticket.id, inquiryContent, CURRENT_USER)
    setInquiryContent("")
    setShowInquiryDialog(false)
    refreshTicket()
    alert("추가 문의가 전송되었습니다")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P1":
        return "bg-status-execution text-status-execution-foreground"
      case "P2":
        return "bg-status-decision text-status-decision-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-status-analysis text-status-analysis-foreground"
      case "In Progress":
        return "bg-status-decision text-status-decision-foreground"
      case "Blocked":
        return "bg-status-execution text-status-execution-foreground"
      case "Closed":
        return "bg-status-validation text-status-validation-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getAccessIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case "Private":
        return <Lock className="h-4 w-4" />
      case "Team":
        return <Users className="h-4 w-4" />
      case "Public":
        return <Globe className="h-4 w-4" />
      default:
        return null
    }
  }

  const canClose =
    ticket.workPackages.length > 0 &&
    ticket.workPackages.every((wp) => wp.status === "Done") &&
    ticket.status !== "Closed"

  const canDirectHandle = ticket.workPackages.length === 0 && ticket.status !== "Closed"
  const isClosed = ticket.status === "Closed"
  const isRequester = ticket.requester === CURRENT_USER

  return (
    <div className="space-y-6">
      {ticket.hasUnreadNotification && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Bell className="h-4 w-4" />
            <p className="text-sm font-medium">새로운 의견이 도착했습니다</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-foreground mb-2">{ticket.title}</h2>
              <p className="text-muted-foreground">{ticket.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">담당자</p>
                <p className="text-sm font-medium text-foreground">{ticket.owner}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">영향 범위</p>
                <p className="text-sm font-medium text-foreground">{ticket.impact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">유형</p>
                <p className="text-sm font-medium text-foreground">{ticket.ticketType}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">마감일</p>
                <p className="text-sm font-medium text-foreground">{ticket.dueDate}</p>
              </div>
            </div>
          </div>

          {ticket.context && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-2">컨텍스트</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Unit: {ticket.context.unit}</Badge>
                {ticket.context.area && <Badge variant="outline">Area: {ticket.context.area}</Badge>}
                {ticket.context.equipment && <Badge variant="outline">장치: {ticket.context.equipment}</Badge>}
                {ticket.context.tags && ticket.context.tags.length > 0 && (
                  <>
                    {ticket.context.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        Tag: {tag}
                      </Badge>
                    ))}
                  </>
                )}
                {ticket.context.timeRange && <Badge variant="outline">Time: {ticket.context.timeRange}</Badge>}
              </div>

              {ticket.additionalDetails && (
                <div className="mt-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent w-full">
                        <FileText className="h-4 w-4" />
                        추가 설명 확인
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>추가 설명 정보</DialogTitle>
                        <DialogDescription>티켓 생성자가 입력한 추가 설명 및 참조 데이터입니다.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {ticket.additionalDetails.text && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">설명</h4>
                            <div className="bg-muted/30 p-4 rounded whitespace-pre-wrap text-sm">
                              {ticket.additionalDetails.text}
                            </div>
                          </div>
                        )}
                        {ticket.additionalDetails.dataBoxes && ticket.additionalDetails.dataBoxes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">참조 데이터</h4>
                            <div className="space-y-4">
                              {ticket.additionalDetails.dataBoxes.map((box) => (
                                <DataVisualization key={box.id} dataBox={box} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-2">접근 권한</h3>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-2">
                {getAccessIcon(ticket.accessLevel)}
                <span>{ticket.accessLevel}</span>
              </Badge>
              {ticket.accessLevel === "Team" && ticket.allowedTeams && ticket.allowedTeams.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">팀:</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.allowedTeams.map((team) => (
                      <Badge key={team} variant="secondary" className="text-xs">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <ProcessContextPanel ticket={ticket} />
      </div>

      <SimilarTicketsPanel ticket={ticket} />

      {ticket.messages && ticket.messages.length > 0 && <TicketHistoryTimeline messages={ticket.messages} />}

      <div className="space-y-4">
        {!isClosed && (
          <>
            {showDirectHandling && (
              <DirectTicketHandlingCanvas
                ticketId={ticket.id}
                ticketCategory={ticket.ticketType}
                ticketUnit={ticket.context?.unit}
                currentUser={CURRENT_USER}
                onCancel={() => setShowDirectHandling(false)}
                onSuccess={handleDirectHandlingSuccess}
                onConvertToWP={handleConvertToWP}
              />
            )}

            {showWPFlow && (
              <>
                <WorkPackageFlow ticket={ticket} onUpdate={refreshTicket} />
                <Card className="p-4 bg-muted/30">
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" className="gap-2 bg-transparent" onClick={handleConvertToDirectHandling}>
                      <FileCheck className="h-4 w-4" />
                      직접 처리로 전환
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </>
        )}

        {isRequester && ticket.status === "In Progress" && ticket.messages && ticket.messages.length > 0 && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800 mb-3">담당자의 의견을 확인하셨습니까?</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" className="gap-2 bg-white" onClick={() => setShowInquiryDialog(true)}>
                <MessageSquarePlus className="h-4 w-4" />
                추가 문의
              </Button>
            </div>
          </Card>
        )}

        {!isClosed && (
          <Card className="p-4 bg-muted/30">
            <div className="flex gap-2 justify-center">
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowInquiryDialog(true)}>
                <MessageSquarePlus className="h-4 w-4" />
                의견보내기
              </Button>
              <Button variant="default" className="gap-2" onClick={() => setShowCloseDialog(true)}>
                <CheckCircle className="h-4 w-4" />
                종결
              </Button>
            </div>
          </Card>
        )}

        {isClosed && (
          <>
            {ticket.workPackages.length > 0 && <WorkPackageFlow ticket={ticket} onUpdate={refreshTicket} readOnly />}

            {ticket.executiveSummary && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">완료 보고서</h3>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-line text-sm text-muted-foreground bg-muted/30 p-4 rounded">
                    {ticket.executiveSummary}
                  </div>
                </div>
                {ticket.closedDate && (
                  <p className="text-xs text-muted-foreground mt-4">
                    완료일: {new Date(ticket.closedDate).toLocaleDateString("ko-KR")}
                  </p>
                )}
              </Card>
            )}

            <Card className="p-4 bg-muted/30">
              <div className="flex gap-2 justify-center">
                <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowReopenDialog(true)}>
                  <RotateCcw className="h-4 w-4" />
                  티켓 재오픈
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>티켓 종결</AlertDialogTitle>
            <AlertDialogDescription>
              티켓을 종결 처리합니다. 티켓 유형 및 중요도에 따라 종료 Report 작성이 요구될 수 있습니다. 진행하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>진행</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Closure Report Dialog */}
      <ClosureReportDialog
        open={showClosureReport}
        onOpenChange={setShowClosureReport}
        title={ticket.title}
        description={ticket.description}
        type="ticket"
        ticketType={ticket.ticketType}
        workPackages={ticket.workPackages.map(wp => wp.title)}
        onSubmit={handleClosureReportSubmit}
      />

      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>티켓 재오픈</AlertDialogTitle>
            <AlertDialogDescription>
              완료된 티켓을 다시 열겠습니까? 기존 완료 보고서는 참고용으로 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopen}>재오픈</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>추가 문의</AlertDialogTitle>
            <AlertDialogDescription>추가로 필요한 정보나 수정 사항을 입력해주세요</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={inquiryContent}
              onChange={(e) => setInquiryContent(e.target.value)}
              placeholder="추가 문의 내용을 입력해주세요..."
              className="min-h-[150px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleInquiry}>전송</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
