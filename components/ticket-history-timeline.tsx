"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TicketMessage } from "@/lib/types"
import { User, MessageSquare, AlertCircle, CheckCircle, Boxes } from "lucide-react"
import { DataVisualization } from "@/components/data-visualization"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"

interface TicketHistoryTimelineProps {
  messages: TicketMessage[]
}

export function TicketHistoryTimeline({ messages }: TicketHistoryTimelineProps) {
  const [selectedMessage, setSelectedMessage] = useState<TicketMessage | null>(null)

  const getMessageIcon = (type: string, role: string) => {
    if (role === "system") return <AlertCircle className="h-4 w-4" />
    if (type === "opinion") return <CheckCircle className="h-4 w-4" />
    if (type === "inquiry") return <MessageSquare className="h-4 w-4" />
    if (type === "wp_assignment") return <Boxes className="h-4 w-4" />
    return <User className="h-4 w-4" />
  }

  const getMessageBgColor = (role: string) => {
    if (role === "requester") return "bg-blue-50 border-blue-200"
    if (role === "assignee") return "bg-green-50 border-green-200"
    return "bg-muted border-border"
  }

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case "opinion":
        return "의견 제출"
      case "inquiry":
        return "추가 문의"
      case "response":
        return "답변"
      case "status_change":
        return "상태 변경"
      case "wp_assignment":
        return "워크패키지 할당"
      default:
        return type
    }
  }

  const getSummary = (message: TicketMessage) => {
    const maxLength = 80
    if (message.content.length > maxLength) {
      return message.content.substring(0, maxLength) + "..."
    }
    return message.content
  }

  const sortedMessages = [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">이벤트 히스토리</h3>

      <div className="space-y-4">
        {sortedMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">아직 히스토리가 없습니다</p>
        ) : (
          sortedMessages.map((message, index) => (
            <div key={message.id} className="flex gap-4">
              {/* 타임라인 라인 */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {getMessageIcon(message.messageType, message.role)}
                </div>
                {index < sortedMessages.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
              </div>

              <div className="flex-1 pb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Card
                      className={`p-4 ${getMessageBgColor(message.role)} cursor-pointer hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm text-foreground">{message.author}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString("ko-KR")}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getMessageTypeLabel(message.messageType)}
                        </Badge>
                      </div>

                      <p className="text-sm text-foreground">{getSummary(message)}</p>

                      {(message.dataBoxes?.length || 0) > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          📊 참조 데이터 {message.dataBoxes?.length}개
                        </p>
                      )}

                      {(message.attachments?.length || 0) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📎 첨부 파일 {message.attachments?.length}개
                        </p>
                      )}
                    </Card>
                  </DialogTrigger>

                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getMessageIcon(message.messageType, message.role)}
                        {getMessageTypeLabel(message.messageType)} - {message.author}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(message.timestamp).toLocaleString("ko-KR")}
                        </p>
                        <div className="whitespace-pre-line text-sm text-foreground bg-muted/30 p-4 rounded">
                          {message.content}
                        </div>
                      </div>

                      {message.dataBoxes && message.dataBoxes.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground">첨부된 데이터:</p>
                          {message.dataBoxes.map((box) => (
                            <div key={box.id} className="border border-border rounded p-3 bg-card">
                              <p className="text-sm font-medium mb-2">{box.config.title}</p>
                              <DataVisualization box={box} onTableDataChange={() => {}} />
                            </div>
                          ))}
                        </div>
                      )}

                      {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">첨부 파일:</p>
                          {message.attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-2 text-sm text-foreground">
                              <span>📎</span>
                              <span>{att.fileName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
