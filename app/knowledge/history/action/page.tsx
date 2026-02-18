"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search,
  Filter,
  Wrench,
  Calendar,
  ChevronRight,
  CheckCircle,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"

// 액션 히스토리 데이터
const actionHistoryData = [
  {
    id: 1,
    ticketId: "TKT-2025-0123",
    title: "HCR Reactor 온도 이상 대응",
    unit: "HCR",
    team: "2공정팀",
    type: "corrective",
    status: "completed",
    createdAt: "2025-02-04 09:30",
    completedAt: "2025-02-04 14:00",
    assignee: "김철수",
    description: "Reactor Inlet Temperature High 알람에 대한 대응 조치",
  },
  {
    id: 2,
    ticketId: "TKT-2025-0118",
    title: "CDU Crude Blend 변경",
    unit: "CDU",
    team: "1공정팀",
    type: "planned",
    status: "completed",
    createdAt: "2025-02-02 08:00",
    completedAt: "2025-02-02 16:00",
    assignee: "박민수",
    description: "정기 Crude Blend 변경 작업 (Kuwait → Arab Light)",
  },
  {
    id: 3,
    ticketId: "TKT-2025-0098",
    title: "VDU Heater Trip 비상 대응",
    unit: "VDU",
    team: "1공정팀",
    type: "emergency",
    status: "completed",
    createdAt: "2025-02-01 01:15",
    completedAt: "2025-02-01 04:30",
    assignee: "최지훈",
    description: "H-1001 Heater Trip으로 인한 비상 대응",
  },
  {
    id: 4,
    ticketId: "TKT-2025-0085",
    title: "CCR 촉매 재생 작업",
    unit: "CCR",
    team: "3공정팀",
    type: "planned",
    status: "completed",
    createdAt: "2025-01-31 08:00",
    completedAt: "2025-01-31 18:00",
    assignee: "정수민",
    description: "정기 촉매 재생 작업",
  },
  {
    id: 5,
    ticketId: "TKT-2025-0076",
    title: "CCR Regenerator 온도 이상 조치",
    unit: "CCR",
    team: "3공정팀",
    type: "corrective",
    status: "completed",
    createdAt: "2025-01-30 14:20",
    completedAt: "2025-01-30 17:00",
    assignee: "정수민",
    description: "Regenerator Temperature High 알람 대응",
  },
  {
    id: 6,
    ticketId: "TKT-2025-0065",
    title: "HCR Feed 품질 조정",
    unit: "HCR",
    team: "2공정팀",
    type: "corrective",
    status: "completed",
    createdAt: "2025-01-28 10:00",
    completedAt: "2025-01-28 15:30",
    assignee: "김철수",
    description: "Feed 황 함량 증가 대응",
  },
  {
    id: 7,
    ticketId: "TKT-2025-0050",
    title: "VDU 정기 정비",
    unit: "VDU",
    team: "1공정팀",
    type: "planned",
    status: "completed",
    createdAt: "2025-01-25 06:00",
    completedAt: "2025-01-27 18:00",
    assignee: "이영희",
    description: "VDU 정기 정비 및 점검",
  },
]

const getTypeConfig = (type: string) => {
  switch (type) {
    case "emergency":
      return { label: "비상", color: "bg-red-100 text-red-700 border-red-200" }
    case "corrective":
      return { label: "교정", color: "bg-amber-100 text-amber-700 border-amber-200" }
    case "planned":
      return { label: "계획", color: "bg-blue-100 text-blue-700 border-blue-200" }
    default:
      return { label: "기타", color: "bg-gray-100 text-gray-700 border-gray-200" }
  }
}

export default function ActionHistoryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  const filteredData = actionHistoryData.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnit = selectedUnit === "all" || entry.unit === selectedUnit
    const matchesTeam = selectedTeam === "all" || entry.team === selectedTeam
    const matchesType = selectedType === "all" || entry.type === selectedType
    return matchesSearch && matchesUnit && matchesTeam && matchesType
  })

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Action History
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                티켓 기반 조치 이력 및 결과 아카이브
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* 필터 영역 */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="티켓 ID, 제목 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="공정" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 공정</SelectItem>
                    <SelectItem value="CDU">CDU</SelectItem>
                    <SelectItem value="VDU">VDU</SelectItem>
                    <SelectItem value="HCR">HCR</SelectItem>
                    <SelectItem value="CCR">CCR</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="팀" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 팀</SelectItem>
                    <SelectItem value="1공정팀">1공정팀</SelectItem>
                    <SelectItem value="2공정팀">2공정팀</SelectItem>
                    <SelectItem value="3공정팀">3공정팀</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 유형</SelectItem>
                    <SelectItem value="emergency">비상</SelectItem>
                    <SelectItem value="corrective">교정</SelectItem>
                    <SelectItem value="planned">계획</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 액션 히스토리 목록 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                조치 이력 ({filteredData.length}건)
              </h3>
            </div>
            
            <div className="grid gap-3">
              {filteredData.map((entry) => {
                const typeConfig = getTypeConfig(entry.type)
                return (
                  <Card 
                    key={entry.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                    onClick={() => router.push(`/knowledge/history/action/${entry.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Wrench className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-muted-foreground">{entry.ticketId}</span>
                              <Badge variant="outline" className={typeConfig.color}>
                                {typeConfig.label}
                              </Badge>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                완료
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">{entry.title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{entry.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {entry.createdAt.split(" ")[0]}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{entry.unit}</span>
                              <span>|</span>
                              <span>{entry.team}</span>
                              <span>|</span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.assignee}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
