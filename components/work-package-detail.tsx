"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { WorkPackage } from "@/lib/types"
import { X, Paperclip, Send, Download } from "lucide-react"
import { useState } from "react"
import { updateWorkPackage, addLogToWorkPackage, addAttachmentToWorkPackage } from "@/lib/storage"

interface WorkPackageDetailProps {
  workPackage: WorkPackage
  onClose: () => void
  onUpdate?: () => void
  readOnly?: boolean // 읽기 전용 모드 추가
}

export function WorkPackageDetail({ workPackage, onClose, onUpdate, readOnly = false }: WorkPackageDetailProps) {
  const [status, setStatus] = useState(workPackage.status)
  const [blockageReason, setBlockageReason] = useState(workPackage.blockageReason || "")
  const [assignee, setAssignee] = useState(workPackage.assignee || "")
  const [logContent, setLogContent] = useState("")
  const [logAuthor, setLogAuthor] = useState("")

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Analysis":
        return "bg-status-analysis text-status-analysis-foreground"
      case "Decision":
        return "bg-status-decision text-status-decision-foreground"
      case "Execution":
        return "bg-status-execution text-status-execution-foreground"
      case "Validation":
        return "bg-status-validation text-status-validation-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleSave = () => {
    if (readOnly) return
    updateWorkPackage(workPackage.ticketId, workPackage.id, {
      status,
      assignee,
      blockageReason: status === "Blocked" ? blockageReason : undefined,
    })
    if (onUpdate) {
      onUpdate()
    }
    onClose()
  }

  const handleAddLog = () => {
    if (readOnly) return
    if (!logContent.trim() || !logAuthor.trim()) return

    addLogToWorkPackage(workPackage.ticketId, workPackage.id, {
      author: logAuthor,
      content: logContent,
    })

    setLogContent("")
    setLogAuthor("")
    if (onUpdate) {
      onUpdate()
    }

    alert(`${workPackage.wpType} 워크패키지에 의견이 추가되었으며, 알람이 발송되었습니다.`)
  }

  const handleFileAttach = () => {
    if (readOnly) return
    const fileName = prompt("파일명 입력:")
    if (!fileName) return

    const uploader = prompt("작성자 이름:")
    if (!uploader) return

    addAttachmentToWorkPackage(workPackage.ticketId, workPackage.id, {
      fileName,
      fileUrl: `#file-${Date.now()}`,
      uploadedBy: uploader,
    })

    if (onUpdate) {
      onUpdate()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const wpTypeKorean: Record<string, string> = {
    Analysis: "분석",
    Decision: "의사결정",
    Execution: "실행",
    Validation: "검증",
  }

  return (
    <Card className="p-6 border-2 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Badge className={getTypeColor(workPackage.wpType)}>{wpTypeKorean[workPackage.wpType]}</Badge>
          <h3 className="text-lg font-semibold text-foreground mt-2">{workPackage.title}</h3>
          {readOnly && <p className="text-xs text-muted-foreground mt-1">읽기 전용 (완료된 이벤트)</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground">설명</Label>
          <p className="text-sm text-foreground mt-1">{workPackage.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">담당 팀</Label>
            <p className="text-sm text-foreground mt-1">{workPackage.ownerTeam}</p>
          </div>
          {workPackage.assignee && (
            <div>
              <Label className="text-sm text-muted-foreground">담당자</Label>
              <p className="text-sm text-foreground mt-1">{workPackage.assignee}</p>
            </div>
          )}
          <div>
            <Label className="text-sm text-muted-foreground">마감일</Label>
            <p className="text-sm text-foreground mt-1">{workPackage.dueDate}</p>
          </div>
        </div>

        {!readOnly && (
          <div className="space-y-2">
            <Label htmlFor="assignee">담당자</Label>
            <Input
              id="assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="담당자 이름을 입력하세요"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="status">상태</Label>
          {readOnly ? (
            <p className="text-sm text-foreground p-2 bg-muted rounded">{workPackage.status}</p>
          ) : (
            <Select value={status} onValueChange={setStatus}>
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
          )}
        </div>

        {status === "Blocked" && (
          <div className="space-y-2">
            <Label htmlFor="blockageReason">차단 사유</Label>
            {readOnly ? (
              <p className="text-sm text-foreground p-2 bg-muted rounded">{blockageReason || "없음"}</p>
            ) : (
              <Textarea
                id="blockageReason"
                placeholder="이 워크 패키지가 차단된 이유를 설명해주세요"
                rows={3}
                value={blockageReason}
                onChange={(e) => setBlockageReason(e.target.value)}
              />
            )}
          </div>
        )}

        {workPackage.dependency && (
          <div>
            <Label className="text-sm text-muted-foreground">의존성</Label>
            <p className="text-sm text-foreground mt-1">의존: {workPackage.dependency}</p>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold">첨부 파일</Label>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={handleFileAttach}>
                <Paperclip className="h-3 w-3 mr-1" />
                파일 첨부
              </Button>
            )}
          </div>
          {workPackage.attachments && workPackage.attachments.length > 0 ? (
            <div className="space-y-2">
              {workPackage.attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex items-center gap-2 flex-1">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{att.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {att.uploadedBy} • {formatTimestamp(att.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">첨부 파일 없음</p>
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <Label className="text-sm font-semibold mb-3 block">활동 로그</Label>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {workPackage.logs && workPackage.logs.length > 0 ? (
              workPackage.logs.map((log) => (
                <div key={log.id} className="p-3 bg-muted rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{log.author}</span>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <p className="text-foreground">{log.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">로그 없음</p>
            )}
          </div>

          {!readOnly && (
            <div className="space-y-2">
              <Input placeholder="작성자 이름" value={logAuthor} onChange={(e) => setLogAuthor(e.target.value)} />
              <div className="flex gap-2">
                <Textarea
                  placeholder="로그 또는 코멘트 추가..."
                  rows={2}
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddLog} disabled={!logContent.trim() || !logAuthor.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          {!readOnly && (
            <Button className="flex-1" onClick={handleSave}>
              변경 사항 저장
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className={readOnly ? "flex-1" : ""}>
            닫기
          </Button>
        </div>
      </div>
    </Card>
  )
}
