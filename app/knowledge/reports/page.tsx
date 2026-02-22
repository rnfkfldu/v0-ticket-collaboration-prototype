"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileBarChart,
  Calendar,
  Download,
  Eye,
  Search,
  CheckCircle,
  Clock,
  User,
  FileText,
  Send,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const MONTHLY_REPORTS = [
  { id: 1, title: "2025\uB144 1\uC6D4 \uC6B4\uC804 \uBCF4\uACE0\uC11C", date: "2025-02-01", status: "published" },
  { id: 2, title: "2024\uB144 12\uC6D4 \uC6B4\uC804 \uBCF4\uACE0\uC11C", date: "2025-01-02", status: "published" },
  { id: 3, title: "2024\uB144 11\uC6D4 \uC6B4\uC804 \uBCF4\uACE0\uC11C", date: "2024-12-02", status: "published" },
]

const EVENT_REPORTS = [
  { id: 1, title: "HCR \uAE34\uAE09 \uC815\uC9C0 \uBD84\uC11D \uBCF4\uACE0\uC11C", date: "2025-01-28", type: "Event" },
  { id: 2, title: "2024 T/A \uACB0\uACFC \uBCF4\uACE0\uC11C", date: "2024-07-15", type: "T/A" },
  { id: 3, title: "Feed \uBCC0\uACBD \uC601\uD5A5 \uBD84\uC11D", date: "2024-09-20", type: "Analysis" },
]

// \uC2B9\uC778\uB41C \uC885\uB8CC \uB9AC\uD3EC\uD2B8 (Knowledge \uC790\uC0B0\uD654)
const CLOSURE_REPORTS = [
  {
    id: "RPT-001",
    title: "P-201A/B \uC9C4\uB3D9 \uC774\uC0C1 \uBD84\uC11D - \uC885\uB8CC Report",
    sourceType: "ticket" as const,
    sourceId: "TKT-005",
    summary: "P-201A/B \uD3B8\uD504\uC758 \uBE44\uC815\uC0C1 \uC9C4\uB3D9 \uC6D0\uC778 \uBD84\uC11D \uBC0F Impeller \uAD50\uCCB4\uB97C \uD1B5\uD55C \uAC1C\uC120 \uACB0\uACFC. \uC9C4\uB3D9\uAC12 \uC815\uC0C1 \uBC94\uC704 \uBCF5\uADC0 \uD655\uC778.",
    background: "P-201A \uD3B8\uD504\uC5D0\uC11C \uBE44\uC815\uC0C1 \uC9C4\uB3D9 \uAC10\uC9C0. Impeller \uB9C8\uBAA8 \uBC0F \uBD88\uADE0\uD615\uC73C\uB85C \uC778\uD55C \uC9C4\uB3D9 \uC99D\uAC00.",
    actions: "1. \uC9C4\uB3D9 \uBD84\uC11D \uBC0F Spectrum \uBD84\uC11D \uC218\uD589\n2. Impeller \uAD50\uCCB4 \uC791\uC5C5 \uC2E4\uC2DC\n3. \uAD50\uCCB4 \uD6C4 Trial Run \uBC0F \uC815\uC0C1 \uAC00\uB3D9 \uD655\uC778",
    results: "- \uC9C4\uB3D9\uAC12: 12.5mm/s \u2192 2.1mm/s (\uC815\uC0C1 \uBC94\uC704: <4.5mm/s)\n- \uC131\uB2A5 \uBCF5\uADC0: \uC720\uB7C9 \uC815\uC0C1, \uD1A0\uCD9C\uC555 \uC815\uC0C1",
    lessons: "- \uC815\uAE30 \uC9C4\uB3D9 \uBAA8\uB2C8\uD130\uB9C1 \uC8FC\uAE30 \uB2E8\uCD95 \uD544\uC694 (\uC6D4 1\uD68C \u2192 \uC8FC 1\uD68C)\n- Impeller \uC218\uBA85 \uAD00\uB9AC \uAE30\uC900 \uC218\uB9BD",
    recommendations: "\uD6C4\uC18D \uBAA8\uB2C8\uD130\uB9C1 3\uAC1C\uC6D4. B\uD3B8\uD504 \uAD50\uCCB4 \uC608\uC815 (\uB2E4\uC74C \uC8FC).",
    status: "approved" as const,
    createdDate: "2025-01-28",
    author: "\uBC15\uC815\uBE44",
    approver: "\uC774\uBD80\uC7A5",
    approvedDate: "2025-01-30",
  },
  {
    id: "RPT-002",
    title: "HCR \uCD09\uB9E4 \uAD50\uCCB4 \uAC80\uD1A0 - \uC885\uB8CC Report",
    sourceType: "worklist" as const,
    sourceId: "TA-001",
    summary: "HCR Reactor R-2001 \uCD09\uB9E4 \uAD50\uCCB4 \uAC80\uD1A0 \uACB0\uACFC. WABT \uC0C1\uC2B9 \uCD94\uC138 \uBD84\uC11D \uBC0F 2025 TA \uC2DC \uAD50\uCCB4 \uACC4\uD68D \uC218\uB9BD.",
    background: "HCR \uCD09\uB9E4 WABT \uC0C1\uC2B9 \uCD94\uC138 \uC9C0\uC18D. EOR \uB3C4\uB2EC \uC608\uC0C1 8\uAC1C\uC6D4.",
    actions: "1. WABT \uCD94\uC138 \uBD84\uC11D\n2. \uCD09\uB9E4 \uBC1C\uC8FC \uBC0F \uB0A9\uAE30 \uD655\uC778\n3. TA Scope \uD655\uC815",
    results: "- \uCD09\uB9E4 \uBC1C\uC8FC \uC644\uB8CC (3\uC6D4 \uB0A9\uAE30)\n- TA \uAE30\uAC04 14\uC77C \uD655\uC815",
    lessons: "- \uCD09\uB9E4 \uC218\uBA85 \uC608\uCE21 \uBAA8\uB378 \uACE0\uB3C4\uD654 \uD544\uC694",
    recommendations: "\uCD09\uB9E4 \uC785\uACE0 \uC2DC \uD488\uC9C8 \uAC80\uC0AC \uD544\uC218. TA \uC804 Pre-work \uC900\uBE44.",
    status: "approved" as const,
    createdDate: "2025-02-01",
    author: "\uAE40\uCCA0\uC218",
    approver: "\uC774\uBD80\uC7A5",
    approvedDate: "2025-02-03",
  },
  {
    id: "RPT-003",
    title: "CCR APC \uAC00\uB3D9 \uC694\uCCAD - \uC885\uB8CC Report",
    sourceType: "ticket" as const,
    sourceId: "model-2",
    summary: "CCR \uACF5\uC815 \uC7AC\uAE30\uB3D9 \uD6C4 APC \uC7AC\uC5F0\uACB0 \uC644\uB8CC. DCS-APC \uD1B5\uC2E0 \uC815\uC0C1\uD654 \uD655\uC778.",
    background: "CCR \uACF5\uC815 \uC7AC\uAE30\uB3D9 \uD6C4 APC\uAC00 DCS\uC640 \uC5F0\uB3D9\uB418\uC9C0 \uC54A\uB294 \uC0C1\uD0DC.",
    actions: "1. \uD1B5\uC2E0 \uC7A5\uC560 \uC9C4\uB2E8\n2. OPC \uC11C\uBC84 \uC7AC\uC2DC\uC791\n3. APC Controller \uC7AC\uAC00\uB3D9",
    results: "- APC \uC815\uC0C1 \uAC00\uB3D9 \uD655\uC778\n- MV/CV \uC751\uB2F5 \uC815\uC0C1",
    lessons: "\uACF5\uC815 \uC7AC\uAE30\uB3D9 \uC2DC APC \uC5F0\uACB0 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uD544\uC218 \uC801\uC6A9 \uD544\uC694",
    recommendations: "SOP\uC5D0 APC \uC7AC\uC5F0\uACB0 \uC808\uCC28 \uCD94\uAC00",
    status: "pending-approval" as const,
    createdDate: "2025-02-05",
    author: "\uAE40\uC9C0\uC218",
  },
]

export default function ReportsPage() {
  const [search, setSearch] = useState("")
  const [selectedReport, setSelectedReport] = useState<typeof CLOSURE_REPORTS[0] | null>(null)

  const approvedReports = CLOSURE_REPORTS.filter(r => r.status === "approved")
  const pendingReports = CLOSURE_REPORTS.filter(r => r.status === "pending-approval")

  const filteredApproved = approvedReports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.author.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground">월간 운전 보고서, 이벤트 보고서 및 승인된 종료 Report</p>
          </div>
        </div>

        <Tabs defaultValue="closure">
          <TabsList>
            <TabsTrigger value="closure" className="gap-1.5">
              종료 Report
              {pendingReports.length > 0 && (
                <Badge variant="destructive" className="text-xs h-5 min-w-5 px-1">{pendingReports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="monthly">월간 보고서</TabsTrigger>
            <TabsTrigger value="event">이벤트 보고서</TabsTrigger>
          </TabsList>

          {/* Closure Reports Tab */}
          <TabsContent value="closure" className="space-y-4 mt-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="리포트 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Pending Approval */}
            {pendingReports.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  결재 대기 ({pendingReports.length})
                </h3>
                {pendingReports.map(report => (
                  <Card key={report.id} className="border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-amber-700" />
                          </div>
                          <div>
                            <h3 className="font-medium">{report.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{report.author}</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{report.createdDate}</span>
                              <Badge variant="outline" className="text-xs">{report.sourceType === "ticket" ? "이벤트" : "워크리스트"}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-700">결재 대기</Badge>
                          <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4 mr-1" />
                            보기
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Separator />
              </div>
            )}

            {/* Approved Reports */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                승인 완료 ({filteredApproved.length})
              </h3>
              {filteredApproved.map(report => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileBarChart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{report.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{report.author}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{report.approvedDate}</span>
                            <Badge variant="outline" className="text-xs">{report.sourceType === "ticket" ? "이벤트" : "워크리스트"}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-50 text-green-600">승인됨</Badge>
                        <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                          <Eye className="h-4 w-4 mr-1" />
                          보기
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          다운로드
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredApproved.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">승인된 종료 Report가 없습니다.</div>
              )}
            </div>
          </TabsContent>

          {/* Monthly Reports */}
          <TabsContent value="monthly" className="space-y-4 mt-4">
            {MONTHLY_REPORTS.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileBarChart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{report.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {report.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">발행됨</Badge>
                      <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />보기</Button>
                      <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />다운로드</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Event Reports */}
          <TabsContent value="event" className="space-y-4 mt-4">
            {EVENT_REPORTS.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FileBarChart className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <h3 className="font-medium">{report.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{report.type}</Badge>
                          <span className="text-sm text-muted-foreground">{report.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />보기</Button>
                      <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />다운로드</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedReport.status === "approved" ? "secondary" : "default"} className={cn(
                    "text-xs",
                    selectedReport.status === "approved" ? "bg-green-50 text-green-600" : "bg-amber-100 text-amber-700"
                  )}>
                    {selectedReport.status === "approved" ? "승인됨" : "결재 대기"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{selectedReport.sourceType === "ticket" ? "이벤트" : "워크리스트"}</Badge>
                </div>
                <DialogTitle className="text-lg mt-1">{selectedReport.title}</DialogTitle>
                <DialogDescription>
                  {selectedReport.author} | {selectedReport.status === "approved" ? `승인일: ${selectedReport.approvedDate}` : `작성일: ${selectedReport.createdDate}`}
                  {selectedReport.approver && ` | 승인자: ${selectedReport.approver}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {[
                  { label: "요약 (Executive Summary)", content: selectedReport.summary },
                  { label: "배경 및 목적", content: selectedReport.background },
                  { label: "수행 내역", content: selectedReport.actions },
                  { label: "결과 및 성과", content: selectedReport.results },
                  { label: "교훈 (Lessons Learned)", content: selectedReport.lessons },
                  { label: "후속 조치 권고", content: selectedReport.recommendations },
                ].map(section => (
                  <div key={section.label}>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{section.label}</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-line bg-muted/20 p-3 rounded border">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>

              {selectedReport.status === "approved" && (
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />다운로드</Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
