"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { getTickets, closeTicket, addInquiryToTicket, markNotificationAsRead } from "@/lib/storage"
import type { Ticket } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export function NotificationPanel() {
  const [allNotifications, setAllNotifications] = useState<Ticket[]>([])
  const [filterType, setFilterType] = useState<"unread" | "all">("unread")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [inquiryContent, setInquiryContent] = useState("")
  const [inquiryAuthor, setInquiryAuthor] = useState("김지수")
  const [inquiryTeam, setInquiryTeam] = useState("")
  const [showInquiryDialog, setShowInquiryDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const CURRENT_USER = "김지수"

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    const tickets = getTickets()
    const ticketsWithMessages = tickets.filter((t) => t.messages && t.messages.length > 0)
    setAllNotifications(ticketsWithMessages)
  }

  const unreadNotifications = allNotifications.filter((t) => t.hasUnreadNotification)
  const displayNotifications = filterType === "unread" ? unreadNotifications : allNotifications

  const handleCloseTicket = () => {
    if (!selectedTicket) return

    closeTicket(selectedTicket.id)
    markNotificationAsRead(selectedTicket.id)
    setShowCloseDialog(false)
    setSelectedTicket(null)
    loadNotifications()
    alert("이벤트이 종결되었습니다")
  }

  const handleInquiry = () => {
    if (!selectedTicket || !inquiryContent.trim()) {
      alert("문의 내용을 입력해주세요")
      return
    }

    const inquiryText = inquiryTeam
      ? `[${inquiryAuthor} / ${inquiryTeam}]\n\n${inquiryContent}`
      : `[${inquiryAuthor}]\n\n${inquiryContent}`

    addInquiryToTicket(selectedTicket.id, inquiryText, inquiryAuthor)
    markNotificationAsRead(selectedTicket.id)
    setInquiryContent("")
    setInquiryTeam("")
    setShowInquiryDialog(false)
    setSelectedTicket(null)
    loadNotifications()
    alert("추가 문의가 전송되었습니다")
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent relative">
            <Bell className="h-4 w-4" />
            알람 확인
            {unreadNotifications.length > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadNotifications.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>알람</SheetTitle>
            <SheetDescription>
              {filterType === "unread"
                ? `새로운 의견이 도착한 이벤트 ${unreadNotifications.length}개`
                : `전체 알람 ${allNotifications.length}개`}
            </SheetDescription>
          </SheetHeader>

          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as "unread" | "all")} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unread">미확인 ({unreadNotifications.length})</TabsTrigger>
              <TabsTrigger value="all">전체 ({allNotifications.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-6 space-y-4">
            {displayNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {filterType === "unread" ? "새로운 알람이 없습니다" : "알람이 없습니다"}
              </p>
            ) : (
              displayNotifications.map((ticket) => (
                <Card key={ticket.id} className={ticket.hasUnreadNotification ? "p-4 border-primary/50" : "p-4"}>
                  <Link href={`/tickets/${ticket.id}`} onClick={() => setIsOpen(false)}>
                    <div className="flex items-start justify-between mb-3 cursor-pointer hover:opacity-80">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{ticket.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.messages[ticket.messages.length - 1]?.author}님이 의견을 보냈습니다
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ticket.context?.unit}
                          </Badge>
                          {!ticket.hasUnreadNotification && (
                            <Badge variant="outline" className="text-xs">
                              확인됨
                            </Badge>
                          )}
                        </div>
                      </div>
                      {ticket.hasUnreadNotification && <div className="h-2 w-2 bg-primary rounded-full shrink-0" />}
                    </div>
                  </Link>

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTicket(ticket)
                        setShowCloseDialog(true)
                      }}
                    >
                      <CheckCircle className="h-3 w-3" />
                      이벤트 종결
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTicket(ticket)
                        setShowInquiryDialog(true)
                      }}
                    >
                      <MessageSquarePlus className="h-3 w-3" />
                      추가 문의
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 종결</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTicket?.title}을(를) 종결하시겠습니까? 모든 작업이 완료되었는지 확인해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseTicket}>이벤트 종결</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>추가 문의</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTicket?.title}에 대한 추가 문의 내용을 입력해주세요
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">이름</label>
              <Input
                value={inquiryAuthor}
                onChange={(e) => setInquiryAuthor(e.target.value)}
                placeholder="이름을 입력해주세요"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">팀</label>
              <Input
                value={inquiryTeam}
                onChange={(e) => setInquiryTeam(e.target.value)}
                placeholder="팀 이름을 입력해주세요"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">문의 내용</label>
              <Textarea
                value={inquiryContent}
                onChange={(e) => setInquiryContent(e.target.value)}
                placeholder="추가로 필요한 정보나 수정 사항을 입력해주세요..."
                className="min-h-[150px]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setInquiryContent("")
                setInquiryTeam("")
              }}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleInquiry}>전송</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
