"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MessageCircleQuestion, Send, Bug, Lightbulb } from "lucide-react"

const FEEDBACK_HISTORY = [
  { id: 1, type: "bug", title: "DCS Screen View 로딩 지연", status: "resolved", date: "2025-01-20", reply: "v2.3.5 패치로 해결되었습니다." },
  { id: 2, type: "suggestion", title: "Trend 비교 시 다중 Tag 선택 기능 요청", status: "reviewing", date: "2025-01-25", reply: "" },
  { id: 3, type: "bug", title: "이벤트 목록 필터 초기화 문제", status: "resolved", date: "2025-01-15", reply: "v2.3.4에서 수정 완료되었습니다." },
]

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState("bug")
  const [title, setTitle] = useState("")
  const [detail, setDetail] = useState("")

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <MessageCircleQuestion className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">오류 개선 / 의견 제시</h1>
          </div>
        </header>
        <main className="p-6 max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">새 피드백 작성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select value={feedbackType} onValueChange={setFeedbackType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">오류 보고</SelectItem>
                    <SelectItem value="suggestion">기능 개선 의견</SelectItem>
                    <SelectItem value="question">기타 문의</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>제목</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="피드백 제목을 입력하세요" />
              </div>
              <div className="space-y-2">
                <Label>상세 내용</Label>
                <Textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder="오류 재현 방법, 개선 제안 사항 등을 상세히 기술해주세요" className="min-h-32" />
              </div>
              <div className="flex justify-end">
                <Button className="gap-2" onClick={() => { alert("피드백이 등록되었습니다."); setTitle(""); setDetail("") }}>
                  <Send className="h-4 w-4" />
                  제출
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="font-semibold mb-3">내 피드백 이력</h2>
            <div className="space-y-3">
              {FEEDBACK_HISTORY.map(f => (
                <Card key={f.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 mb-1">
                      {f.type === "bug" ? <Bug className="h-4 w-4 text-red-500" /> : <Lightbulb className="h-4 w-4 text-amber-500" />}
                      <span className="font-medium text-sm">{f.title}</span>
                      <Badge variant={f.status === "resolved" ? "default" : "secondary"} className="ml-auto text-xs">
                        {f.status === "resolved" ? "해결됨" : "검토 중"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.date}</p>
                    {f.reply && <p className="text-sm mt-2 p-2 bg-muted/50 rounded">{f.reply}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
