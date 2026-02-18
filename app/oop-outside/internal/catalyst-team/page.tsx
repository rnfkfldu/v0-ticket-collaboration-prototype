"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Upload, Database, FileText, Calendar, Download, Eye, Search, FlaskConical
} from "lucide-react"

const CATALYST_TEAM_DATA = [
  { id: "CT-001", title: "HCR Catalyst Spent Sample Analysis", analyst: "김민호", date: "2025-01-28", unit: "HCR", status: "completed", category: "Catalyst Activity", summary: "Spent Catalyst 표면적, 기공부피, 금속침착량 분석 완료. 활성도 78% 수준." },
  { id: "CT-002", title: "CCR Catalyst Regeneration Efficiency Test", analyst: "이수진", date: "2025-01-20", unit: "CCR", status: "completed", category: "Regeneration", summary: "재생 촉매 활성도 96% 회복 확인. Coke 잔류량 0.05wt% 이하." },
  { id: "CT-003", title: "NHT Catalyst Performance Evaluation", analyst: "김민호", date: "2025-02-01", unit: "NHT", status: "in-progress", category: "Performance", summary: "NHT 촉매 성능 저하 원인 분석 중. 예비 결과: Si 오염 의심." },
  { id: "CT-004", title: "HCR Fresh Catalyst QC Test", analyst: "박지연", date: "2025-01-15", unit: "HCR", status: "completed", category: "QC", summary: "신규 입고 촉매 QC 테스트 결과 - Spec 충족 확인." },
]

export default function CatalystTeamPage() {
  const [search, setSearch] = useState("")
  const [selectedData, setSelectedData] = useState<typeof CATALYST_TEAM_DATA[0] | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const filtered = CATALYST_TEAM_DATA.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) || d.summary.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">촉매기술팀 분석 결과</h1>
              <p className="text-sm text-muted-foreground">내부 촉매기술팀에서 수행한 분석 결과 및 리포트</p>
            </div>
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            분석 결과 업로드
          </Button>
        </header>

        <main className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{CATALYST_TEAM_DATA.length}</div><p className="text-xs text-muted-foreground">전체 분석 건수</p></CardContent></Card>
            <Card className="border-green-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{CATALYST_TEAM_DATA.filter(d => d.status === "completed").length}</div><p className="text-xs text-muted-foreground">완료</p></CardContent></Card>
            <Card className="border-blue-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{CATALYST_TEAM_DATA.filter(d => d.status === "in-progress").length}</div><p className="text-xs text-muted-foreground">진행 중</p></CardContent></Card>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="분석 결과 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="space-y-3">
            {filtered.map(data => (
              <Card key={data.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{data.category}</Badge>
                        <Badge variant="outline">{data.unit}</Badge>
                        <Badge variant={data.status === "completed" ? "default" : "secondary"}>
                          {data.status === "completed" ? "완료" : "진행 중"}
                        </Badge>
                      </div>
                      <h3 className="font-medium mb-1">{data.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{data.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>분석자: {data.analyst}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{data.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedData(data); setShowDetailDialog(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{selectedData?.title}</DialogTitle></DialogHeader>
            {selectedData && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedData.category}</Badge>
                  <Badge variant="outline">{selectedData.unit}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">분석자:</span> {selectedData.analyst}</div>
                  <div><span className="text-muted-foreground">일자:</span> {selectedData.date}</div>
                  <div><span className="text-muted-foreground">상태:</span> {selectedData.status === "completed" ? "완료" : "진행 중"}</div>
                </div>
                <div><label className="text-sm font-medium">요약</label><p className="text-sm text-muted-foreground mt-1">{selectedData.summary}</p></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>닫기</Button>
              <Button><Download className="h-4 w-4 mr-1" />다운로드</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
