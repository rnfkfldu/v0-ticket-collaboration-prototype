"use client"

import { useState, useRef, useEffect } from "react"
import type { Ticket, DataInsertBox } from "@/lib/types"
import { updateTicket } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { 
  Zap, Send, User, Clock, Building2, ChevronLeft, Activity, 
  Monitor, PlusCircle, Image, TrendingUp, Table as TableIcon, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// 간단한 데이터 추가 다이얼로그
function DataAttachDialog({ 
  open, 
  onClose, 
  onAttach 
}: { 
  open: boolean
  onClose: () => void
  onAttach: (box: DataInsertBox) => void 
}) {
  const [type, setType] = useState<"trend" | "dcs">("trend")
  const [title, setTitle] = useState("")
  
  const handleAttach = () => {
    const box: DataInsertBox = {
      id: `db-${Date.now()}`,
      type,
      config: {
        title: title || (type === "trend" ? "트렌드 데이터" : "DCS 화면"),
        tags: type === "trend" ? ["TI-2001"] : undefined,
        graphicNumber: type === "dcs" ? "HCR-001" : undefined,
      }
    }
    onAttach(box)
    setTitle("")
    onClose()
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>데이터 첨부</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Button 
              variant={type === "trend" ? "default" : "outline"} 
              size="sm" 
              className="flex-1 gap-2"
              onClick={() => setType("trend")}
            >
              <TrendingUp className="h-4 w-4" />
              트렌드
            </Button>
            <Button 
              variant={type === "dcs" ? "default" : "outline"} 
              size="sm" 
              className="flex-1 gap-2"
              onClick={() => setType("dcs")}
            >
              <Monitor className="h-4 w-4" />
              DCS 화면
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">제목 (선택)</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "trend" ? "예: TI-2001 온도 트렌드" : "예: HCR 반응기 상세"}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
            <Button size="sm" onClick={handleAttach}>첨부</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 메시지 버블 컴포넌트
function MessageBubble({ 
  message, 
  isOwn 
}: { 
  message: any
  isOwn: boolean 
}) {
  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn(
          "text-xs",
          isOwn ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
        )}>
          {message.author.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <div className={cn("max-w-[75%] space-y-1", isOwn && "items-end")}>
        <div className={cn("flex items-center gap-2", isOwn && "flex-row-reverse")}>
          <span className="text-xs font-medium">{message.author}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleString("ko-KR", { 
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
            })}
          </span>
        </div>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
          isOwn 
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-tr-sm" 
            : "bg-muted rounded-tl-sm"
        )}>
          {message.content}
        </div>
        {/* 첨부된 데이터 박스 */}
        {message.dataBoxes && message.dataBoxes.length > 0 && (
          <div className="space-y-2 mt-2">
            {message.dataBoxes.map((box: DataInsertBox) => (
              <div 
                key={box.id} 
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border text-xs",
                  isOwn ? "bg-amber-50 border-amber-200" : "bg-muted/50"
                )}
              >
                {box.type === "trend" && <Activity className="h-4 w-4 text-blue-600" />}
                {box.type === "dcs" && <Monitor className="h-4 w-4 text-emerald-600" />}
                {box.type === "table" && <TableIcon className="h-4 w-4 text-purple-600" />}
                <span className="font-medium">{box.config.title || `${box.type} 데이터`}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">클릭하여 보기</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function QuickInquiryDetail({ ticket }: { ticket: Ticket }) {
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<DataInsertBox[]>([])
  const [showDataDialog, setShowDataDialog] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [localMessages, setLocalMessages] = useState(ticket.messages || [])
  
  // 로그인 유저 (임시)
  const currentUser = "박영희"
  
  useEffect(() => {
    // 스크롤을 맨 아래로
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localMessages])
  
  const handleSend = () => {
    if (!newMessage.trim() && attachments.length === 0) return
    
    const msg = {
      id: `qi-msg-${Date.now()}`,
      ticketId: ticket.id,
      author: currentUser,
      role: "assignee" as const,
      messageType: "response" as const,
      content: newMessage,
      timestamp: new Date().toISOString(),
      dataBoxes: attachments.length > 0 ? attachments : undefined,
    }
    
    const updatedMessages = [...localMessages, msg]
    setLocalMessages(updatedMessages)
    updateTicket(ticket.id, { messages: updatedMessages })
    setNewMessage("")
    setAttachments([])
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background flex flex-col">
      {/* 헤더 */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/actions/tickets">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ChevronLeft className="h-4 w-4" />
              목록
            </Button>
          </Link>
          <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold truncate">{ticket.title}</h1>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] flex-shrink-0">
                빠른 문의
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {ticket.unit}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {ticket.requester}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ticket.createdDate}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-180px)]" ref={scrollRef}>
          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            {/* 시작 메시지 */}
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full text-xs text-amber-700">
                <Zap className="h-3 w-3" />
                {ticket.requester}님이 빠른 문의를 시작했습니다
              </div>
            </div>
            
            {/* 메시지 목록 */}
            {localMessages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.author === currentUser}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 입력 영역 */}
      <div className="border-t bg-white p-3">
        <div className="max-w-3xl mx-auto">
          {/* 첨부된 데이터 미리보기 */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {attachments.map((box, idx) => (
                <div key={box.id} className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs">
                  {box.type === "trend" && <Activity className="h-3 w-3 text-blue-600" />}
                  {box.type === "dcs" && <Monitor className="h-3 w-3 text-emerald-600" />}
                  <span>{box.config.title}</span>
                  <button 
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 h-10 gap-1.5"
              onClick={() => setShowDataDialog(true)}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">데이터</span>
            </Button>
            <div className="flex-1 relative">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                className="min-h-[40px] max-h-[120px] resize-none pr-12 py-2.5"
                rows={1}
              />
            </div>
            <Button 
              size="sm" 
              className="flex-shrink-0 h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={handleSend}
              disabled={!newMessage.trim() && attachments.length === 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            트렌드, DCS 화면 등 공정 데이터를 첨부하여 의견을 교환할 수 있습니다
          </p>
        </div>
      </div>
      
      <DataAttachDialog 
        open={showDataDialog} 
        onClose={() => setShowDataDialog(false)}
        onAttach={(box) => setAttachments(prev => [...prev, box])}
      />
    </div>
  )
}
