"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Plus, 
  Upload, 
  Database, 
  FileText, 
  Calendar, 
  Building2, 
  Download,
  Eye,
  Search,
  Filter
} from "lucide-react"

// 샘플 3rd Party 분석 데이터
const SAMPLE_ANALYSIS_DATA = [
  {
    id: "1",
    title: "Catalyst Performance Test Report",
    vendor: "UOP",
    category: "Catalyst",
    unit: "HCR",
    uploadDate: "2025-01-15",
    status: "verified",
    summary: "HCR Catalyst 활성도 테스트 결과 - 정상 범위 내",
    fileType: "PDF",
    tags: ["Catalyst", "Performance", "HCR"]
  },
  {
    id: "2", 
    title: "Crude Assay Analysis - Arabian Light",
    vendor: "Intertek",
    category: "Crude Analysis",
    unit: "CDU",
    uploadDate: "2025-01-20",
    status: "pending",
    summary: "Arabian Light 원유 성상 분석 리포트",
    fileType: "Excel",
    tags: ["Crude", "Assay", "Arabian Light"]
  },
  {
    id: "3",
    title: "Reactor Internals Inspection Report",
    vendor: "Axens",
    category: "Inspection",
    unit: "CCR",
    uploadDate: "2025-01-10",
    status: "verified",
    summary: "CCR Reactor 내부 검사 결과 보고서",
    fileType: "PDF",
    tags: ["Reactor", "Inspection", "CCR"]
  },
  {
    id: "4",
    title: "Heat Exchanger Fouling Analysis",
    vendor: "HTRI",
    category: "Equipment Analysis",
    unit: "VDU",
    uploadDate: "2025-01-05",
    status: "verified",
    summary: "VDU 열교환기 Fouling 분석 및 세정 권고",
    fileType: "PDF",
    tags: ["Heat Exchanger", "Fouling", "VDU"]
  }
]

const VENDORS = ["UOP", "Axens", "HTRI", "Intertek", "KBC", "Solomon", "Shell Catalyst"]
const CATEGORIES = ["Catalyst", "Crude Analysis", "Inspection", "Equipment Analysis", "Process Optimization", "Performance Review"]
const UNITS = ["CDU", "VDU", "HCR", "CCR", "NHT", "RFCC", "공통"]

export default function ThirdPartyAnalysisPage() {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterVendor, setFilterVendor] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [selectedData, setSelectedData] = useState<typeof SAMPLE_ANALYSIS_DATA[0] | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // 업로드 폼 상태
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadVendor, setUploadVendor] = useState("")
  const [uploadCategory, setUploadCategory] = useState("")
  const [uploadUnit, setUploadUnit] = useState("")
  const [uploadSummary, setUploadSummary] = useState("")
  const [uploadTags, setUploadTags] = useState("")

  const filteredData = SAMPLE_ANALYSIS_DATA.filter(data => {
    const matchesSearch = data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.summary.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVendor = filterVendor === "all" || data.vendor === filterVendor
    const matchesCategory = filterCategory === "all" || data.category === filterCategory
    return matchesSearch && matchesVendor && matchesCategory
  })

  const handleUpload = () => {
    alert("분석 데이터가 업로드되었습니다.")
    setShowUploadDialog(false)
    setUploadTitle("")
    setUploadVendor("")
    setUploadCategory("")
    setUploadUnit("")
    setUploadSummary("")
    setUploadTags("")
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">3rd Party 분석 데이터</h1>
            </div>
            <Button className="gap-2" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4" />
              분석 데이터 업로드
            </Button>
          </div>
        </header>

        <main className="p-6">
          {/* 설명 */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800">
                외부 3rd Party(UOP, Axens, Intertek 등)로부터 받은 분석 리포트, Catalyst 성능 테스트 결과, 
                Crude Assay 데이터 등을 이곳에 업로드하여 회사 내부 기술 자산으로 관리합니다.
              </p>
            </CardContent>
          </Card>

          {/* 필터 및 검색 */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="분석 데이터 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterVendor} onValueChange={setFilterVendor}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="업체 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 업체</SelectItem>
                {VENDORS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{SAMPLE_ANALYSIS_DATA.length}</div>
                <div className="text-sm text-muted-foreground">전체 문서</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">
                  {SAMPLE_ANALYSIS_DATA.filter(d => d.status === "verified").length}
                </div>
                <div className="text-sm text-muted-foreground">검증 완료</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600">
                  {SAMPLE_ANALYSIS_DATA.filter(d => d.status === "pending").length}
                </div>
                <div className="text-sm text-muted-foreground">검토 대기</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{new Set(SAMPLE_ANALYSIS_DATA.map(d => d.vendor)).size}</div>
                <div className="text-sm text-muted-foreground">협력 업체</div>
              </CardContent>
            </Card>
          </div>

          {/* 데이터 목록 */}
          <div className="space-y-3">
            {filteredData.map(data => (
              <Card key={data.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{data.vendor}</Badge>
                        <Badge variant="secondary">{data.category}</Badge>
                        <Badge variant="outline">{data.unit}</Badge>
                        <Badge variant={data.status === "verified" ? "default" : "secondary"}>
                          {data.status === "verified" ? "검증완료" : "검토대기"}
                        </Badge>
                      </div>
                      <h3 className="font-medium mb-1">{data.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{data.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {data.uploadDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {data.fileType}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {data.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedData(data); setShowDetailDialog(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        {/* 업로드 다이얼로그 */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                3rd Party 분석 데이터 업로드
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">문서 제목 *</label>
                <Input 
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="예: Catalyst Performance Test Report"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">업체 *</label>
                  <Select value={uploadVendor} onValueChange={setUploadVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="업체 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDORS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">카테고리 *</label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">관련 Unit</label>
                <Select value={uploadUnit} onValueChange={setUploadUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unit 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">요약</label>
                <Textarea 
                  value={uploadSummary}
                  onChange={(e) => setUploadSummary(e.target.value)}
                  placeholder="분석 데이터의 주요 내용을 요약해주세요"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">태그 (쉼표로 구분)</label>
                <Input 
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="예: Catalyst, HCR, Performance"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">파일 첨부</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">클릭하여 파일을 선택하거나 드래그 앤 드롭</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Excel, Word 지원</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>취소</Button>
              <Button onClick={handleUpload} disabled={!uploadTitle || !uploadVendor || !uploadCategory}>
                업로드
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 상세 보기 다이얼로그 */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedData?.title}</DialogTitle>
            </DialogHeader>
            {selectedData && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedData.vendor}</Badge>
                  <Badge variant="secondary">{selectedData.category}</Badge>
                  <Badge variant="outline">{selectedData.unit}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">업로드 일자:</span> {selectedData.uploadDate}
                  </div>
                  <div>
                    <span className="text-muted-foreground">파일 형식:</span> {selectedData.fileType}
                  </div>
                  <div>
                    <span className="text-muted-foreground">상태:</span> {selectedData.status === "verified" ? "검증 완료" : "검토 대기"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">요약</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedData.summary}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">태그</label>
                  <div className="flex gap-1 mt-1">
                    {selectedData.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>닫기</Button>
              <Button>
                <Download className="h-4 w-4 mr-1" />
                다운로드
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
