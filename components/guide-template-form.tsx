"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { BookOpen, CheckCircle, Send, Save, RefreshCw, ChevronRight, AlertTriangle, Info } from "lucide-react"
import { useRouter } from "next/navigation"

// 사전 정의된 가이드 템플릿
const GUIDE_TEMPLATES = [
  {
    id: "hcr-mode-switch",
    name: "HCR Mode Switch Guide",
    unit: "HCR",
    category: "운전 모드 전환",
    description: "HCR Unit의 운전 모드 전환 시 필요한 가이드",
    sections: [
      {
        title: "전환 전 확인사항",
        items: [
          { label: "현재 운전 모드", type: "select", options: ["High Severity", "Low Severity", "Turnaround"], template: "" },
          { label: "목표 운전 모드", type: "select", options: ["High Severity", "Low Severity", "Turnaround"], template: "" },
          { label: "Reactor Inlet Temp (Guide)", type: "text", template: "380-400", unit: "°C" },
          { label: "Reactor Inlet Temp (Actual)", type: "number", template: "", unit: "°C", isActual: true },
          { label: "H2/Oil Ratio (Guide)", type: "text", template: "800-1000", unit: "Nm3/m3" },
          { label: "H2/Oil Ratio (Actual)", type: "number", template: "", unit: "Nm3/m3", isActual: true },
        ]
      },
      {
        title: "전환 절차",
        items: [
          { label: "Feed Rate 조정 (Guide)", type: "text", template: "서서히 80% → 60% → 목표치", unit: "" },
          { label: "Feed Rate 현재값", type: "number", template: "", unit: "m3/hr", isActual: true },
          { label: "Temperature Ramp Rate (Guide)", type: "text", template: "5°C/hr 이하", unit: "" },
          { label: "Temperature Ramp Rate (Actual)", type: "number", template: "", unit: "°C/hr", isActual: true },
          { label: "Pressure 조정 (Guide)", type: "text", template: "150-160 bar 유지", unit: "" },
          { label: "Pressure (Actual)", type: "number", template: "", unit: "bar", isActual: true },
        ]
      },
      {
        title: "전환 후 확인사항",
        items: [
          { label: "Product Quality 확인", type: "checkbox", template: "Sulfur < 10ppm" },
          { label: "Catalyst Activity 확인", type: "checkbox", template: "WABT 기준 이내" },
          { label: "Heat Balance 확인", type: "checkbox", template: "설계 범위 이내" },
        ]
      }
    ]
  },
  {
    id: "cdu-crude-switch",
    name: "CDU Crude Switch Guide",
    unit: "CDU",
    category: "원유 전환",
    description: "CDU Unit의 원유 전환 시 운전 가이드",
    sections: [
      {
        title: "전환 전 준비",
        items: [
          { label: "현재 원유 종류", type: "select", options: ["Arabian Light", "Arabian Heavy", "Kuwait Export", "Bonny Light"], template: "" },
          { label: "전환 원유 종류", type: "select", options: ["Arabian Light", "Arabian Heavy", "Kuwait Export", "Bonny Light"], template: "" },
          { label: "탱크 재고 확인", type: "number", template: "", unit: "KBbl", isActual: true },
          { label: "Desalter 운전 조건", type: "text", template: "Temp: 120-140°C, Pressure: 10-12 bar", unit: "" },
        ]
      },
      {
        title: "전환 중 조정사항",
        items: [
          { label: "Heater Outlet Temp (Guide)", type: "text", template: "360-380", unit: "°C" },
          { label: "Heater Outlet Temp (Actual)", type: "number", template: "", unit: "°C", isActual: true },
          { label: "Flash Zone Temp (Guide)", type: "text", template: "350-365", unit: "°C" },
          { label: "Flash Zone Temp (Actual)", type: "number", template: "", unit: "°C", isActual: true },
          { label: "Column Top Temp (Guide)", type: "text", template: "110-130", unit: "°C" },
          { label: "Column Top Temp (Actual)", type: "number", template: "", unit: "°C", isActual: true },
        ]
      }
    ]
  },
  {
    id: "vdu-vacuum-adjust",
    name: "VDU Vacuum Adjustment Guide",
    unit: "VDU",
    category: "진공도 조정",
    description: "VDU Unit의 진공도 조정 가이드",
    sections: [
      {
        title: "현재 상태 확인",
        items: [
          { label: "Column Top Pressure (Guide)", type: "text", template: "25-35", unit: "mmHg" },
          { label: "Column Top Pressure (Actual)", type: "number", template: "", unit: "mmHg", isActual: true },
          { label: "Ejector Steam Pressure (Guide)", type: "text", template: "8-12", unit: "kg/cm2" },
          { label: "Ejector Steam Pressure (Actual)", type: "number", template: "", unit: "kg/cm2", isActual: true },
        ]
      },
      {
        title: "조정 절차",
        items: [
          { label: "Steam 유량 조정", type: "text", template: "서서히 5% 단위로 조정", unit: "" },
          { label: "현재 Steam 유량", type: "number", template: "", unit: "ton/hr", isActual: true },
          { label: "Condenser 냉각수 온도 확인", type: "number", template: "", unit: "°C", isActual: true },
        ]
      }
    ]
  },
  {
    id: "ccr-regeneration",
    name: "CCR Catalyst Regeneration Guide",
    unit: "CCR",
    category: "촉매 재생",
    description: "CCR Unit의 촉매 재생 가이드",
    sections: [
      {
        title: "재생 전 확인",
        items: [
          { label: "Catalyst Circulation Rate (Guide)", type: "text", template: "400-600", unit: "kg/hr" },
          { label: "Catalyst Circulation Rate (Actual)", type: "number", template: "", unit: "kg/hr", isActual: true },
          { label: "Regenerator Temp (Guide)", type: "text", template: "480-520", unit: "°C" },
          { label: "Regenerator Temp (Actual)", type: "number", template: "", unit: "°C", isActual: true },
        ]
      },
      {
        title: "재생 조건",
        items: [
          { label: "Oxygen Concentration (Guide)", type: "text", template: "0.5-1.0", unit: "%" },
          { label: "Oxygen Concentration (Actual)", type: "number", template: "", unit: "%", isActual: true },
          { label: "Chloride Injection Rate (Guide)", type: "text", template: "설계값 기준", unit: "" },
          { label: "Chloride Injection Rate (Actual)", type: "number", template: "", unit: "ppm", isActual: true },
        ]
      }
    ]
  }
]

interface GuideTemplateFormProps {
  onComplete?: () => void
}

export function GuideTemplateForm({ onComplete }: GuideTemplateFormProps) {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<typeof GUIDE_TEMPLATES[0] | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [showDistributeDialog, setShowDistributeDialog] = useState(false)
  const [distributeTargets, setDistributeTargets] = useState<string[]>([])

  const handleSelectTemplate = (templateId: string) => {
    const template = GUIDE_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      // Initialize form values with template defaults
      const initialValues: Record<string, string> = {}
      template.sections.forEach(section => {
        section.items.forEach(item => {
          initialValues[`${section.title}-${item.label}`] = item.template
        })
      })
      setFormValues(initialValues)
    }
  }

  const handleValueChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const getCompletionRate = () => {
    if (!selectedTemplate) return 0
    let total = 0
    let filled = 0
    selectedTemplate.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.isActual) {
          total++
          const key = `${section.title}-${item.label}`
          if (formValues[key] && formValues[key].trim() !== "") {
            filled++
          }
        }
      })
    })
    return total > 0 ? Math.round((filled / total) * 100) : 100
  }

  const handleDistribute = () => {
    // Save and distribute the guide
    alert(`가이드가 ${distributeTargets.join(", ")} 팀에 배포되었습니다.`)
    setShowDistributeDialog(false)
    if (onComplete) onComplete()
    router.push("/")
  }

  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">반복성 가이드 템플릿 선택</h2>
          <p className="text-muted-foreground">작성할 가이드 템플릿을 선택해주세요</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {GUIDE_TEMPLATES.map(template => (
            <Card 
              key={template.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => handleSelectTemplate(template.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{template.unit}</Badge>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {template.sections.length}개 섹션, {template.sections.reduce((acc, s) => acc + s.items.length, 0)}개 항목
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const completionRate = getCompletionRate()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{selectedTemplate.unit}</Badge>
            <Badge variant="secondary">{selectedTemplate.category}</Badge>
          </div>
          <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
          <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{completionRate}%</div>
          <div className="text-sm text-muted-foreground">Actual 입력 완료</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      {/* Form Sections */}
      <Tabs defaultValue={selectedTemplate.sections[0].title} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {selectedTemplate.sections.map((section, idx) => (
            <TabsTrigger key={section.title} value={section.title} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                {idx + 1}
              </span>
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {selectedTemplate.sections.map(section => (
          <TabsContent key={section.title} value={section.title} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map(item => {
                  const key = `${section.title}-${item.label}`
                  const value = formValues[key] || ""
                  
                  return (
                    <div key={key} className="grid grid-cols-3 gap-4 items-center">
                      <label className={`text-sm ${item.isActual ? "font-medium text-primary" : "text-muted-foreground"}`}>
                        {item.isActual && <span className="text-orange-500 mr-1">*</span>}
                        {item.label}
                      </label>
                      <div className="col-span-2 flex items-center gap-2">
                        {item.type === "select" ? (
                          <Select value={value} onValueChange={(v) => handleValueChange(key, v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {item.options?.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : item.type === "checkbox" ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={value === "checked"}
                              onChange={(e) => handleValueChange(key, e.target.checked ? "checked" : "")}
                              className="h-4 w-4"
                            />
                            <span className="text-sm text-muted-foreground">{item.template}</span>
                          </div>
                        ) : item.type === "number" ? (
                          <Input
                            type="number"
                            value={value}
                            onChange={(e) => handleValueChange(key, e.target.value)}
                            placeholder={item.isActual ? "Actual 값 입력" : ""}
                            className={item.isActual ? "border-orange-300 focus:border-orange-500" : ""}
                          />
                        ) : (
                          <Input
                            value={value}
                            onChange={(e) => handleValueChange(key, e.target.value)}
                            readOnly={!item.isActual}
                            className={!item.isActual ? "bg-muted" : ""}
                          />
                        )}
                        {item.unit && <span className="text-sm text-muted-foreground w-16">{item.unit}</span>}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
          템플릿 다시 선택
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <BookOpen className="h-4 w-4 mr-2" />
            미리보기
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            임시 저장
          </Button>
          <Button onClick={() => setShowDistributeDialog(true)} disabled={completionRate < 100}>
            <Send className="h-4 w-4 mr-2" />
            가이드 배포
          </Button>
        </div>
      </div>

      {/* Distribute Dialog */}
      <Dialog open={showDistributeDialog} onOpenChange={setShowDistributeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>가이드 배포</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">작성된 가이드를 배포할 대상 팀을 선택해주세요.</p>
            <div className="space-y-2">
              {["Operations", "Process Engineering", "Maintenance", "Scheduling"].map(team => (
                <label key={team} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={distributeTargets.includes(team)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDistributeTargets([...distributeTargets, team])
                      } else {
                        setDistributeTargets(distributeTargets.filter(t => t !== team))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{team}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDistributeDialog(false)}>취소</Button>
            <Button onClick={handleDistribute} disabled={distributeTargets.length === 0}>
              <Send className="h-4 w-4 mr-1" />
              배포하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate.name} - 미리보기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTemplate.sections.map(section => (
              <div key={section.title} className="space-y-2">
                <h3 className="font-semibold text-sm border-b pb-1">{section.title}</h3>
                <div className="space-y-1">
                  {section.items.map(item => {
                    const key = `${section.title}-${item.label}`
                    const value = formValues[key] || item.template || "-"
                    return (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={item.isActual ? "font-medium text-primary" : ""}>
                          {value} {item.unit}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
