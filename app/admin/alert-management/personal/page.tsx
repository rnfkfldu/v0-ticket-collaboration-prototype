"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Bell,
  Plus,
  Search,
  Download,
  Edit as EditIcon,
  Trash2,
  User,
  Mail,
  Smartphone,
} from "lucide-react"
import { PERSONAL_ALERT_DATA, ALERT_MASTER_DATA } from "../alert-data"

export default function PersonalAlertPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingAlert, setEditingAlert] = useState<typeof PERSONAL_ALERT_DATA[0] | null>(null)
  
  // Edit form state
  const [editThreshold, setEditThreshold] = useState("")
  const [editEnabled, setEditEnabled] = useState(true)
  const [editNotification, setEditNotification] = useState("앱")
  
  const handleEditClick = (alert: typeof PERSONAL_ALERT_DATA[0]) => {
    setEditingAlert(alert)
    setEditThreshold(String(alert.threshold))
    setEditEnabled(alert.enabled)
    setEditNotification(alert.notification)
    setShowEditDialog(true)
  }
  
  const handleSaveEdit = () => {
    if (editingAlert) {
      alert(`개인화 Alert가 수정되었습니다.\n\nTag ID: ${editingAlert.tagId}\nThreshold: ${editThreshold}\n상태: ${editEnabled ? "활성" : "비활성"}\n알림 방식: ${editNotification}`)
    }
    setShowEditDialog(false)
    setEditingAlert(null)
  }

  const filteredAlerts = PERSONAL_ALERT_DATA.filter(a => {
    return searchQuery === "" ||
      a.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const units = [...new Set(ALERT_MASTER_DATA.map(a => a.unit))]
  const enabledCount = PERSONAL_ALERT_DATA.filter(a => a.enabled).length
  const disabledCount = PERSONAL_ALERT_DATA.length - enabledCount

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">개인화 Alert</h1>
              <p className="text-sm text-muted-foreground">개인 맞춤 Alert 설정 및 관리</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                내보내기
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">전체 개인화 Alert</p>
                    <p className="text-2xl font-bold">{PERSONAL_ALERT_DATA.length}</p>
                  </div>
                  <User className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">활성 {enabledCount} / 비활성 {disabledCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">앱+이메일 알림</p>
                    <p className="text-2xl font-bold text-primary">{PERSONAL_ALERT_DATA.filter(a => a.notification === "앱+이메일").length}</p>
                  </div>
                  <Mail className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">이중 알림 설정</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">앱 전용 알림</p>
                    <p className="text-2xl font-bold">{PERSONAL_ALERT_DATA.filter(a => a.notification === "앱").length}</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">앱 알림만 설정</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Register */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tag ID 또는 Alert 명칭 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowRegisterDialog(true)} className="gap-1.5 ml-auto">
              <Plus className="h-4 w-4" />
              개인화 Alert 등록
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tag ID</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Alert 명칭</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Threshold</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">방향</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">알림 방식</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">생성일</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map(alert => (
                      <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{alert.id}</td>
                        <td className="px-4 py-3 font-mono font-medium">{alert.tagId}</td>
                        <td className="px-4 py-3">{alert.name}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{alert.unit}</Badge></td>
                        <td className="px-4 py-3 text-right font-mono">{alert.threshold} {alert.uom}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={cn("text-xs", alert.direction === "High" ? "border-red-200 text-red-600" : "border-blue-200 text-blue-600")}>
                            {alert.direction === "High" ? "\u25B2 High" : "\u25BC Low"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">{alert.notification}</td>
                        <td className="px-4 py-3 text-center">
                          {alert.enabled ? (
                            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">활성</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">비활성</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground">{alert.createdAt}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(alert)}><EditIcon className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
                전체 {filteredAlerts.length}건 표시
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ===== 개인화 Alert 등록 Dialog ===== */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              개인화 Alert 등록
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tag ID</Label>
                <Input placeholder="예: TI-2001" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Unit 선택" /></SelectTrigger>
                  <SelectContent>
                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alert 명칭</Label>
              <Input placeholder="예: 내 관심 HCR Reactor Temp" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input type="number" placeholder="예: 395" />
              </div>
              <div className="space-y-2">
                <Label>단위</Label>
                <Input placeholder="예: \u00b0C" />
              </div>
              <div className="space-y-2">
                <Label>방향</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="방향" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>알림 방식</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="알림 방식 선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">앱</SelectItem>
                  <SelectItem value="app-email">앱+이메일</SelectItem>
                  <SelectItem value="email">이메일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>취소</Button>
            <Button onClick={() => setShowRegisterDialog(false)}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 개인화 Alert 수정 Dialog ===== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EditIcon className="h-5 w-5" />
              개인화 Alert 수정
            </DialogTitle>
          </DialogHeader>
          {editingAlert && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono font-semibold">{editingAlert.tagId}</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-sm">{editingAlert.unit}</span>
                </div>
                <p className="text-sm text-muted-foreground">{editingAlert.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Threshold</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(e.target.value)}
                    />
                    <span className="flex items-center text-sm text-muted-foreground">{editingAlert.uom}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>방향</Label>
                  <Input value={editingAlert.direction} disabled className="bg-muted" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={editEnabled ? "active" : "inactive"} onValueChange={(v) => setEditEnabled(v === "active")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>알림 방식</Label>
                <Select value={editNotification} onValueChange={setEditNotification}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="앱">앱</SelectItem>
                    <SelectItem value="앱+이메일">앱+이메일</SelectItem>
                    <SelectItem value="이메일">이메일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>취소</Button>
            <Button onClick={handleSaveEdit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
