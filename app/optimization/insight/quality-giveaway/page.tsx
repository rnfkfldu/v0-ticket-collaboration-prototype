"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Gauge, 
  Search, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  FileText,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QualityGiveawayItem {
  id: string
  product: string
  unit: string
  property: string
  specMin: number | null
  specMax: number | null
  specTarget: number | null
  actualAvg: number
  giveawayPct: number
  potentialSaving: string
  severity: "high" | "medium" | "low"
  trend: number[]
  reason?: string
  actionTaken?: string
}

const GIVEAWAY_DATA: QualityGiveawayItem[] = [
  {
    id: "QG-001",
    product: "Diesel (HCR)",
    unit: "HCR",
    property: "Sulfur Content (ppm)",
    specMin: null,
    specMax: 10,
    specTarget: 10,
    actualAvg: 5.2,
    giveawayPct: 48,
    potentialSaving: "W2.8B/yr",
    severity: "high",
    trend: [5.8, 5.5, 5.3, 5.1, 5.0, 5.2, 5.2]
  },
  {
    id: "QG-002",
    product: "Naphtha (CDU)",
    unit: "CDU",
    property: "End Point (C)",
    specMin: null,
    specMax: 180,
    specTarget: 180,
    actualAvg: 168,
    giveawayPct: 6.7,
    potentialSaving: "W1.5B/yr",
    severity: "medium",
    trend: [170, 169, 168, 167, 168, 169, 168]
  },
  {
    id: "QG-003",
    product: "Jet Fuel (CDU/HCR)",
    unit: "CDU",
    property: "Flash Point (C)",
    specMin: 38,
    specMax: null,
    specTarget: 38,
    actualAvg: 48,
    giveawayPct: 26.3,
    potentialSaving: "W3.2B/yr",
    severity: "high",
    trend: [46, 47, 48, 49, 48, 47, 48]
  },
  {
    id: "QG-004",
    product: "Reformate (CCR)",
    unit: "CCR",
    property: "RON",
    specMin: 95,
    specMax: null,
    specTarget: 95,
    actualAvg: 99.2,
    giveawayPct: 4.4,
    potentialSaving: "W4.1B/yr",
    severity: "high",
    trend: [98.8, 99.0, 99.1, 99.3, 99.2, 99.1, 99.2]
  },
  {
    id: "QG-005",
    product: "LVGO (VDU)",
    unit: "VDU",
    property: "Color (ASTM)",
    specMin: null,
    specMax: 3.0,
    specTarget: 3.0,
    actualAvg: 1.8,
    giveawayPct: 40,
    potentialSaving: "W0.8B/yr",
    severity: "medium",
    trend: [2.0, 1.9, 1.8, 1.8, 1.7, 1.8, 1.8]
  },
  {
    id: "QG-006",
    product: "LPG (CDU)",
    unit: "CDU",
    property: "C5+ Content (%)",
    specMin: null,
    specMax: 2.0,
    specTarget: 2.0,
    actualAvg: 0.8,
    giveawayPct: 60,
    potentialSaving: "W0.5B/yr",
    severity: "medium",
    trend: [0.9, 0.8, 0.8, 0.7, 0.8, 0.8, 0.8],
    reason: "LPG 분리탑 Overhead Condenser 온도 제어 시 Over-purification 발생. 분리탑 재비기 에너지 절감 가능.",
    actionTaken: "현재 LPG 품질 수요 업체 요구사항으로 인해 Tight 운전 불가 (계약 조건)"
  },
  {
    id: "QG-007",
    product: "Diesel (HCR)",
    unit: "HCR",
    property: "Cetane Index",
    specMin: 50,
    specMax: null,
    specTarget: 50,
    actualAvg: 56,
    giveawayPct: 12,
    potentialSaving: "W1.2B/yr",
    severity: "low",
    trend: [55, 55.5, 56, 56, 55.8, 56, 56]
  },
]

export default function QualityGiveawayPage() {
  const [unitFilter, setUnitFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<QualityGiveawayItem | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showReasonDialog, setShowReasonDialog] = useState(false)
  const [reasonText, setReasonText] = useState("")
  const [reasonItem, setReasonItem] = useState<QualityGiveawayItem | null>(null)

  const filtered = GIVEAWAY_DATA
    .filter(d => unitFilter === "all" || d.unit === unitFilter)
    .filter(d => severityFilter === "all" || d.severity === severityFilter)
    .filter(d => d.product.toLowerCase().includes(search.toLowerCase()) || d.property.toLowerCase().includes(search.toLowerCase()))

  const totalSaving = filtered.reduce((sum, d) => {
    const num = parseFloat(d.potentialSaving.replace(/[^0-9.]/g, ""))
    return sum + num
  }, 0)

  const highCount = filtered.filter(d => d.severity === "high").length

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-50 border-red-200"
      case "medium": return "text-amber-600 bg-amber-50 border-amber-200"
      case "low": return "text-blue-600 bg-blue-50 border-blue-200"
      default: return ""
    }
  }

  const handleSaveReason = () => {
    if (reasonItem) {
      reasonItem.reason = reasonText
      setShowReasonDialog(false)
      setReasonText("")
      setReasonItem(null)
      alert("사유가 저장되었습니다.")
    }
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">품질 Giveaway 분석</h1>
              <p className="text-sm text-muted-foreground">On-Spec 대비 과잉 품질 생산 현황 분석 및 개선 인사이트</p>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{filtered.length}</div>
                <p className="text-xs text-muted-foreground">모니터링 항목</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{highCount}</div>
                <p className="text-xs text-muted-foreground">High Giveaway</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">W{totalSaving.toFixed(1)}B</span>
                </div>
                <p className="text-xs text-muted-foreground">잠재적 연간 절감 (합계)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {(filtered.reduce((s, d) => s + d.giveawayPct, 0) / filtered.length).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">평균 Giveaway Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="제품 / 물성 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="CDU">CDU</SelectItem>
                <SelectItem value="VDU">VDU</SelectItem>
                <SelectItem value="HCR">HCR</SelectItem>
                <SelectItem value="CCR">CCR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 항목 리스트 */}
          <div className="space-y-3">
            {filtered.sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 }
              return order[a.severity] - order[b.severity]
            }).map(item => (
              <Card key={item.id} className={cn("hover:shadow-md transition-shadow cursor-pointer", item.severity === "high" && "border-l-4 border-l-red-500")} onClick={() => { setSelectedItem(item); setShowDetailDialog(true) }}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("text-xs", getSeverityColor(item.severity))}>
                          {item.severity === "high" ? "High" : item.severity === "medium" ? "Medium" : "Low"}
                        </Badge>
                        <Badge variant="outline">{item.unit}</Badge>
                        <span className="text-sm font-semibold">{item.product}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{item.property}</span>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Spec: </span>
                          <span className="font-mono font-medium">
                            {item.specMin !== null ? `Min ${item.specMin}` : ""}
                            {item.specMin !== null && item.specMax !== null ? " / " : ""}
                            {item.specMax !== null ? `Max ${item.specMax}` : ""}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual Avg: </span>
                          <span className="font-mono font-bold">{item.actualAvg}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Giveaway: </span>
                          <span className={cn("font-bold", item.severity === "high" ? "text-red-600" : item.severity === "medium" ? "text-amber-600" : "text-blue-600")}>
                            {item.giveawayPct}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-600">{item.potentialSaving}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mini trend */}
                    <div className="flex items-end gap-0.5 h-8 ml-4">
                      {item.trend.map((v, i) => {
                        const max = Math.max(...item.trend)
                        const min = Math.min(...item.trend)
                        const range = max - min || 1
                        const h = ((v - min) / range) * 100
                        return (
                          <div 
                            key={i} 
                            className={cn("w-2 rounded-t", item.severity === "high" ? "bg-red-400" : item.severity === "medium" ? "bg-amber-400" : "bg-blue-400")} 
                            style={{ height: `${Math.max(h, 10)}%` }} 
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* 사유가 등록된 경우 */}
                  {item.reason && (
                    <div className="mt-3 p-2 bg-muted/50 rounded-md border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <MessageSquare className="h-3 w-3" />
                        On-Spec 운전 불가 사유 등록됨
                      </div>
                      <p className="text-xs">{item.reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        {/* 상세 다이얼로그 */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Quality Giveaway 상세 분석
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6 py-4">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">제품</span>
                    <p className="font-medium">{selectedItem.product}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">품질 항목</span>
                    <p className="font-medium">{selectedItem.property}</p>
                  </div>
                </div>

                {/* 비교 차트 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Spec vs Actual 비교</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">Spec Target</div>
                        <div className="flex-1 h-8 bg-muted/50 rounded relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-primary/20 rounded" style={{ width: "100%" }} />
                          <div className="absolute inset-y-0 flex items-center px-3 text-sm font-mono font-medium">
                            {selectedItem.specMin !== null ? `Min ${selectedItem.specMin}` : ""}
                            {selectedItem.specMin !== null && selectedItem.specMax !== null ? " ~ " : ""}
                            {selectedItem.specMax !== null ? `Max ${selectedItem.specMax}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-sm text-muted-foreground">Actual Avg</div>
                        <div className="flex-1 h-8 bg-muted/50 rounded relative overflow-hidden">
                          <div className={cn("absolute inset-y-0 left-0 rounded", selectedItem.severity === "high" ? "bg-red-200" : selectedItem.severity === "medium" ? "bg-amber-200" : "bg-blue-200")} style={{ width: `${Math.min(100, (selectedItem.actualAvg / (selectedItem.specMax || selectedItem.specMin || selectedItem.actualAvg)) * 100)}%` }} />
                          <div className="absolute inset-y-0 flex items-center px-3 text-sm font-mono font-bold">
                            {selectedItem.actualAvg}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Giveaway Rate</p>
                        <p className={cn("text-xl font-bold", selectedItem.severity === "high" ? "text-red-600" : selectedItem.severity === "medium" ? "text-amber-600" : "text-blue-600")}>{selectedItem.giveawayPct}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">잠재적 절감 효과</p>
                        <p className="text-xl font-bold text-green-600">{selectedItem.potentialSaving}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Severity</p>
                        <Badge className={cn("mt-1", getSeverityColor(selectedItem.severity))}>
                          {selectedItem.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 트렌드 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      최근 7일 트렌드
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 flex items-end gap-2 bg-muted/30 rounded-lg p-4 relative">
                      {selectedItem.trend.map((v, i) => {
                        const max = Math.max(...selectedItem.trend) * 1.1
                        const min = Math.min(...selectedItem.trend) * 0.9
                        const range = max - min || 1
                        const h = ((v - min) / range) * 100
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-muted-foreground">{v}</span>
                            <div 
                              className={cn("w-full rounded-t", selectedItem.severity === "high" ? "bg-red-400" : selectedItem.severity === "medium" ? "bg-amber-400" : "bg-blue-400")} 
                              style={{ height: `${Math.max(h, 5)}%` }} 
                            />
                          </div>
                        )
                      })}
                      {/* Spec line */}
                      {selectedItem.specTarget && (
                        <div className="absolute left-4 right-4 border-t-2 border-dashed border-green-500" style={{ bottom: `${Math.min(90, Math.max(10, ((selectedItem.specTarget - Math.min(...selectedItem.trend) * 0.9) / ((Math.max(...selectedItem.trend) * 1.1) - Math.min(...selectedItem.trend) * 0.9)) * 100))}%` }}>
                          <span className="text-xs text-green-600 bg-background px-1 absolute -top-3 right-0">Spec: {selectedItem.specTarget}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* On-Spec 운전 불가 사유 */}
                {selectedItem.reason ? (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        On-Spec 운전 불가 사유
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-3">{selectedItem.reason}</p>
                      {selectedItem.actionTaken && (
                        <div className="p-2 bg-background rounded border">
                          <span className="text-xs text-muted-foreground">조치 사항:</span>
                          <p className="text-sm mt-1">{selectedItem.actionTaken}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        최적화 권고
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        이 항목은 Spec 대비 {selectedItem.giveawayPct}%의 여유를 갖고 생산 중입니다. 
                        Tight 운전 시 연간 약 {selectedItem.potentialSaving}의 절감 효과가 기대됩니다.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowDetailDialog(false); setReasonItem(selectedItem); setReasonText(""); setShowReasonDialog(true) }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Tight 운전 불가 사유 등록
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent" onClick={() => { alert("최적화 과제로 등록되었습니다."); setShowDetailDialog(false) }}>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          최적화 과제로 등록
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 사유 등록 다이얼로그 */}
        <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                On-Spec 운전 불가 사유 등록
              </DialogTitle>
            </DialogHeader>
            {reasonItem && (
              <div className="space-y-4 py-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">{reasonItem.product} - {reasonItem.property}</p>
                  <p className="text-xs text-muted-foreground mt-1">현재 Giveaway: {reasonItem.giveawayPct}% / 잠재 절감: {reasonItem.potentialSaving}</p>
                </div>
                <div className="space-y-2">
                  <Label>On-Spec 운전 불가 사유 *</Label>
                  <Textarea 
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="예: 수요처 품질 요구사항, 설비 한계, 계측 정밀도 문제, 안전 마진 필요 등"
                    className="min-h-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label>첨부 근거 자료 (선택)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50">
                    <p className="text-sm text-muted-foreground">근거 자료 첨부 (계약서, 기술 검토서 등)</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReasonDialog(false)}>취소</Button>
              <Button onClick={handleSaveReason} disabled={!reasonText.trim()}>
                사유 등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
