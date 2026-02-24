"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import {
  Bell,
  Plus,
  Trash2,
  Tag,
  Settings,
  AlertTriangle,
  Check,
  Eye,
  ChevronRight,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getPersonalizedAlarms,
  savePersonalizedAlarm,
  deletePersonalizedAlarm,
  togglePersonalizedAlarm,
  type PersonalizedAlarm,
} from "@/lib/personalized-alarms"
import { AVAILABLE_TAGS } from "@/lib/process-data"

export default function PersonalizedAlarmsPage() {
  const [alarms, setAlarms] = useState<PersonalizedAlarm[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // New alarm form state
  const [tagInput, setTagInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState("")
  const [description, setDescription] = useState("")
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")
  const [unit, setUnit] = useState("")
  const [showScreenTags, setShowScreenTags] = useState(false)

  // All available tags
  const allTags: string[] = []
  Object.values(AVAILABLE_TAGS).forEach(unitTags => {
    unitTags.forEach(tag => { if (!allTags.includes(tag)) allTags.push(tag) })
  })
  allTags.sort()

  const loadAlarms = useCallback(() => {
    setAlarms(getPersonalizedAlarms())
  }, [])

  useEffect(() => {
    loadAlarms()
    const handler = () => loadAlarms()
    window.addEventListener("personalized-alarms-changed", handler)
    return () => window.removeEventListener("personalized-alarms-changed", handler)
  }, [loadAlarms])

  const handleTagInput = (value: string) => {
    setTagInput(value)
    if (value.length > 0) {
      setSuggestions(allTags.filter(t => t.toLowerCase().includes(value.toLowerCase())).slice(0, 8))
    } else {
      setSuggestions([])
    }
  }

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag)
    setTagInput(tag)
    setSuggestions([])
    const prefix = tag.substring(0, 2)
    if (prefix === "TI") setUnit("\u00b0C")
    else if (prefix === "PI") setUnit("kg/cm\u00b2")
    else if (prefix === "FI") setUnit("m\u00b3/h")
    else if (prefix === "LI") setUnit("%")
    else setUnit("")
  }

  const handleSave = () => {
    if (!selectedTag) return
    savePersonalizedAlarm({
      tagId: selectedTag,
      tagDescription: description || undefined,
      min: min ? parseFloat(min) : undefined,
      max: max ? parseFloat(max) : undefined,
      unit: unit || "",
      source: "manual",
    })
    resetForm()
    setShowAddDialog(false)
  }

  const resetForm = () => {
    setTagInput("")
    setSuggestions([])
    setSelectedTag("")
    setDescription("")
    setMin("")
    setMax("")
    setUnit("")
    setShowScreenTags(false)
  }

  const handleDelete = (id: string) => {
    deletePersonalizedAlarm(id)
  }

  const handleToggle = (id: string) => {
    togglePersonalizedAlarm(id)
  }

  const filteredAlarms = searchQuery
    ? alarms.filter(a => a.tagId.toLowerCase().includes(searchQuery.toLowerCase()) || (a.tagDescription || "").toLowerCase().includes(searchQuery.toLowerCase()))
    : alarms

  const activeCount = alarms.filter(a => a.active).length

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                개인화 알림 관리
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">등록된 개인화 알림을 확인하고 관리합니다.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs gap-1">
                <Bell className="h-3 w-3" />
                총 {alarms.length}건
              </Badge>
              <Badge className="text-xs gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                활성 {activeCount}건
              </Badge>
              <Button onClick={() => { resetForm(); setShowAddDialog(true) }} className="gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" />
                새 알림 등록
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          {/* Search */}
          <div className="mb-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tag ID 또는 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredAlarms.length === 0 ? (
            <Card className="max-w-lg mx-auto mt-12">
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium">등록된 개인화 알림이 없습니다</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">우측 하단 플로팅 버튼 또는 상단의 새 알림 등록으로 추가할 수 있습니다.</p>
                <Button variant="outline" onClick={() => { resetForm(); setShowAddDialog(true) }} className="gap-1.5 cursor-pointer">
                  <Plus className="h-4 w-4" />
                  첫 알림 등록하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAlarms.map(alarm => (
                <Card key={alarm.id} className={cn("transition-colors", !alarm.active && "opacity-60")}>
                  <CardContent className="py-3 flex items-center gap-4">
                    {/* Status indicator */}
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      alarm.active ? "bg-red-50" : "bg-muted"
                    )}>
                      <Bell className={cn("h-5 w-5", alarm.active ? "text-red-500" : "text-muted-foreground")} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold font-mono">{alarm.tagId}</span>
                        {alarm.tagDescription && <span className="text-xs text-muted-foreground">- {alarm.tagDescription}</span>}
                        <Badge variant={alarm.active ? "default" : "secondary"} className="text-[10px]">
                          {alarm.active ? "활성" : "비활성"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {alarm.min !== undefined && (
                          <span className="flex items-center gap-1">
                            <span className="text-blue-500 font-medium">Min:</span>
                            <span className="font-mono">{alarm.min} {alarm.unit}</span>
                          </span>
                        )}
                        {alarm.max !== undefined && (
                          <span className="flex items-center gap-1">
                            <span className="text-red-500 font-medium">Max:</span>
                            <span className="font-mono">{alarm.max} {alarm.unit}</span>
                          </span>
                        )}
                        <span>등록: {alarm.createdAt}</span>
                        {alarm.source && <Badge variant="outline" className="text-[10px]">{alarm.source === "manual" ? "수동 입력" : "화면 태그"}</Badge>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch checked={alarm.active} onCheckedChange={() => handleToggle(alarm.id)} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 cursor-pointer"
                        onClick={() => handleDelete(alarm.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add New Alarm Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" />
              개인화 알림 등록
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tag Input */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">변수 (Tag ID)</Label>
              <div className="relative">
                <Input
                  value={tagInput}
                  onChange={(e) => handleTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && suggestions.length > 0) handleTagSelect(suggestions[0])
                  }}
                  placeholder="Tag ID 입력 (예: TI-1001)"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagSelect(tag)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowScreenTags(!showScreenTags)}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer"
              >
                <Eye className="h-3 w-3" />
                {showScreenTags ? "태그 리스트 닫기" : "공정 태그 리스트에서 선택"}
                <ChevronRight className={cn("h-3 w-3 transition-transform", showScreenTags && "rotate-90")} />
              </button>

              {showScreenTags && (
                <div className="border rounded-lg p-3 bg-muted/30 max-h-48 overflow-y-auto">
                  {Object.entries(AVAILABLE_TAGS).slice(0, 6).map(([unitName, tags]) => (
                    <div key={unitName} className="mb-2">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1">{unitName}</p>
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 8).map(tag => (
                          <button
                            key={tag}
                            onClick={() => handleTagSelect(tag)}
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-mono rounded border cursor-pointer transition-colors",
                              selectedTag === tag ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">설명 (선택)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="알림 설명"
              />
            </div>

            {/* Min / Max / Unit */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Min (하한)</Label>
                <Input type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Max (상한)</Label>
                <Input type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">단위</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="단위" />
              </div>
            </div>

            {selectedTag && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="text-xs font-medium mb-1">등록 요약</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span><span className="text-muted-foreground">Tag:</span> <span className="font-mono font-medium">{selectedTag}</span></span>
                  {description && <span><span className="text-muted-foreground">설명:</span> {description}</span>}
                  {min && <span><span className="text-muted-foreground">Min:</span> <span className="font-mono">{min} {unit}</span></span>}
                  {max && <span><span className="text-muted-foreground">Max:</span> <span className="font-mono">{max} {unit}</span></span>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="cursor-pointer">취소</Button>
            <Button disabled={!selectedTag || (!min && !max)} onClick={handleSave} className="cursor-pointer gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              알림 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
