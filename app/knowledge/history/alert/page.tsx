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
  Bell,
  AlertTriangle,
  Calendar,
  ChevronRight,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// 알람 히스토리 데이터
const alertHistoryData = [
  {
    id: 1,
    timestamp: "2025-02-04 09:23",
    tagId: "TI-2001",
    unit: "HCR",
    team: "2공정팀",
    description: "Reactor Inlet Temperature High",
    grade: "high",
    status: "resolved",
    duration: "22분",
    resolvedBy: "김철수",
  },
  {
    id: 2,
    timestamp: "2025-02-03 15:42",
    tagId: "PI-3001",
    unit: "VDU",
    team: "1공정팀",
    description: "Column Pressure High",
    grade: "medium",
    status: "resolved",
    duration: "28분",
    resolvedBy: "이영희",
  },
  {
    id: 3,
    timestamp: "2025-02-02 22:15",
    tagId: "LI-1002",
    unit: "CDU",
    team: "1공정팀",
    description: "Drum Level Low-Low",
    grade: "critical",
    status: "resolved",
    duration: "20분",
    resolvedBy: "박민수",
  },
  {
    id: 4,
    timestamp: "2025-02-01 08:30",
    tagId: "FI-2005",
    unit: "HCR",
    team: "2공정팀",
    description: "Recycle Gas Flow Low",
    grade: "medium",
    status: "resolved",
    duration: "45분",
    resolvedBy: "최지훈",
  },
  {
    id: 5,
    timestamp: "2025-01-30 14:20",
    tagId: "TI-4001",
    unit: "CCR",
    team: "3공정팀",
    description: "Regenerator Temperature High",
    grade: "high",
    status: "resolved",
    duration: "35분",
    resolvedBy: "정수민",
  },
  {
    id: 6,
    timestamp: "2025-01-28 11:20",
    tagId: "TI-2001",
    unit: "HCR",
    team: "2공정팀",
    description: "Reactor Inlet Temperature High",
    grade: "high",
    status: "resolved",
    duration: "18분",
    resolvedBy: "김철수",
  },
  {
    id: 7,
    timestamp: "2025-01-25 16:45",
    tagId: "PI-1001",
    unit: "CDU",
    team: "1공정팀",
    description: "Crude Column Pressure Low",
    grade: "medium",
    status: "resolved",
    duration: "32분",
    resolvedBy: "박민수",
  },
]

const getGradeConfig = (grade: string) => {
  switch (grade) {
    case "critical":
      return { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", iconColor: "text-red-500" }
    case "high":
      return { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200", iconColor: "text-orange-500" }
    case "medium":
      return { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200", iconColor: "text-amber-500" }
    default:
      return { label: "Low", color: "bg-blue-100 text-blue-700 border-blue-200", iconColor: "text-blue-500" }
  }
}

export default function AlertHistoryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [selectedGrade, setSelectedGrade] = useState("all")

  const filteredData = alertHistoryData.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.tagId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnit = selectedUnit === "all" || entry.unit === selectedUnit
    const matchesTeam = selectedTeam === "all" || entry.team === selectedTeam
    const matchesGrade = selectedGrade === "all" || entry.grade === selectedGrade
    return matchesSearch && matchesUnit && matchesTeam && matchesGrade
  })

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert History
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                과거 알람 발생 이력 및 해결 방법 아카이브
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
                      placeholder="Tag ID, 설명 검색..."
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
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="등급" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 등급</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 알람 히스토리 목록 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                알람 히스토리 ({filteredData.length}건)
              </h3>
            </div>
            
            <div className="grid gap-3">
              {filteredData.map((entry) => {
                const gradeConfig = getGradeConfig(entry.grade)
                return (
                  <Card 
                    key={entry.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                    onClick={() => router.push(`/knowledge/history/alert/${entry.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <AlertTriangle className={cn("h-6 w-6", gradeConfig.iconColor)} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-lg">{entry.tagId}</span>
                              <Badge variant="outline" className={gradeConfig.color}>
                                {gradeConfig.label}
                              </Badge>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                해결
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">{entry.description}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {entry.unit} | 지속시간: {entry.duration} | 해결: {entry.resolvedBy}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {entry.timestamp}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.team}
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
