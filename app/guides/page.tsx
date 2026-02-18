"use client"

import Link from "next/link"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { GuideTemplateForm } from "@/components/guide-template-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, BookOpen, Calendar, Users, Eye, Edit, Copy, X, ChevronLeft } from "lucide-react"

// 샘플 가이드 데이터
const SAMPLE_GUIDES = [
  {
    id: "1",
    name: "HCR Mode Switch Guide",
    unit: "HCR",
    category: "운전 모드 전환",
    lastUpdated: "2026-02-01",
    author: "김지수",
    version: 3,
    usageCount: 24,
    status: "active"
  },
  {
    id: "2",
    name: "CDU Crude Switch Guide",
    unit: "CDU",
    category: "원유 전환",
    lastUpdated: "2026-01-28",
    author: "이철수",
    version: 5,
    usageCount: 42,
    status: "active"
  },
  {
    id: "3",
    name: "VDU Vacuum Adjustment Guide",
    unit: "VDU",
    category: "진공도 조정",
    lastUpdated: "2026-01-25",
    author: "박영희",
    version: 2,
    usageCount: 15,
    status: "active"
  },
  {
    id: "4",
    name: "CCR Catalyst Regeneration Guide",
    unit: "CCR",
    category: "촉매 재생",
    lastUpdated: "2026-01-20",
    author: "김지수",
    version: 4,
    usageCount: 31,
    status: "draft"
  }
]

export default function GuidesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUnit, setFilterUnit] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit" | "view">("list")
  const [selectedGuide, setSelectedGuide] = useState<typeof SAMPLE_GUIDES[0] | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)

  const filteredGuides = SAMPLE_GUIDES.filter(guide => {
    const matchesSearch = guide.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUnit = filterUnit === "all" || guide.unit === filterUnit
    return matchesSearch && matchesUnit
  })

  // 새 가이드 생성 모드
  if (viewMode === "create") {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setViewMode("list")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                목록으로
              </Button>
              <h1 className="text-lg font-semibold text-foreground">새 가이드 템플릿 생성</h1>
            </div>
          </header>
          <main className="p-6 max-w-4xl mx-auto">
            <GuideTemplateForm onComplete={() => setViewMode("list")} />
          </main>
        </div>
      </AppShell>
    )
  }

  // 가이드 수정 모드
  if (viewMode === "edit" && selectedGuide) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => { setViewMode("list"); setSelectedGuide(null) }}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                목록으로
              </Button>
              <h1 className="text-lg font-semibold text-foreground">가이드 수정: {selectedGuide.name}</h1>
            </div>
          </header>
          <main className="p-6 max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedGuide.unit}</Badge>
                  <Badge variant="secondary">{selectedGuide.category}</Badge>
                  <Badge variant="outline">v{selectedGuide.version}</Badge>
                </div>
                <CardTitle>{selectedGuide.name}</CardTitle>
                <CardDescription>마지막 수정: {selectedGuide.lastUpdated} | 작성자: {selectedGuide.author}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">가이드 이름</label>
                  <Input defaultValue={selectedGuide.name} />
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
                  <label className="text-sm font-medium">가이드 내용</label>
                  <Textarea 
                    className="min-h-[300px]" 
                    defaultValue={`[${selectedGuide.name}]\n\n섹션 1: 전환 전 확인사항\n- 현재 운전 모드: \n- 목표 운전 모드: \n- Reactor Inlet Temp (Guide): 380-400°C\n- Reactor Inlet Temp (Actual): ___°C\n\n섹션 2: 전환 절차\n- Feed Rate 조정 (Guide): 서서히 80% → 60% → 목표치\n- Feed Rate 현재값: ___m3/hr\n\n섹션 3: 전환 후 확인사항\n- Product Quality 확인: [ ] Sulfur < 10ppm\n- Catalyst Activity 확인: [ ] WABT 기준 이내`}
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
          </main>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">가이드 관리</h1>
            <Button className="gap-2" onClick={() => setViewMode("create")}>
              <Plus className="h-4 w-4" />
              새 가이드 템플릿 생성
            </Button>
          </div>
        </header>
        
        <main className="p-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="가이드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
                    <p className="text-2xl font-bold">{SAMPLE_GUIDES.length}</p>
                    <p className="text-sm text-muted-foreground">전체 가이드</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{SAMPLE_GUIDES.reduce((acc, g) => acc + g.usageCount, 0)}</p>
                    <p className="text-sm text-muted-foreground">총 사용 횟수</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-muted-foreground">이번 주 배포</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-sm text-muted-foreground">참여 작성자</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Guide List */}
          <div className="space-y-4">
            {filteredGuides.map(guide => (
              <Card key={guide.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{guide.unit}</Badge>
                      <Badge variant="secondary">{guide.category}</Badge>
                      {guide.status === "draft" && (
                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                          초안
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setSelectedGuide(guide); setShowViewDialog(true) }}>
                        <Eye className="h-4 w-4" />
                        보기
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setSelectedGuide(guide); setViewMode("edit") }}>
                        <Edit className="h-4 w-4" />
                        수정
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => alert(`"${guide.name}"이(가) 복사되었습니다.`)}>
                        <Copy className="h-4 w-4" />
                        복사
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base mb-2">{guide.name}</CardTitle>
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
        </main>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedGuide?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedGuide && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedGuide.unit}</Badge>
                  <Badge variant="secondary">{selectedGuide.category}</Badge>
                  <Badge variant="outline">v{selectedGuide.version}</Badge>
                </div>
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
{`[${selectedGuide.name}]

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
              <Button onClick={() => { setShowViewDialog(false); setViewMode("edit") }}>
                <Edit className="h-4 w-4 mr-1" />
                수정하기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
