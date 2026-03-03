"use client"

import { useState } from "react"
import { TicketForm } from "@/components/ticket-form"
import { TroubleshootingChat } from "@/components/troubleshooting-chat"
import { GuideTemplateForm } from "@/components/guide-template-form"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { ChevronLeft, FileText, MessageSquare, BookOpen, FlaskConical, Cpu, Beaker, CalendarClock, CircleCheck, AlertTriangle, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type TicketType = "general" | "troubleshooting" | "guide" | "analysis-request" | "model-improvement" | "process-test" | null

export default function NewTicketPage() {
  const [selectedType, setSelectedType] = useState<TicketType>(null)

  if (!selectedType) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4 flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 bg-transparent">
                  <ChevronLeft className="h-4 w-4" />
                  뒤로
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Event Request</h1>
                <p className="text-xs text-muted-foreground">목적에 맞는 요청 유형을 선택해주세요</p>
              </div>
            </div>
          </header>
          <main className="px-6 py-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">어떤 유형의 Event Request를 생성하시겠습니까?</h2>
              <p className="text-muted-foreground">6가지 요청 유형 중 목적에 맞는 항목을 선택해주세요</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {/* 1. 일반 기술 문의 */}
              <Card 
                className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
                onClick={() => setSelectedType("general")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base">기술검토 요청</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    공정 개선, 분석 요청, 변경 요청 등 일반적인 기술 검토 이벤트
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                      담당자 지정 및 Work Package 관리
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                      공정 데이터 참조 및 첨부
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                      체계적 문서화 및 이력 관리
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 2. Troubleshooting 채팅 */}
              <Card 
                className="cursor-pointer hover:border-orange-500 hover:shadow-lg transition-all duration-200 group"
                onClick={() => setSelectedType("troubleshooting")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                    <MessageSquare className="h-7 w-7 text-orange-500" />
                  </div>
                  <CardTitle className="text-base">Troubleshooting 채팅</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    긴급 트러블 발생 시 여러 담당자가 실시간으로 논의하는 채팅방
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />
                      실시간 다자간 커뮤니케이션
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />
                      빠른 문제 원인 파악 및 대응
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />
                      트러블 해결 과정 자동 기록
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 3. 반복성 가이드 */}
              <Card 
                className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 group"
                onClick={() => setSelectedType("guide")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                    <BookOpen className="h-7 w-7 text-blue-500" />
                  </div>
                  <CardTitle className="text-base">반복성 가이드 작성</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Mode Switch, 원유 전환 등 반복되는 운전 가이드 작성 및 배포
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0" />
                      사전 정의된 템플릿 활용
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0" />
                      Actual 값만 업데이트하여 빠른 작성
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0" />
                      관련 팀에 즉시 배포
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 4. 분석 요청 */}
              <Card 
                className="cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all duration-200 group"
                onClick={() => setSelectedType("analysis-request")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
                    <FlaskConical className="h-7 w-7 text-emerald-500" />
                  </div>
                  <CardTitle className="text-base">분석 요청</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    내부/외부 분석 기관에 촉매, 원료, 제품 등의 분석을 요청
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full flex-shrink-0" />
                      촉매기술팀 / 대전연구소 / 3rd Party
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full flex-shrink-0" />
                      샘플 정보 및 분석 항목 지정
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-emerald-500 rounded-full flex-shrink-0" />
                      분석 결과 자동 연동 및 이력 관리
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 5. AI/ML 모델 관련 요청 (NEW) */}
              <Card 
                className="cursor-pointer hover:border-violet-500 hover:shadow-lg transition-all duration-200 group relative"
                onClick={() => setSelectedType("model-improvement")}
              >
                <Badge className="absolute top-3 right-3 text-xs bg-violet-500 hover:bg-violet-500">New</Badge>
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-14 h-14 bg-violet-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
                    <Cpu className="h-7 w-7 text-violet-500" />
                  </div>
                  <CardTitle className="text-base">AI/ML 모델 관련 요청</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    신규 모델 구성 요청 또는 기존 모델 개선/장애 해결 요청
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-violet-500 rounded-full flex-shrink-0" />
                      신규 AI/ML 모델 구성 요청
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-violet-500 rounded-full flex-shrink-0" />
                      기존 모델 개선 / M2M 장애 / APC 가동
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-violet-500 rounded-full flex-shrink-0" />
                      Digital 팀 연동 및 이력 추적
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 6. 실공정 테스트 진행 (NEW) */}
              <Card 
                className="cursor-pointer hover:border-teal-500 hover:shadow-lg transition-all duration-200 group relative"
                onClick={() => setSelectedType("process-test")}
              >
                <Badge className="absolute top-3 right-3 text-xs bg-teal-500 hover:bg-teal-500">New</Badge>
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-14 h-14 bg-teal-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-teal-500/20 transition-colors">
                    <Beaker className="h-7 w-7 text-teal-500" />
                  </div>
                  <CardTitle className="text-base">실공정 테스트 진행</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    가설 검증을 위한 운전변수 조절 테스트 및 결과 Tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-teal-500 rounded-full flex-shrink-0" />
                      테스트 시작/종료 일자 및 운전 가이드
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-teal-500 rounded-full flex-shrink-0" />
                      생산팀 리뷰 및 승인 프로세스
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-teal-500 rounded-full flex-shrink-0" />
                      종료 후 30일 내 Feedback 의무화
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </AppShell>
    )
  }

  // Troubleshooting
  if (selectedType === "troubleshooting") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2 bg-transparent" onClick={() => setSelectedType(null)}>
              <ChevronLeft className="h-4 w-4" />
              유형 선택으로
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Troubleshooting 채팅방 생성</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <TroubleshootingChat />
        </main>
      </div>
    )
  }

  // 반복성 가이드
  if (selectedType === "guide") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2 bg-transparent" onClick={() => setSelectedType(null)}>
              <ChevronLeft className="h-4 w-4" />
              유형 선택으로
            </Button>
            <h1 className="text-lg font-semibold text-foreground">반복성 가이드 작성 및 배포</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <GuideTemplateForm onComplete={() => setSelectedType(null)} />
        </main>
      </div>
    )
  }

  // 분석 요청
  if (selectedType === "analysis-request") {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2 bg-transparent" onClick={() => setSelectedType(null)}>
                <ChevronLeft className="h-4 w-4" />
                유형 선택으로
              </Button>
              <h1 className="text-lg font-semibold text-foreground">분석 요청 이벤트 생성</h1>
            </div>
          </header>
          <main className="px-6 py-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-emerald-500" />
                  분석 요청 정보
                </CardTitle>
                <CardDescription>분석 대상 및 요청 사항을 입력해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>분석 요청 제목 *</Label>
                  <Input placeholder="예: HCR Catalyst 활성도 분석 요청" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>분석 수행 기관 *</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="기관 선택" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="catalyst-team">촉매기술팀 (내부)</SelectItem>
                        <SelectItem value="daejon-lab">대전연구소 (내부)</SelectItem>
                        <SelectItem value="uop">UOP (3rd Party)</SelectItem>
                        <SelectItem value="intertek">Intertek (3rd Party)</SelectItem>
                        <SelectItem value="axens">Axens (3rd Party)</SelectItem>
                        <SelectItem value="htri">HTRI (3rd Party)</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>분석 카테고리 *</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="catalyst">촉매 분석</SelectItem>
                        <SelectItem value="crude-assay">원유 분석 (Crude Assay)</SelectItem>
                        <SelectItem value="product-quality">제품 품질 분석</SelectItem>
                        <SelectItem value="material">소재 / 재질 분석</SelectItem>
                        <SelectItem value="corrosion">부식 분석</SelectItem>
                        <SelectItem value="fouling">Fouling 분석</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>샘플 정보</Label>
                  <Textarea placeholder={"분석 샘플에 대한 상세 정보를 기입해주세요.\n예: 샘플명, 채취 위치, 채취 일시, 샘플 상태, 수량 등"} className="min-h-24" />
                </div>
                <div className="space-y-2">
                  <Label>분석 요청 항목 *</Label>
                  <Textarea placeholder={"분석 항목 및 시험 방법을 상세히 기술해주세요.\n예: Surface Area (BET), Pore Volume, Metal Contents (ICP), Coke Content 등"} className="min-h-24" />
                </div>
                <div className="space-y-2">
                  <Label>분석 목적 및 배경</Label>
                  <Textarea placeholder="분석 요청 배경과 목적, 결과 활용 계획을 기술해주세요." className="min-h-20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>희망 완료일</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>결과 공유 대상</Label>
                    <Input placeholder="예: Process Eng. 김철수, Operations 박영희" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" className="bg-transparent" onClick={() => setSelectedType(null)}>취소</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { alert("분석 요청 이벤트이 생성되었습니다."); setSelectedType(null) }}>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    분석 요청 생성
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </AppShell>
    )
  }

  // 모델 개선 요청
  if (selectedType === "model-improvement") {
    return <ModelImprovementForm onBack={() => setSelectedType(null)} />
  }

  // 실공정 테스트
  if (selectedType === "process-test") {
    return <ProcessTestForm onBack={() => setSelectedType(null)} />
  }

  // 일반 기술 문의 (default)
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2 bg-transparent" onClick={() => setSelectedType(null)}>
            <ChevronLeft className="h-4 w-4" />
            유형 선택으로
          </Button>
          <h1 className="text-lg font-semibold text-foreground">기술검토 요청 이벤트 생성</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <TicketForm />
      </main>
    </div>
  )
}


// ===================== AI/ML 모델 관련 요청 폼 =====================
function ModelImprovementForm({ onBack }: { onBack: () => void }) {
  const [subType, setSubType] = useState<"new-model" | "existing-improvement" | null>(null)
  const [requestCategory, setRequestCategory] = useState<string>("")
  
  // 신규 모델 구성 폼 상태
  const [modelName, setModelName] = useState("")
  const [modelPurpose, setModelPurpose] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const [equipment, setEquipment] = useState("")
  const [description, setDescription] = useState("")
  const [inputTags, setInputTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [outputTag, setOutputTag] = useState("") // 실측값 태그
  const [guideMin, setGuideMin] = useState("") // 가이드 최소값
  const [guideMax, setGuideMax] = useState("") // 가이드 최대값
  const [trainingFrom, setTrainingFrom] = useState("")
  const [trainingTo, setTrainingTo] = useState("")
  
  const categoryInfo: Record<string, { receivingTeam: string; description: string }> = {
    "model-rebuild": { receivingTeam: "DX Modeling팀", description: "AI/ML 또는 RTO 모델의 성능이 저하되어 모델 재학습 또는 구조 변경이 필요한 경우" },
    "m2m-network": { receivingTeam: "IT인프라팀", description: "모델과 DCS/APC 간 M2M 네트워크 통신 장애로 데이터 전송이 안 되는 경우" },
    "apc-activation": { receivingTeam: "APC운영팀", description: "APC 컨트롤러의 가동/재가동이 필요하거나, DCS와의 연동이 끊긴 경우" },
  }

  const PURPOSE_OPTIONS = ["공정 최적화", "이상 감지", "품질 예측", "에너지 절감", "촉매 성능 예측", "수율 예측", "기타"]
  const UNITS = ["CDU", "VDU", "HCR", "CCR", "DHT", "NHT", "VGOFCC", "RFCC", "Utilities"]

  const addTag = () => {
    if (tagInput.trim() && !inputTags.includes(tagInput.trim())) {
      setInputTags([...inputTags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setInputTags(inputTags.filter(t => t !== tag))
  }

  // 서브타입 선택 화면
  if (!subType) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2 bg-transparent" onClick={onBack}>
                <ChevronLeft className="h-4 w-4" />
                유형 선택으로
              </Button>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-violet-500" />
                <h1 className="text-lg font-semibold text-foreground">AI/ML 모델 관련 요청</h1>
              </div>
            </div>
          </header>
          <main className="px-6 py-10 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground mb-2">어떤 요청을 하시겠습니까?</h2>
              <p className="text-sm text-muted-foreground">신규 모델 구성 또는 기존 모델 개선 중 선택해주세요</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* 신규 모델 구성 */}
              <Card 
                className="cursor-pointer hover:border-violet-500 hover:shadow-lg transition-all duration-200 group"
                onClick={() => setSubType("new-model")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
                    <FlaskConical className="h-8 w-8 text-violet-500" />
                  </div>
                  <CardTitle className="text-lg">신규 모델 구성</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    새로운 AI/ML 예측 모델 구성을 요청합니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-violet-500 rounded-full flex-shrink-0" />
                      모델 목적 및 대상 설비 지정
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-violet-500 rounded-full flex-shrink-0" />
                      입력 변수(태그) 및 학습 기간 설정
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-violet-500 rounded-full flex-shrink-0" />
                      실측값 태그 및 가이드 범위 설정
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 기존 모델 개선 요청 */}
              <Card 
                className="cursor-pointer hover:border-orange-500 hover:shadow-lg transition-all duration-200 group"
                onClick={() => setSubType("existing-improvement")}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                  <CardTitle className="text-lg">기존 모델 개선 요청</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    기존 모델의 성능 개선, 장애 해결, 연동 요청
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />
                      모델 재구성 / 재학습 요청
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />
                      M2M 네트워크 장애 해결
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />
                      APC 가동/연동 요청
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </AppShell>
    )
  }

  // 신규 모델 구성 폼
  if (subType === "new-model") {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2 bg-transparent" onClick={() => setSubType(null)}>
                <ChevronLeft className="h-4 w-4" />
                뒤로
              </Button>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-violet-500" />
                <h1 className="text-lg font-semibold text-foreground">신규 모델 구성 요청</h1>
              </div>
            </div>
          </header>
          <main className="px-6 py-6 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-violet-500" />
                  신규 모델 정보
                </CardTitle>
                <CardDescription>새로운 AI/ML 예측 모델 구성에 필요한 정보를 입력해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 모델명 */}
                <div className="space-y-2">
                  <Label>모델명 *</Label>
                  <Input 
                    placeholder="예: HCR Reactor Outlet Temp 예측 모델" 
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>

                {/* 모델 목적 + Unit + 설비 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>모델 목적 *</Label>
                    <Select value={modelPurpose} onValueChange={setModelPurpose}>
                      <SelectTrigger><SelectValue placeholder="목적 선택" /></SelectTrigger>
                      <SelectContent>
                        {PURPOSE_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>관련 Unit *</Label>
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                      <SelectTrigger><SelectValue placeholder="Unit 선택" /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>대상 설비</Label>
                    <Input 
                      placeholder="예: R-3001" 
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                    />
                  </div>
                </div>

                {/* 설명 */}
                <div className="space-y-2">
                  <Label>모델 설명</Label>
                  <Textarea 
                    placeholder="모델의 목적과 예측 대상에 대해 상세히 기술해주세요"
                    className="min-h-20"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* 입력 변수 (태그) */}
                <div className="space-y-3">
                  <Label>입력 변수 (태그) *</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="태그 입력 후 Enter (예: TI-3001)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>추가</Button>
                  </div>
                  {inputTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {inputTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:bg-muted rounded-full">
                            <CircleCheck className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* 학습 기간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>학습 기간 (시작)</Label>
                    <Input 
                      type="date" 
                      value={trainingFrom}
                      onChange={(e) => setTrainingFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>학습 기간 (종료)</Label>
                    <Input 
                      type="date" 
                      value={trainingTo}
                      onChange={(e) => setTrainingTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* 실측값 태그 및 가이드값 - 대시보드용 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">실측값 비교 대시보드 설정</span>
                  </div>
                  <p className="text-xs text-blue-600">예측값과 실측값을 비교하는 대시보드 구성을 위해 아래 정보를 입력해주세요.</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">실측값 태그 *</Label>
                      <Input 
                        placeholder="예: TI-3002"
                        value={outputTag}
                        onChange={(e) => setOutputTag(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">가이드 최소값</Label>
                      <Input 
                        placeholder="예: 350"
                        value={guideMin}
                        onChange={(e) => setGuideMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">가이드 최대값</Label>
                      <Input 
                        placeholder="예: 400"
                        value={guideMax}
                        onChange={(e) => setGuideMax(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" className="bg-transparent" onClick={() => setSubType(null)}>취소</Button>
                  <Button 
                    className="bg-violet-600 hover:bg-violet-700" 
                    onClick={() => { 
                      alert(`신규 모델 구성 요청이 생성되었습니다.\n\n모델명: ${modelName}\n목적: ${modelPurpose}\nUnit: ${selectedUnit}\n입력 태그: ${inputTags.join(", ")}\n실측값 태그: ${outputTag}\n가이드 범위: ${guideMin} ~ ${guideMax}`); 
                      onBack() 
                    }}
                  >
                    <FlaskConical className="h-4 w-4 mr-2" />
                    모델 구성 요청
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </AppShell>
    )
  }

  // 기존 모델 개선 요청 폼 (기존 포맷 유지)
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2 bg-transparent" onClick={() => setSubType(null)}>
              <ChevronLeft className="h-4 w-4" />
              뒤로
            </Button>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-orange-500" />
              <h1 className="text-lg font-semibold text-foreground">기존 모델 개선 요청</h1>
            </div>
          </div>
        </header>
        <main className="px-6 py-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-orange-500" />
                기존 모델 개선 요청 정보
              </CardTitle>
              <CardDescription>모델 성능 저하 또는 연동 문제에 대한 시정 요청을 작성해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>요청 제목 *</Label>
                <Input placeholder="예: HCR RTO 모델 성능 저하 - 재구성 요청" />
              </div>

              {/* 요청 범주 선택 */}
              <div className="space-y-3">
                <Label>요청 범주 *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "model-rebuild", label: "모델 재구성", icon: "AI/ML, RTO 모델 재학습" },
                    { value: "m2m-network", label: "네트워크 장애해결 (M2M)", icon: "모델-DCS 간 통신 복구" },
                    { value: "apc-activation", label: "APC 가동 요청", icon: "APC 재기동/연동" },
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      className={cn(
                        "border rounded-lg p-4 text-left transition-all cursor-pointer",
                        requestCategory === cat.value
                          ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                          : "hover:border-orange-300 hover:bg-muted/30"
                      )}
                      onClick={() => setRequestCategory(cat.value)}
                    >
                      <p className="text-sm font-medium">{cat.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cat.icon}</p>
                    </button>
                  ))}
                </div>
                {requestCategory && categoryInfo[requestCategory] && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-orange-700">자동 배정 수신팀</span>
                      <Badge className="bg-orange-500 hover:bg-orange-500 text-xs">{categoryInfo[requestCategory].receivingTeam}</Badge>
                    </div>
                    <p className="text-xs text-orange-600">{categoryInfo[requestCategory].description}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>대상 모델 / 시스템 *</Label>
                  <Input placeholder="예: HCR RTO v3.2, CCR APC Controller" />
                </div>
                <div className="space-y-2">
                  <Label>관련 Unit</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Unit 선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDU">CDU</SelectItem>
                      <SelectItem value="VDU">VDU</SelectItem>
                      <SelectItem value="HCR">HCR</SelectItem>
                      <SelectItem value="CCR">CCR</SelectItem>
                      <SelectItem value="RFCC">RFCC</SelectItem>
                      <SelectItem value="common">공통</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>현상 설명 *</Label>
                <Textarea 
                  placeholder={"문제 현상을 상세히 기술해주세요.\n예: RTO 모델 예측값과 실측값 간 편차가 최근 2주간 지속적으로 5% 이상 발생"}
                  className="min-h-24" 
                />
              </div>

              <div className="space-y-2">
                <Label>모델 성능 지표 (선택)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">현재 RMSE / 편차</Label>
                    <Input placeholder="예: 5.2%" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">목표 정확도</Label>
                    <Input placeholder="예: 2% 이내" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">장애 발생일</Label>
                    <Input type="date" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>우선순위</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="우선순위" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 - 긴급 (APC 미가동 등)</SelectItem>
                      <SelectItem value="P2">P2 - 높음 (성능 저하)</SelectItem>
                      <SelectItem value="P3">P3 - 보통 (점진적 저하)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>희망 완료일</Label>
                  <Input type="date" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" className="bg-transparent" onClick={() => setSubType(null)}>취소</Button>
                <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { alert("기존 모델 개선 요청이 생성되었습니다."); onBack() }}>
                  <Cpu className="h-4 w-4 mr-2" />
                  모델 개선 요청 생성
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppShell>
  )
}


// ===================== 실공정 테스트 진행 폼 =====================
function ProcessTestForm({ onBack }: { onBack: () => void }) {
  const [targetVars, setTargetVars] = useState<string[]>([])
  const [varInput, setVarInput] = useState("")
  const [testEndDate, setTestEndDate] = useState("")

  const addVar = () => {
    if (varInput.trim() && !targetVars.includes(varInput.trim())) {
      setTargetVars([...targetVars, varInput.trim()])
      setVarInput("")
    }
  }

  // 테스트 종료일 + 30일 자동 계산
  const feedbackDeadline = testEndDate
    ? (() => {
        const d = new Date(testEndDate)
        d.setDate(d.getDate() + 30)
        return d.toISOString().split("T")[0]
      })()
    : ""

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2 bg-transparent" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
              유형 선택으로
            </Button>
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-teal-500" />
              <h1 className="text-lg font-semibold text-foreground">실공정 테스트 진행</h1>
            </div>
          </div>
        </header>
        <main className="px-6 py-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5 text-teal-500" />
                실공정 테스트 정보
              </CardTitle>
              <CardDescription>가설 검증을 위한 운전변수 조절 테스트를 등록합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>테스트 제목 *</Label>
                <Input placeholder="예: HCR Quench 분배 비율 변경 테스트" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>관련 Unit *</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Unit 선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDU">CDU</SelectItem>
                      <SelectItem value="VDU">VDU</SelectItem>
                      <SelectItem value="HCR">HCR</SelectItem>
                      <SelectItem value="CCR">CCR</SelectItem>
                      <SelectItem value="RFCC">RFCC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>우선순위</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="우선순위" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 - 긴급</SelectItem>
                      <SelectItem value="P2">P2 - 높음</SelectItem>
                      <SelectItem value="P3">P3 - 보통</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 가설 */}
              <div className="space-y-2">
                <Label>검증 가설 *</Label>
                <Textarea 
                  placeholder={"검증하고자 하는 가설을 기술해주세요.\n예: 1st Bed Quench 비율을 45%→40%로 줄이면 2nd Bed 입구 온도가 3~5도 낮아져 촉매 수명 연장 기대"} 
                  className="min-h-24"
                />
              </div>

              {/* 테스트 기간 */}
              <div className="space-y-3">
                <Label>테스트 기간 *</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">시작일</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">종료일</Label>
                    <Input type="date" value={testEndDate} onChange={(e) => setTestEndDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Feedback 마감일 (자동)</Label>
                    <Input type="date" value={feedbackDeadline} readOnly className="bg-muted/50" />
                    <p className="text-xs text-muted-foreground">종료 후 30일</p>
                  </div>
                </div>
              </div>

              {/* 대상 변수 */}
              <div className="space-y-2">
                <Label>대상 운전 변수 *</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="변수명 입력 후 Enter (예: TI-305)"
                    value={varInput}
                    onChange={(e) => setVarInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVar() } }}
                    className="flex-1"
                  />
                  <Button variant="outline" className="bg-transparent" onClick={addVar}>추가</Button>
                </div>
                {targetVars.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {targetVars.map((v) => (
                      <Badge key={v} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setTargetVars(targetVars.filter(x => x !== v))}>
                        {v}
                        <span className="text-xs ml-1">x</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 세부 운전 가이드 */}
              <div className="space-y-2">
                <Label>세부 운전 가이드 *</Label>
                <Textarea
                  placeholder={"테스트를 위한 구체적인 운전 변경 사항을 기술해주세요.\n예: 1st Bed Quench Valve 45%→40% 조정, 2nd Bed Quench Valve 보정.\nReactor dT 모니터링 강화 (1시간 간격 기록)"}
                  className="min-h-28"
                />
              </div>

              {/* 생산팀 리뷰 */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-teal-800">생산팀 사전 리뷰 필수</p>
                    <p className="text-xs text-teal-600 mt-1">실공정 테스트는 생산팀의 사전 리뷰 및 승인 후 진행됩니다. 제출 후 생산팀에 리뷰 요청이 자동 전달됩니다.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-7">
                  <Checkbox id="confirm-safety" />
                  <label htmlFor="confirm-safety" className="text-xs text-teal-700">
                    안전 영향 검토를 완료하였으며, 테스트 중 이상 발생 시 즉시 원복할 준비가 되어있음을 확인합니다.
                  </label>
                </div>
              </div>

              {/* 테스트 Lifecycle 안내 */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-xs font-medium text-foreground mb-3">테스트 Lifecycle</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-background rounded border">
                    <CalendarClock className="h-3 w-3" />
                    <span>생산팀 리뷰</span>
                  </div>
                  <ArrowRight className="h-3 w-3 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-background rounded border">
                    <Beaker className="h-3 w-3" />
                    <span>테스트 진행</span>
                  </div>
                  <ArrowRight className="h-3 w-3 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-background rounded border">
                    <CircleCheck className="h-3 w-3" />
                    <span>테스트 종료</span>
                  </div>
                  <ArrowRight className="h-3 w-3 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-background rounded border">
                    <FileText className="h-3 w-3" />
                    <span>Feedback (30일 내)</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" className="bg-transparent" onClick={onBack}>취소</Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => { alert("실공정 테스트가 등록되었습니다. 생산팀에 리뷰 요청이 전달됩니다."); onBack() }}>
                  <Beaker className="h-4 w-4 mr-2" />
                  테스트 등록 및 리뷰 요청
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppShell>
  )
}
