"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Server, Database, Tag, Users, Settings, Edit, ArrowRight, BookOpen, Search,
  Building2, Monitor, Link2, AlertTriangle, Activity, Clock, Plus, Trash2,
  CheckCircle, ChevronRight, Eye, Filter, Download, Upload, MoreHorizontal,
  Layers, Gauge, Wrench, FileText, Bell, Target, Cpu, Network
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  PROCESS_UNITS, EQUIPMENT_MASTER, TAG_MASTER, PERSONNEL_MAPPING,
  DCS_SCREENS, SIMILARITY_RULES, ANOMALY_DETECTION_CONFIGS,
  LONGTERM_MONITORING_CONFIGS, CONTEXT_MAPPINGS,
  type ProcessUnit, type Equipment, type TagMaster, type PersonnelMapping,
  type DCSScreen, type SimilarityRule, type AnomalyDetectionConfig,
  type LongTermMonitoringConfig, type ContextDataMapping
} from "@/lib/master-data"

// Category definitions for navigation
const MASTER_DATA_CATEGORIES = [
  { id: "process-units", name: "공정 단위", icon: Building2, description: "공정별 기본 정보 및 담당자 설정", count: PROCESS_UNITS.length },
  { id: "equipment", name: "설비 마스터", icon: Server, description: "설비 정보, 계층 구조, 관련 태그 관리", count: EQUIPMENT_MASTER.length },
  { id: "tags", name: "태그 마스터", icon: Tag, description: "공정 태그 정의, 속성, 경보 한계값 관리", count: TAG_MASTER.length },
  { id: "personnel", name: "담당자 매핑", icon: Users, description: "공정/설비별 담당자 및 교대조 설정", count: PERSONNEL_MAPPING.length },
  { id: "dcs-screens", name: "DCS 화면 매핑", icon: Monitor, description: "DCS 화면과 공정/설비/태그 연결", count: DCS_SCREENS.length },
  { id: "similarity", name: "유사도 매칭 규칙", icon: Link2, description: "유사 이벤트/리포트 검색 규칙 관리", count: SIMILARITY_RULES.length },
  { id: "anomaly", name: "이상징후 감지 설정", icon: AlertTriangle, description: "이상징후 감지 기준 및 알고리즘 설정", count: ANOMALY_DETECTION_CONFIGS.length },
  { id: "longterm", name: "장기 모니터링 설정", icon: Activity, description: "Fouling, Coking, 촉매 노화 등 장기 추적", count: LONGTERM_MONITORING_CONFIGS.length },
  { id: "context", name: "컨텍스트 데이터 매핑", icon: Layers, description: "이벤트 발생 시 자동 로드 데이터 설정", count: CONTEXT_MAPPINGS.length },
]

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("process-units")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [detailType, setDetailType] = useState<string>("")

  const openDetail = (item: any, type: string) => {
    setSelectedItem(item)
    setDetailType(type)
    setShowDetailDialog(true)
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left sidebar - Category navigation */}
        <div className="w-72 border-r bg-muted/30 p-4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-bold">기준정보 관리</h2>
            <p className="text-xs text-muted-foreground">Master Data Management</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {MASTER_DATA_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-3 cursor-pointer",
                    activeTab === cat.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <cat.icon className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    activeTab === cat.id ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                      <Badge variant={activeTab === cat.id ? "secondary" : "outline"} className="text-xs ml-2">
                        {cat.count}
                      </Badge>
                    </div>
                    <p className={cn(
                      "text-xs mt-0.5 line-clamp-1",
                      activeTab === cat.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {cat.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <Separator className="my-4" />
          
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              일괄 업로드
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 cursor-pointer">
              <Download className="h-4 w-4" />
              전체 내보내기
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="검색..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="공정 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 공정</SelectItem>
                {PROCESS_UNITS.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" />
              추가
            </Button>
          </div>

          {/* Content area */}
          <ScrollArea className="flex-1 p-4">
            {/* Process Units Tab */}
            {activeTab === "process-units" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">공정 단위 관리</h3>
                    <p className="text-sm text-muted-foreground">공정별 기본 정보, 기본 담당자, DCS/P&ID 연결 관리</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {PROCESS_UNITS.filter(u => 
                    selectedUnit === "all" || u.id === selectedUnit
                  ).filter(u =>
                    !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(unit => (
                    <Card key={unit.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{unit.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">{unit.fullName}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => openDetail(unit, "process-unit")}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{unit.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>담당: <span className="font-medium">{unit.defaultAssignee}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono">{unit.dcsScreenId}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Badge variant="outline" className="text-xs">{EQUIPMENT_MASTER.filter(e => e.processUnit === unit.id).length}개 설비</Badge>
                          <Badge variant="outline" className="text-xs">{TAG_MASTER.filter(t => t.processUnit === unit.id).length}개 태그</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Tab */}
            {activeTab === "equipment" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">설비 마스터</h3>
                    <p className="text-sm text-muted-foreground">설비 정보, P&ID, 관련 태그, 정비 이력 연결</p>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">설비 ID</th>
                        <th className="text-left p-3 font-medium">설비명</th>
                        <th className="text-left p-3 font-medium">유형</th>
                        <th className="text-left p-3 font-medium">공정</th>
                        <th className="text-left p-3 font-medium">중요도</th>
                        <th className="text-left p-3 font-medium">관련 태그</th>
                        <th className="text-left p-3 font-medium">최근 정비</th>
                        <th className="text-center p-3 font-medium">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EQUIPMENT_MASTER.filter(e => 
                        selectedUnit === "all" || e.processUnit === selectedUnit
                      ).filter(e =>
                        !searchQuery || e.id.toLowerCase().includes(searchQuery.toLowerCase()) || e.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(equip => (
                        <tr key={equip.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">{equip.id}</td>
                          <td className="p-3">{equip.name}</td>
                          <td className="p-3"><Badge variant="outline">{equip.type}</Badge></td>
                          <td className="p-3"><Badge variant="secondary">{equip.processUnit}</Badge></td>
                          <td className="p-3">
                            <Badge className={cn(
                              equip.criticality === "A" ? "bg-red-100 text-red-700" :
                              equip.criticality === "B" ? "bg-amber-100 text-amber-700" :
                              "bg-muted text-muted-foreground"
                            )}>{equip.criticality}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {equip.relatedTags.slice(0, 2).map(t => (
                                <span key={t} className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">{t}</span>
                              ))}
                              {equip.relatedTags.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{equip.relatedTags.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{equip.lastMaintenanceDate || "-"}</td>
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openDetail(equip, "equipment")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === "tags" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">태그 마스터</h3>
                    <p className="text-sm text-muted-foreground">태그 정의, 경보 한계값, 주요 운전변수 설정</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Target className="h-3 w-3" />
                      주요변수 {TAG_MASTER.filter(t => t.isKeyVariable).length}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Bell className="h-3 w-3" />
                      모니터링 {TAG_MASTER.filter(t => t.isMonitored).length}
                    </Badge>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">태그 ID</th>
                        <th className="text-left p-3 font-medium">설명</th>
                        <th className="text-left p-3 font-medium">유형</th>
                        <th className="text-left p-3 font-medium">단위</th>
                        <th className="text-left p-3 font-medium">공정</th>
                        <th className="text-center p-3 font-medium">Low</th>
                        <th className="text-center p-3 font-medium">High</th>
                        <th className="text-center p-3 font-medium">주요변수</th>
                        <th className="text-center p-3 font-medium">모니터링</th>
                        <th className="text-center p-3 font-medium">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAG_MASTER.filter(t => 
                        selectedUnit === "all" || t.processUnit === selectedUnit
                      ).filter(t =>
                        !searchQuery || t.id.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(tag => (
                        <tr key={tag.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs font-medium">{tag.id}</td>
                          <td className="p-3">
                            <div>
                              <span className="text-sm">{tag.descriptionKo}</span>
                              <span className="text-xs text-muted-foreground block">{tag.description}</span>
                            </div>
                          </td>
                          <td className="p-3"><Badge variant="outline">{tag.type}</Badge></td>
                          <td className="p-3 text-xs">{tag.unit}</td>
                          <td className="p-3"><Badge variant="secondary">{tag.processUnit}</Badge></td>
                          <td className="p-3 text-center text-xs">
                            {tag.lowLimit !== undefined ? (
                              <span className="text-blue-600">{tag.lowLimit}</span>
                            ) : "-"}
                          </td>
                          <td className="p-3 text-center text-xs">
                            {tag.highLimit !== undefined ? (
                              <span className="text-red-600">{tag.highLimit}</span>
                            ) : "-"}
                          </td>
                          <td className="p-3 text-center">
                            {tag.isKeyVariable && <CheckCircle className="h-4 w-4 text-primary mx-auto" />}
                          </td>
                          <td className="p-3 text-center">
                            {tag.isMonitored && <Bell className="h-4 w-4 text-amber-500 mx-auto" />}
                          </td>
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openDetail(tag, "tag")}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Personnel Tab */}
            {activeTab === "personnel" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">담당자 매핑</h3>
                    <p className="text-sm text-muted-foreground">공정/설비별 담당자, 교대조, 연락처 관리</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {PROCESS_UNITS.filter(u => 
                    selectedUnit === "all" || u.id === selectedUnit
                  ).map(unit => {
                    const personnel = PERSONNEL_MAPPING.filter(p => p.processUnit === unit.id)
                    return (
                      <Card key={unit.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {unit.name}
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-7 cursor-pointer">
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              추가
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {personnel.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{p.primaryAssignee}</span>
                                      <Badge variant="outline" className="text-xs">{p.role}</Badge>
                                      {p.shiftType && <Badge variant="secondary" className="text-xs">{p.shiftType}</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      백업: {p.backupAssignees.join(", ")}
                                    </p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                            {personnel.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">담당자 미설정</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* DCS Screens Tab */}
            {activeTab === "dcs-screens" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">DCS 화면 매핑</h3>
                    <p className="text-sm text-muted-foreground">DCS 화면과 공정/설비/태그 연결 관리</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {DCS_SCREENS.filter(s => 
                    selectedUnit === "all" || s.processUnit === selectedUnit
                  ).filter(s =>
                    !searchQuery || s.id.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(screen => (
                    <Card key={screen.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(screen, "dcs-screen")}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge variant="secondary" className="mb-2">{screen.processUnit}</Badge>
                            <CardTitle className="text-sm">{screen.name}</CardTitle>
                            <p className="text-xs text-muted-foreground font-mono">{screen.id}</p>
                          </div>
                          <Badge variant="outline">{screen.screenType}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">{screen.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Server className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>설비: {screen.relatedEquipments.join(", ")}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {screen.relatedTags.slice(0, 4).map(t => (
                              <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted">{t}</span>
                            ))}
                            {screen.relatedTags.length > 4 && (
                              <span className="text-[10px] text-muted-foreground">+{screen.relatedTags.length - 4}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Similarity Rules Tab */}
            {activeTab === "similarity" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">유사도 매칭 규칙</h3>
                    <p className="text-sm text-muted-foreground">유사 이벤트, 유사 리포트 검색을 위한 매칭 규칙 관리</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {SIMILARITY_RULES.map(rule => (
                    <Card key={rule.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              rule.type === "event" ? "bg-blue-100" : "bg-purple-100"
                            )}>
                              {rule.type === "event" ? (
                                <AlertTriangle className="h-5 w-5 text-blue-600" />
                              ) : (
                                <FileText className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-base">{rule.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">{rule.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.type === "event" ? "default" : "secondary"}>{rule.type}</Badge>
                            <Switch checked={rule.enabled} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium mb-2">매칭 기준</p>
                            <div className="flex flex-wrap gap-1">
                              {rule.matchCriteria.processUnit && <Badge variant="outline" className="text-xs">공정</Badge>}
                              {rule.matchCriteria.equipment && <Badge variant="outline" className="text-xs">설비</Badge>}
                              {rule.matchCriteria.tagPattern && <Badge variant="outline" className="text-xs">태그패턴</Badge>}
                              {rule.matchCriteria.category && <Badge variant="outline" className="text-xs">카테고리</Badge>}
                              {rule.matchCriteria.keyword && <Badge variant="outline" className="text-xs">키워드</Badge>}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium mb-2">가중치 설정</p>
                            <div className="grid grid-cols-5 gap-1 text-xs">
                              <div className="text-center">
                                <div className="font-medium">{rule.weightFactors.processUnit}</div>
                                <div className="text-muted-foreground">공정</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium">{rule.weightFactors.equipment}</div>
                                <div className="text-muted-foreground">설비</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium">{rule.weightFactors.tagPattern}</div>
                                <div className="text-muted-foreground">태그</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium">{rule.weightFactors.category}</div>
                                <div className="text-muted-foreground">분류</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium">{rule.weightFactors.keyword}</div>
                                <div className="text-muted-foreground">키워드</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <span>최소 유사도: <span className="font-medium text-foreground">{rule.minimumScore}%</span></span>
                          <span>최대 결과: <span className="font-medium text-foreground">{rule.maxResults}건</span></span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Anomaly Detection Tab */}
            {activeTab === "anomaly" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">이상징후 감지 설정</h3>
                    <p className="text-sm text-muted-foreground">이상징후 감지 알고리즘 및 임계값 설정</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {ANOMALY_DETECTION_CONFIGS.filter(c => 
                    selectedUnit === "all" || c.processUnit === selectedUnit
                  ).map(config => (
                    <Card key={config.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              config.severity === "critical" ? "bg-red-100" :
                              config.severity === "warning" ? "bg-amber-100" : "bg-blue-100"
                            )}>
                              <AlertTriangle className={cn(
                                "h-5 w-5",
                                config.severity === "critical" ? "text-red-600" :
                                config.severity === "warning" ? "text-amber-600" : "text-blue-600"
                              )} />
                            </div>
                            <div>
                              <CardTitle className="text-base">{config.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">{config.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{config.processUnit}</Badge>
                            <Badge variant={
                              config.severity === "critical" ? "destructive" :
                              config.severity === "warning" ? "default" : "secondary"
                            }>{config.severity}</Badge>
                            <Switch checked={config.enabled} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-medium mb-2">감지 유형</p>
                            <Badge variant="outline">{config.detectionType}</Badge>
                          </div>
                          <div>
                            <p className="text-xs font-medium mb-2">대상 태그</p>
                            <div className="flex flex-wrap gap-1">
                              {config.targetTags.map(t => (
                                <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted">{t}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium mb-2">파라미터</p>
                            <div className="text-xs">
                              {config.parameters.rateOfChange && (
                                <span>변화율 한계: {config.parameters.rateOfChange.maxChangePerMinute}/min</span>
                              )}
                              {config.parameters.correlationTags && (
                                <span>상관 태그: {config.parameters.correlationTags.join(", ")}</span>
                              )}
                              {config.parameters.patternId && (
                                <span>패턴 ID: {config.parameters.patternId}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Long-term Monitoring Tab */}
            {activeTab === "longterm" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">장기 모니터링 설정</h3>
                    <p className="text-sm text-muted-foreground">Fouling, Coking, 촉매 노화 등 장기 건전성 모니터링 설정</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {LONGTERM_MONITORING_CONFIGS.filter(c => 
                    selectedUnit === "all" || c.processUnit === selectedUnit
                  ).map(config => (
                    <Card key={config.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{config.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">{config.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{config.processUnit}</Badge>
                            <Badge variant="outline">{config.category}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">대상 설비</p>
                            <p className="text-sm font-medium">{config.targetEquipment}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Health Index</p>
                            <p className="text-sm font-medium">{config.healthIndexTag} ({config.healthIndexUnit})</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">기준값 / 한계값</p>
                            <p className="text-sm">
                              <span className="text-green-600 font-medium">{config.referenceValue}</span>
                              <span className="mx-1">/</span>
                              <span className="text-red-600 font-medium">{config.limitValue}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">설정</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={config.projectionEnabled ? "default" : "outline"} className="text-xs">
                                {config.projectionEnabled ? "Projection ON" : "OFF"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{config.trendPeriod}</Badge>
                            </div>
                          </div>
                        </div>
                        {config.normalizedBy && (
                          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                            정규화 기준: <span className="font-mono">{config.normalizedBy}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Context Mapping Tab */}
            {activeTab === "context" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">컨텍스트 데이터 매핑</h3>
                    <p className="text-sm text-muted-foreground">이벤트/Alert 발생 시 자동으로 로드할 맥락성 데이터 설정</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {CONTEXT_MAPPINGS.filter(c => 
                    selectedUnit === "all" || c.processUnit === selectedUnit
                  ).map(mapping => (
                    <Card key={mapping.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{mapping.processUnit}</Badge>
                            <Badge variant="outline">{
                              mapping.triggerType === "event-create" ? "이벤트 생성" :
                              mapping.triggerType === "alert-triggered" ? "Alert 발생" :
                              "이상징후 감지"
                            }</Badge>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {mapping.defaultTimeRange}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs font-medium mb-3">자동 로드 항목</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", mapping.autoLoadItems.dcsScreen ? "bg-green-100" : "bg-muted")}>
                              {mapping.autoLoadItems.dcsScreen && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={mapping.autoLoadItems.dcsScreen ? "" : "text-muted-foreground"}>DCS 화면</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", mapping.autoLoadItems.relatedTags ? "bg-green-100" : "bg-muted")}>
                              {mapping.autoLoadItems.relatedTags && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={mapping.autoLoadItems.relatedTags ? "" : "text-muted-foreground"}>관련 태그</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", mapping.autoLoadItems.recentAlerts ? "bg-green-100" : "bg-muted")}>
                              {mapping.autoLoadItems.recentAlerts && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={mapping.autoLoadItems.recentAlerts ? "" : "text-muted-foreground"}>최근 Alert</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", mapping.autoLoadItems.maintenanceHistory ? "bg-green-100" : "bg-muted")}>
                              {mapping.autoLoadItems.maintenanceHistory && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={mapping.autoLoadItems.maintenanceHistory ? "" : "text-muted-foreground"}>정비 이력</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", mapping.autoLoadItems.similarEvents ? "bg-green-100" : "bg-muted")}>
                              {mapping.autoLoadItems.similarEvents && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={mapping.autoLoadItems.similarEvents ? "" : "text-muted-foreground"}>유사 이벤트</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", mapping.autoLoadItems.similarReports ? "bg-green-100" : "bg-muted")}>
                              {mapping.autoLoadItems.similarReports && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={mapping.autoLoadItems.similarReports ? "" : "text-muted-foreground"}>유사 리포트</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", mapping.autoLoadItems.operationGuide ? "bg-green-100" : "bg-muted")}>
                              {mapping.autoLoadItems.operationGuide && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={mapping.autoLoadItems.operationGuide ? "" : "text-muted-foreground"}>운전 가이드</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", mapping.autoLoadItems.healthStatus ? "bg-green-100" : "bg-muted")}>
                              {mapping.autoLoadItems.healthStatus && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={mapping.autoLoadItems.healthStatus ? "" : "text-muted-foreground"}>건전성 현황</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailType === "process-unit" && <Building2 className="h-5 w-5" />}
              {detailType === "equipment" && <Server className="h-5 w-5" />}
              {detailType === "tag" && <Tag className="h-5 w-5" />}
              {detailType === "dcs-screen" && <Monitor className="h-5 w-5" />}
              {selectedItem?.name || selectedItem?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && detailType === "process-unit" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>공정 ID</Label>
                  <Input value={selectedItem.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label>공정명 (영문)</Label>
                  <Input value={selectedItem.fullName} />
                </div>
                <div className="space-y-2">
                  <Label>기본 담당자</Label>
                  <Input value={selectedItem.defaultAssignee} />
                </div>
                <div className="space-y-2">
                  <Label>DCS 화면 ID</Label>
                  <Input value={selectedItem.dcsScreenId} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <Input value={selectedItem.description} />
              </div>
              <div className="space-y-2">
                <Label>백업 담당자</Label>
                <Input value={selectedItem.backupAssignees?.join(", ")} />
              </div>
            </div>
          )}

          {selectedItem && detailType === "equipment" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>설비 ID</Label>
                  <Input value={selectedItem.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label>유형</Label>
                  <Input value={selectedItem.type} />
                </div>
                <div className="space-y-2">
                  <Label>중요도</Label>
                  <Select defaultValue={selectedItem.criticality}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - 핵심</SelectItem>
                      <SelectItem value="B">B - 중요</SelectItem>
                      <SelectItem value="C">C - 일반</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>설비명</Label>
                <Input value={selectedItem.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>P&ID 번호</Label>
                  <Input value={selectedItem.pidNumber} />
                </div>
                <div className="space-y-2">
                  <Label>DCS 화면 ID</Label>
                  <Input value={selectedItem.dcsScreenId || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>관련 태그</Label>
                <Input value={selectedItem.relatedTags?.join(", ")} />
              </div>
            </div>
          )}

          {selectedItem && detailType === "tag" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>태그 ID</Label>
                  <Input value={selectedItem.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label>유형</Label>
                  <Input value={selectedItem.type} />
                </div>
                <div className="space-y-2">
                  <Label>단위</Label>
                  <Input value={selectedItem.unit} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>설명 (한글)</Label>
                <Input value={selectedItem.descriptionKo} />
              </div>
              <div className="space-y-2">
                <Label>설명 (영문)</Label>
                <Input value={selectedItem.description} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Low Limit</Label>
                  <Input type="number" value={selectedItem.lowLimit ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>High Limit</Label>
                  <Input type="number" value={selectedItem.highLimit ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>정상 범위 (Min)</Label>
                  <Input type="number" value={selectedItem.normalMin ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>정상 범위 (Max)</Label>
                  <Input type="number" value={selectedItem.normalMax ?? ""} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={selectedItem.isKeyVariable} />
                  <Label>주요 운전변수</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={selectedItem.isMonitored} />
                  <Label>모니터링 대상</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="cursor-pointer">취소</Button>
            <Button className="cursor-pointer">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
