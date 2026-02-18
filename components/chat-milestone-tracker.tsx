"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  Search, 
  FileText, 
  CheckCircle, 
  MessageSquare,
  TrendingUp,
  Users,
  Lightbulb,
  Wrench
} from "lucide-react"

interface ChatMessage {
  id: string
  author: string
  team: string
  content: string
  timestamp: string
  type: "message" | "system" | "action" | "data" | "template"
  dataAttachment?: {
    type: "trend" | "dcs"
    title: string
    config?: any
  }
  templateData?: {
    templateName: string
    templateId: string
    assignedTeam: string
    content?: string
    status: "pending" | "completed"
  }
  mentions?: string[]
}

interface Milestone {
  id: string
  type: "issue" | "analysis" | "data" | "action" | "document" | "resolution"
  title: string
  summary: string
  timestamp: string
  participants: string[]
  status: "active" | "completed" | "pending"
  messageIds: string[]
}

interface ChatMilestoneTrackerProps {
  messages: ChatMessage[]
  troubleTitle: string
  isResolved: boolean
}

export function ChatMilestoneTracker({ messages, troubleTitle, isResolved }: ChatMilestoneTrackerProps) {
  const milestones = useMemo(() => {
    const result: Milestone[] = []
    
    // 1. Issue Reported (시작)
    if (messages.length > 0) {
      result.push({
        id: "issue-reported",
        type: "issue",
        title: "이슈 보고",
        summary: troubleTitle,
        timestamp: messages[0]?.timestamp || "",
        participants: [messages[0]?.author || ""],
        status: "completed",
        messageIds: messages.slice(0, 1).map(m => m.id)
      })
    }

    // 2. 데이터 분석 (data attachment가 있는 경우)
    const dataMessages = messages.filter(m => m.type === "data")
    if (dataMessages.length > 0) {
      result.push({
        id: "data-analysis",
        type: "data",
        title: "데이터 분석",
        summary: `${dataMessages.length}개 데이터 공유`,
        timestamp: dataMessages[0].timestamp,
        participants: [...new Set(dataMessages.map(m => m.author))],
        status: "completed",
        messageIds: dataMessages.map(m => m.id)
      })
    }

    // 3. 원인 분석 토론 (특정 키워드 포함 메시지)
    const analysisKeywords = ["원인", "분석", "확인", "점검", "이유", "때문", "발생"]
    const analysisMessages = messages.filter(m => 
      m.type === "message" && analysisKeywords.some(k => m.content.includes(k))
    )
    if (analysisMessages.length > 0) {
      result.push({
        id: "cause-analysis",
        type: "analysis",
        title: "원인 분석",
        summary: `${analysisMessages.length}개 논의`,
        timestamp: analysisMessages[0].timestamp,
        participants: [...new Set(analysisMessages.map(m => m.author))],
        status: "completed",
        messageIds: analysisMessages.map(m => m.id)
      })
    }

    // 4. 문서 작성 (template 메시지가 있는 경우)
    const templateMessages = messages.filter(m => m.type === "template")
    if (templateMessages.length > 0) {
      const completedDocs = templateMessages.filter(m => m.templateData?.status === "completed")
      const pendingDocs = templateMessages.filter(m => m.templateData?.status === "pending")
      
      result.push({
        id: "documentation",
        type: "document",
        title: "문서 작성",
        summary: `완료 ${completedDocs.length}건, 대기 ${pendingDocs.length}건`,
        timestamp: templateMessages[0].timestamp,
        participants: [...new Set(templateMessages.map(m => m.templateData?.assignedTeam || ""))],
        status: pendingDocs.length > 0 ? "pending" : "completed",
        messageIds: templateMessages.map(m => m.id)
      })
    }

    // 5. 조치 계획 (특정 키워드 포함)
    const actionKeywords = ["조치", "수정", "변경", "교체", "정비", "처리", "해결"]
    const actionMessages = messages.filter(m => 
      m.type === "message" && actionKeywords.some(k => m.content.includes(k))
    )
    if (actionMessages.length > 0) {
      result.push({
        id: "action-plan",
        type: "action",
        title: "조치 계획",
        summary: `${actionMessages.length}개 조치 논의`,
        timestamp: actionMessages[0].timestamp,
        participants: [...new Set(actionMessages.map(m => m.author))],
        status: "completed",
        messageIds: actionMessages.map(m => m.id)
      })
    }

    // 6. 해결 완료
    if (isResolved) {
      const systemMsg = messages.find(m => m.type === "system" && m.content.includes("해결"))
      result.push({
        id: "resolution",
        type: "resolution",
        title: "해결 완료",
        summary: "이슈 해결됨",
        timestamp: systemMsg?.timestamp || new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        participants: [],
        status: "completed",
        messageIds: systemMsg ? [systemMsg.id] : []
      })
    }

    return result
  }, [messages, troubleTitle, isResolved])

  const getMilestoneIcon = (type: Milestone["type"]) => {
    switch (type) {
      case "issue": return AlertTriangle
      case "analysis": return Search
      case "data": return TrendingUp
      case "document": return FileText
      case "action": return Wrench
      case "resolution": return CheckCircle
      default: return MessageSquare
    }
  }

  const getMilestoneColor = (type: Milestone["type"], status: Milestone["status"]) => {
    if (status === "pending") return "bg-orange-500"
    if (status === "completed") {
      switch (type) {
        case "issue": return "bg-red-500"
        case "resolution": return "bg-green-500"
        default: return "bg-primary"
      }
    }
    return "bg-muted"
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">진행 현황</span>
      </div>
      
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-border" />
        
        {/* Milestones */}
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const Icon = getMilestoneIcon(milestone.type)
            const bgColor = getMilestoneColor(milestone.type, milestone.status)
            
            return (
              <div key={milestone.id} className="flex gap-3 relative">
                {/* Icon */}
                <div className={`w-6 h-6 rounded-full ${bgColor} flex items-center justify-center z-10 flex-shrink-0`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">{milestone.title}</span>
                    {milestone.status === "pending" && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 bg-orange-500/10 text-orange-500 border-orange-500/30">
                        진행중
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{milestone.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{milestone.timestamp}</span>
                    {milestone.participants.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {milestone.participants.slice(0, 2).join(", ")}
                          {milestone.participants.length > 2 && ` +${milestone.participants.length - 2}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Placeholder for next milestone if not resolved */}
          {!isResolved && (
            <div className="flex gap-3 relative opacity-50">
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center z-10 flex-shrink-0">
                <CheckCircle className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-muted-foreground">해결 대기</span>
                <p className="text-xs text-muted-foreground">이슈 해결 시 완료됩니다</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 pt-3 border-t">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">메시지</span>
            <span className="font-medium">{messages.filter(m => m.type === "message").length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">데이터</span>
            <span className="font-medium">{messages.filter(m => m.type === "data").length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">문서</span>
            <span className="font-medium">{messages.filter(m => m.type === "template").length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">참여자</span>
            <span className="font-medium">{new Set(messages.map(m => m.author)).size}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
