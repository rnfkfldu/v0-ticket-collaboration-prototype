"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  StickyNote, 
  Plus,
  Search,
  Clock,
  Star,
  MoreVertical
} from "lucide-react"

const NOTES = [
  { id: 1, title: "HCR 운전 팁 - 온도 제어", content: "Reactor inlet 온도 변동 시 feed rate 조절 우선...", date: "2025-02-04", starred: true },
  { id: 2, title: "CCR Chloride 관리 요령", content: "Chloride 농도 1.8 ppm 이상 시 Promoter 증량 검토...", date: "2025-02-02", starred: false },
  { id: 3, title: "야간 점검 체크리스트", content: "1. 주요 태그 확인 2. 알람 현황 점검...", date: "2025-01-30", starred: true },
  { id: 4, title: "Feed 변경 시 주의사항", content: "중질원유 전환 시 Preheat train 온도 모니터링 강화...", date: "2025-01-25", starred: false },
]

export default function PersonalNotesPage() {
  const [search, setSearch] = useState("")

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Personal Notes</h1>
            <p className="text-muted-foreground">개인 메모 및 노트 관리</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 노트
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="노트 검색..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {NOTES.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{note.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {note.starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {note.date}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
