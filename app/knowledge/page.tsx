"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { GuideTemplateForm } from "@/components/guide-template-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  BookOpen, 
  Search,
  FileText,
  Clock,
  Star,
  ArrowRight,
  Plus,
  Filter,
  Calculator,
  RefreshCw,
  Play,
  Download,
  Edit,
  MoreVertical,
  ChevronLeft,
  Copy,
  Eye,
  Send,
  Users,
  Calendar
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 반복성 가이드 데이터
const repeatableGuides = [
  {
    id: "1",
    title: "HCR Reactor 온도 조정 가이드",
    name: "HCR Reactor 온도 조정 가이드",
    category: "Operation",
    unit: "HCR",
    lastUpdated: "2025-01-15",
    author: "김지수",
    version: 3,
    usageCount: 45,
    starred: true,
    status: "active",
    description: "Reactor inlet 온도 변동 시 Feed rate 및 Quench 조정 절차"
  },
  {
    id: "2",
    title: "CDU 원유 전환 절차",
    name: "CDU 원유 전환 절차",
    category: "Switchover",
    unit: "CDU",
    lastUpdated: "2025-01-20",
    author: "이철수",
    version: 5,
    usageCount: 32,
    starred: true,
    status: "active",
    description: "원유 Grade 변경 시 운전 조건 조정 가이드"
  },
  {
    id: "3",
    title: "VDU 진공도 회복 절차",
    name: "VDU 진공도 회복 절차",
    category: "Troubleshooting",
    unit: "VDU",
    lastUpdated: "2025-01-28",
    author: "박영희",
    version: 2,
    usageCount: 28,
    starred: false,
    status: "active",
    description: "진공도 저하 시 원인별 대응 절차"
  },
  {
    id: "4",
    title: "CCR Regenerator 온도 관리",
    name: "CCR Regenerator 온도 관리",
    category: "Operation",
    unit: "CCR",
    lastUpdated: "2025-02-01",
    author: "김지수",
    version: 4,
    usageCount: 21,
    starred: false,
    status: "draft",
    description: "Coke burn zone 온도 프로파일 최적화 가이드"
  },
]

// 반복성 계산시트 데이터
const calculationSheets = [
  {
    id: "1",
    title: "HCR WABT 계산",
    category: "Catalyst",
    unit: "HCR",
    lastUpdated: "2025-01-18",
    author: "김지수",
    version: 2,
    usageCount: 89,
    starred: true,
    description: "Weighted Average Bed Temperature 계산",
    inputs: ["Bed 1 Inlet", "Bed 1 Outlet", "Bed 2 Inlet", "Bed 2 Outlet", "Bed 3 Inlet", "Bed 3 Outlet"],
    outputs: ["WABT", "Delta T per Bed"]
  },
  {
    id: "2",
    title: "열교환기 효율 계산",
    category: "Equipment",
    unit: "Common",
    lastUpdated: "2025-01-22",
    author: "이철수",
    version: 3,
    usageCount: 67,
    starred: true,
    description: "열교환기 열전달 효율 및 Fouling Factor 계산",
    inputs: ["Hot Side Inlet/Outlet", "Cold Side Inlet/Outlet", "Flow Rate"],
    outputs: ["열효율", "U값", "Fouling Factor"]
  },
  {
    id: "3",
    title: "촉매 수명 예측",
    category: "Catalyst",
    unit: "HCR",
    lastUpdated: "2025-01-25",
    author: "박영희",
    version: 1,
    usageCount: 54,
    starred: false,
    description: "WABT 상승률 기반 EOR 도달 시점 예측",
    inputs: ["Current WABT", "SOR WABT", "EOR Target", "운전 일수"],
    outputs: ["예상 잔여 수명", "EOR 도달 예상일"]
  },
  {
    id: "4",
    title: "VDU Flash Zone 온도 계산",
    category: "Process",
    unit: "VDU",
    lastUpdated: "2025-01-30",
    author: "최민호",
    version: 4,
    usageCount: 42,
    starred: false,
    description: "Flash Zone 적정 온도 및 Overflash 계산",
    inputs: ["Feed Rate", "Feed Temp", "Column Pressure", "Target Cut Point"],
    outputs: ["Flash Zone Temp", "Overflash %"]
  },
]

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState("guides")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUnit, setFilterUnit] = useState<string>("all")
  
  // 가이드 관련 상태
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit" | "view" | "execute">("list")
  const [selectedGuide, setSelectedGuide] = useState<typeof repeatableGuides[0] | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)

  // 계산시트 관련 상태
  const [selectedCalcSheet, setSelectedCalcSheet] = useState<typeof calculationSheets[0] | null>(null)
  const [showCalcDialog, setShowCalcDialog] = useState(false)

  const filteredGuides = repeatableGuides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnit = filterUnit === "all" || guide.unit === filterUnit
    return matchesSearch && matchesUnit
  })

  const filteredCalcSheets = calculationSheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sheet.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnit = filterUnit === "all" || sheet.unit === filterUnit
    return matchesSearch && matchesUnit
  })

  // 가이드 실행 모드 (수치 입력 후 이벤트화)
  if (viewMode === "execute" && selectedGuide) {
    return (
      <AppShell>
        <div className="h-full bg-background flex flex-col">
          <header className="border-b border-border bg-card flex-shrink-0">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => { setViewMode("list"); setSelectedGuide(null) }}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                목록으로
              </Button>
              <h1 className="text-lg font-semibold text-foreground">가이드 실행: {selectedGuide.title}</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <GuideTemplateForm onComplete={() => { setViewMode("list"); setSelectedGuide(null) }} />
            </div>
          </main>
        </div>
      </AppShell>
    )
  }

  // 새 가이드 생성 모드
  if (viewMode === "create") {
    return (
      <AppShell>
        <div className="h-full bg-background flex flex-col">
          <header className="border-b border-border bg-card flex-shrink-0">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setViewMode("list")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                목록으로
              </Button>
              <h1 className="text-lg font-semibold text-foreground">새 가이드 템플릿 생성</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <GuideTemplateForm onComplete={() => setViewMode("list")} />
            </div>
          </main>
        </div>
      </AppShell>
    )
  }

  // 가이드 수정 모드
  if (viewMode === "edit" && selectedGuide) {
    return (
      <AppShell>
        <div className="h-full bg-background flex flex-col">
          <header className="border-b border-border bg-card flex-shrink-0">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => { setViewMode("list"); setSelectedGuide(null) }}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                목록으로
              </Button>
              <h1 className="text-lg font-semibold text-foreground">가이드 수정: {selectedGuide.title}</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{selectedGuide.unit}</Badge>
                    <Badge variant="secondary">{selectedGuide.category}</Badge>
                    <Badge variant="outline">v{selectedGuide.version}</Badge>
                  </div>
                  <CardTitle>{selectedGuide.title}</CardTitle>
                  <CardDescription>마지막 수정: {selectedGuide.lastUpdated} | 작성자: {selectedGuide.author}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">가이드 이름</label>
                    <Input defaultValue={selectedGuide.title} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unit</label>
                      <Select defaultValue={selectedGuide.unit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDU">CDU</SelectItem>
                          <SelectItem value="VDU">VDU</SelectItem>
                          <SelectItem value="HCR">HCR</SelectItem>
                          <SelectItem value="CCR">CCR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">카테고리</label>
                      <Input defaultValue={selectedGuide.category} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">설명</label>
                    <Input defaultValue={selectedGuide.description} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">가이드 내용</label>
                    <Textarea 
                      className="min-h-[300px]" 
                      defaultValue={`[${selectedGuide.title}]\n\n섹션 1: 전환 전 확인사항\n- 현재 운전 모드: \n- 목표 운전 모드: \n- Reactor Inlet Temp (Guide): 380-400°C\n- Reactor Inlet Temp (Actual): ___°C\n\n섹션 2: 전환 절차\n- Feed Rate 조정 (Guide): 서서히 80% → 60% → 목표치\n- Feed Rate 현재값: ___m3/hr\n\n섹션 3: 전환 후 확인사항\n- Product Quality 확인: [ ] Sulfur < 10ppm\n- Catalyst Activity 확인: [ ] WABT 기준 이내`}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setViewMode("list"); setSelectedGuide(null) }}>취소</Button>
                <Button onClick={() => { alert("가이드가 저장되었습니다."); setViewMode("list"); setSelectedGuide(null) }}>
                  저장
                </Button>
              </div>
            </div>
          </main>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Operating Playbooks</h1>
              <p className="text-sm text-muted-foreground">반복성 가이드 및 계산시트 관리</p>
            </div>
            {activeTab === "guides" && (
              <Button onClick={() => setViewMode("create")}>
                <Plus className="h-4 w-4 mr-2" />
                새 가이드 템플릿 생성
              </Button>
            )}
            {activeTab === "sheets" && (
              <Button onClick={() => alert("새 계산시트 생성")}>
                <Plus className="h-4 w-4 mr-2" />
                새 계산시트 생성
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="가이드 또는 계산시트 검색..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Unit 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 Unit</SelectItem>
                <SelectItem value="CDU">CDU</SelectItem>
                <SelectItem value="VDU">VDU</SelectItem>
                <SelectItem value="HCR">HCR</SelectItem>
                <SelectItem value="CCR">CCR</SelectItem>
                <SelectItem value="Common">Common</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{repeatableGuides.length}</p>
                    <p className="text-sm text-muted-foreground">반복성 가이드</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{calculationSheets.length}</p>
                    <p className="text-sm text-muted-foreground">계산시트</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{repeatableGuides.reduce((acc, g) => acc + g.usageCount, 0) + calculationSheets.reduce((acc, s) => acc + s.usageCount, 0)}</p>
                    <p className="text-sm text-muted-foreground">총 사용 횟수</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{repeatableGuides.filter(g => g.starred).length + calculationSheets.filter(s => s.starred).length}</p>
                    <p className="text-sm text-muted-foreground">즐겨찾기</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Categories */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="guides" className="gap-2">
                <BookOpen className="h-4 w-4" />
                반복성 가이드
              </TabsTrigger>
              <TabsTrigger value="sheets" className="gap-2">
                <Calculator className="h-4 w-4" />
                반복성 계산시트
              </TabsTrigger>
            </TabsList>

            {/* 반복성 가이드 탭 */}
            <TabsContent value="guides">
              <div className="space-y-4">
                {filteredGuides.map((guide) => (
                  <Card key={guide.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {guide.starred && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          <Badge variant="outline">{guide.unit}</Badge>
                          <Badge variant="secondary">{guide.category}</Badge>
                          {guide.status === "draft" && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              초안
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="gap-1" 
                            onClick={() => { setSelectedGuide(guide); setViewMode("execute") }}
                          >
                            <Play className="h-4 w-4" />
                            실행
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setSelectedGuide(guide); setShowViewDialog(true) }}>
                            <Eye className="h-4 w-4" />
                            보기
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setSelectedGuide(guide); setViewMode("edit") }}>
                            <Edit className="h-4 w-4" />
                            수정
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => alert(`"${guide.title}"이(가) 복사되었습니다.`)}>
                            <Copy className="h-4 w-4" />
                            복사
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-base mb-2">{guide.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-2">{guide.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>v{guide.version}</span>
                        <span>|</span>
                        <span>작성자: {guide.author}</span>
                        <span>|</span>
                        <span>최근 수정: {guide.lastUpdated}</span>
                        <span>|</span>
                        <span>사용 횟수: {guide.usageCount}회</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 반복성 계산시트 탭 */}
            <TabsContent value="sheets">
              <div className="space-y-4">
                {filteredCalcSheets.map((sheet) => (
                  <Card key={sheet.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sheet.starred && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          <Badge variant="outline">{sheet.unit}</Badge>
                          <Badge variant="secondary">{sheet.category}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="gap-1" 
                            onClick={() => { setSelectedCalcSheet(sheet); setShowCalcDialog(true) }}
                          >
                            <Calculator className="h-4 w-4" />
                            계산 실행
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => alert(`${sheet.title} 편집`)}>
                            <Edit className="h-4 w-4" />
                            편집
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => alert(`${sheet.title} 다운로드`)}>
                            <Download className="h-4 w-4" />
                            다운로드
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-base mb-2">{sheet.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-2">{sheet.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>v{sheet.version}</span>
                        <span>|</span>
                        <span>작성자: {sheet.author}</span>
                        <span>|</span>
                        <span>최근 수정: {sheet.lastUpdated}</span>
                        <span>|</span>
                        <span>사용 횟수: {sheet.usageCount}회</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <span><strong>입력:</strong> {sheet.inputs?.slice(0, 3).join(", ")}{(sheet.inputs?.length || 0) > 3 && ` 외 ${(sheet.inputs?.length || 0) - 3}개`}</span>
                        <span>|</span>
                        <span><strong>출력:</strong> {sheet.outputs?.join(", ")}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedGuide?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedGuide && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedGuide.unit}</Badge>
                  <Badge variant="secondary">{selectedGuide.category}</Badge>
                  <Badge variant="outline">v{selectedGuide.version}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selectedGuide.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">작성자:</span> {selectedGuide.author}
                  </div>
                  <div>
                    <span className="text-muted-foreground">마지막 수정:</span> {selectedGuide.lastUpdated}
                  </div>
                  <div>
                    <span className="text-muted-foreground">사용 횟수:</span> {selectedGuide.usageCount}회
                  </div>
                  <div>
                    <span className="text-muted-foreground">상태:</span> {selectedGuide.status === "active" ? "활성" : "초안"}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">가이드 내용</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
{`[${selectedGuide.title}]

섹션 1: 전환 전 확인사항
- 현재 운전 모드: [선택]
- 목표 운전 모드: [선택]
- Reactor Inlet Temp (Guide): 380-400°C
- Reactor Inlet Temp (Actual): ___°C

섹션 2: 전환 절차
- Feed Rate 조정 (Guide): 서서히 80% → 60% → 목표치
- Feed Rate 현재값: ___m3/hr

섹션 3: 전환 후 확인사항
- Product Quality 확인: [ ] Sulfur < 10ppm
- Catalyst Activity 확인: [ ] WABT 기준 이내`}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>닫기</Button>
              <Button variant="outline" onClick={() => { setShowViewDialog(false); setViewMode("edit") }}>
                <Edit className="h-4 w-4 mr-1" />
                수정하기
              </Button>
              <Button onClick={() => { setShowViewDialog(false); setViewMode("execute") }}>
                <Play className="h-4 w-4 mr-1" />
                실행하기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Calc Sheet Dialog */}
        <Dialog open={showCalcDialog} onOpenChange={setShowCalcDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {selectedCalcSheet?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedCalcSheet && (
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">{selectedCalcSheet.description}</p>
                
                <div className="space-y-4 border rounded-lg p-4">
                  <h4 className="font-medium">입력값</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCalcSheet.inputs?.map((input, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-sm">{input}</label>
                        <Input type="number" placeholder="값 입력" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium">계산 결과</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedCalcSheet.outputs?.map((output, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground">{output}:</span>
                        <span className="font-medium">-</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCalcDialog(false)}>닫기</Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" />
                결과 다운로드
              </Button>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-1" />
                이벤트으로 송부
              </Button>
              <Button onClick={() => alert("계산 실행")}>
                계산 실행
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
