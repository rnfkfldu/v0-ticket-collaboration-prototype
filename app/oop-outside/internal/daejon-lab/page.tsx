"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Upload, Calendar, Download, Eye, Search, Building2 } from "lucide-react"

const LAB_DATA = [
  { id: "DL-001", title: "Arabian Medium Crude Assay (Full)", analyst: "정영수 연구원", date: "2025-01-25", unit: "CDU", status: "completed", category: "Crude Assay", summary: "Arabian Medium 전체 성상 분석. API 29.5, S 2.54wt%, TAN 0.12." },
  { id: "DL-002", title: "HCR Product Detailed HC Analysis", analyst: "한미경 책임연구원", date: "2025-01-18", unit: "HCR", status: "completed", category: "Product Analysis", summary: "HCR Diesel 상세 탄화수소 분석. Paraffin 48%, Naphthene 32%, Aromatic 20%." },
  { id: "DL-003", title: "VDU Residue Characterization", analyst: "정영수 연구원", date: "2025-02-02", unit: "VDU", status: "in-progress", category: "Feed Analysis", summary: "VDU Residue 성상 분석 진행 중. Conradson Carbon, Asphaltene 측정 예정." },
  { id: "DL-004", title: "Corrosion Coupon Analysis (Overhead System)", analyst: "최준혁 선임연구원", date: "2025-01-10", unit: "CDU", status: "completed", category: "Corrosion", summary: "CDU Overhead 부식 쿠폰 분석. 부식율 3.2 mpy (안전 범위 내)." },
]

export default function DaejonLabPage() {
  const [search, setSearch] = useState("")
  const [selectedData, setSelectedData] = useState<typeof LAB_DATA[0] | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const filtered = LAB_DATA.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) || d.summary.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">대전연구소 분석 결과</h1>
              <p className="text-sm text-muted-foreground">대전연구소에서 수행한 분석 결과 및 리포트</p>
            </div>
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            분석 결과 업로드
          </Button>
        </header>

        <main className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{LAB_DATA.length}</div><p className="text-xs text-muted-foreground">전체 분석 건수</p></CardContent></Card>
            <Card className="border-green-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{LAB_DATA.filter(d => d.status === "completed").length}</div><p className="text-xs text-muted-foreground">완료</p></CardContent></Card>
            <Card className="border-blue-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{LAB_DATA.filter(d => d.status === "in-progress").length}</div><p className="text-xs text-muted-foreground">진행 중</p></CardContent></Card>
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
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedData(data); setShowDetailDialog(true) }}><Eye className="h-4 w-4" /></Button>
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
