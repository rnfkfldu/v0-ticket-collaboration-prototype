"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search,
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Upload,
  Download,
  MoreVertical,
  Grid3X3,
  List,
  ChevronRight,
  Home,
  Clock,
  Users,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowUpRight,
  FolderPlus,
  Star,
  Trash2,
  Edit,
  Copy,
  Move
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// 폴더 구조 데이터
interface FileItem {
  id: string
  name: string
  type: "folder" | "file"
  fileType?: "document" | "spreadsheet" | "image" | "pdf" | "other"
  size?: string
  modified: string
  modifiedBy: string
  isNew?: boolean
  isStarred?: boolean
  aiMoved?: boolean
  previousLocation?: string
}

const folderStructure: Record<string, FileItem[]> = {
  "root": [
    { id: "1", name: "운전 매뉴얼", type: "folder", modified: "2025-02-03", modifiedBy: "시스템" },
    { id: "2", name: "공정 가이드", type: "folder", modified: "2025-02-02", modifiedBy: "시스템" },
    { id: "3", name: "교육 자료", type: "folder", modified: "2025-01-30", modifiedBy: "김철수" },
    { id: "4", name: "정비 기록", type: "folder", modified: "2025-02-01", modifiedBy: "이영희" },
    { id: "5", name: "안전 문서", type: "folder", modified: "2025-02-04", modifiedBy: "박민수" },
    { id: "6", name: "품질 관리", type: "folder", modified: "2025-01-28", modifiedBy: "시스템" },
    { id: "7", name: "OOP_Base_Knowledge", type: "folder", modified: "2025-02-05", modifiedBy: "OOP 시스템" },
    { id: "8", name: "HCR_운전변수_분석_2025.xlsx", type: "file", fileType: "spreadsheet", size: "2.4 MB", modified: "2025-02-04", modifiedBy: "김철수", isNew: true, aiMoved: true, previousLocation: "미분류" },
    { id: "9", name: "2월_정기점검_계획.docx", type: "file", fileType: "document", size: "856 KB", modified: "2025-02-03", modifiedBy: "이영희", isNew: true, aiMoved: true, previousLocation: "미분류" },
  ],
  "7": [
    { id: "7-1", name: "종료 Report", type: "folder", modified: "2025-02-05", modifiedBy: "OOP 시스템" },
    { id: "7-2", name: "월간 Report", type: "folder", modified: "2025-02-01", modifiedBy: "OOP 시스템" },
    { id: "7-3", name: "분석 자료", type: "folder", modified: "2025-01-20", modifiedBy: "OOP 시스템" },
    { id: "7-4", name: "이벤트 첨부파일", type: "folder", modified: "2025-02-03", modifiedBy: "OOP 시스템" },
  ],
  "1": [
    { id: "1-1", name: "CDU 운전 매뉴얼", type: "folder", modified: "2025-01-15", modifiedBy: "시스템" },
    { id: "1-2", name: "VDU 운전 매뉴얼", type: "folder", modified: "2025-01-15", modifiedBy: "시스템" },
    { id: "1-3", name: "HCR 운전 매뉴얼", type: "folder", modified: "2025-01-20", modifiedBy: "시스템" },
    { id: "1-4", name: "CCR 운전 매뉴얼", type: "folder", modified: "2025-01-18", modifiedBy: "시스템" },
    { id: "1-5", name: "통합_운전절차서_v3.2.pdf", type: "file", fileType: "pdf", size: "15.2 MB", modified: "2025-02-01", modifiedBy: "박민수" },
  ],
  "2": [
    { id: "2-1", name: "반복성 가이드", type: "folder", modified: "2025-02-02", modifiedBy: "시스템" },
    { id: "2-2", name: "비정상 대응 가이드", type: "folder", modified: "2025-01-28", modifiedBy: "김철수" },
    { id: "2-3", name: "Feed 변경 절차서.docx", type: "file", fileType: "document", size: "1.2 MB", modified: "2025-01-25", modifiedBy: "이영희" },
    { id: "2-4", name: "촉매_재생_절차.pdf", type: "file", fileType: "pdf", size: "3.8 MB", modified: "2025-01-30", modifiedBy: "정수민" },
  ],
  "3": [
    { id: "3-1", name: "신입사원 교육", type: "folder", modified: "2025-01-10", modifiedBy: "시스템" },
    { id: "3-2", name: "정기 교육 자료", type: "folder", modified: "2025-01-20", modifiedBy: "시스템" },
    { id: "3-3", name: "2025_안전교육_슬라이드.pptx", type: "file", fileType: "document", size: "8.5 MB", modified: "2025-01-28", modifiedBy: "박민수" },
  ],
}

// AI 정리 내역 데이터
const aiOrganizationLog = [
  {
    id: 1,
    fileName: "HCR_운전변수_분석_2025.xlsx",
    action: "이동",
    from: "미분류",
    to: "Team Knowledge (루트)",
    reason: "공정 분석 문서로 판단, 팀 전체 공유가 필요한 자료",
    timestamp: "2025-02-04 14:30",
    status: "completed"
  },
  {
    id: 2,
    fileName: "2월_정기점검_계획.docx",
    action: "이동",
    from: "미분류",
    to: "Team Knowledge (루트)",
    reason: "정비 계획 문서, 정비 기록 폴더로 이동 권장",
    timestamp: "2025-02-04 14:25",
    status: "pending_confirm"
  },
  {
    id: 3,
    fileName: "CDU_비정상_대응_사례.pdf",
    action: "이동",
    from: "미분류",
    to: "공정 가이드 > 비정상 대응 가이드",
    reason: "비정상 대응 관련 문서로 자동 분류",
    timestamp: "2025-02-03 09:15",
    status: "completed"
  },
]

const getFileIcon = (item: FileItem) => {
  if (item.type === "folder") return Folder
  switch (item.fileType) {
    case "document": return FileText
    case "spreadsheet": return FileSpreadsheet
    case "image": return FileImage
    case "pdf": return FileText
    default: return File
  }
}

const getFileIconColor = (item: FileItem) => {
  if (item.type === "folder") return "text-amber-500"
  switch (item.fileType) {
    case "document": return "text-blue-500"
    case "spreadsheet": return "text-green-500"
    case "image": return "text-purple-500"
    case "pdf": return "text-red-500"
    default: return "text-gray-500"
  }
}

export default function TeamKnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [currentPath, setCurrentPath] = useState<string[]>(["root"])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showAiLog, setShowAiLog] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const currentFolderId = currentPath[currentPath.length - 1]
  const currentItems = folderStructure[currentFolderId] || []

  const filteredItems = currentItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFolderClick = (folderId: string, folderName: string) => {
    setCurrentPath([...currentPath, folderId])
    setSelectedItems([])
  }

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1))
    setSelectedItems([])
  }

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 2000)
  }

  const getBreadcrumbName = (id: string, index: number) => {
    if (id === "root") return "Team Knowledge"
    const parentId = currentPath[index - 1]
    const parentItems = folderStructure[parentId] || []
    const item = parentItems.find(i => i.id === id)
    return item?.name || id
  }

  const newItemsCount = currentItems.filter(i => i.isNew).length
  const aiMovedCount = currentItems.filter(i => i.aiMoved).length

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Knowledge
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                팀 공용 문서 저장소 - OneDrive 동기화
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAiLog(true)}
                      className="relative"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                      AI 정리 내역
                      {aiMovedCount > 0 && (
                        <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-amber-500">{aiMovedCount}</Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI가 자동으로 정리한 파일 내역</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
                {syncing ? "동기화 중..." : "동기화"}
              </Button>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                업로드
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* 알림 배너 */}
          {aiMovedCount > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        AI가 {aiMovedCount}개 파일을 자동 정리했습니다
                      </p>
                      <p className="text-xs text-amber-600">
                        새로 등록된 파일이 적절한 위치로 이동되었습니다. 정리 내역을 확인해주세요.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
                    onClick={() => setShowAiLog(true)}
                  >
                    내역 확인
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 툴바 */}
          <div className="flex items-center justify-between mb-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm">
              {currentPath.map((id, index) => (
                <div key={id} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors",
                      index === currentPath.length - 1 ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {index === 0 && <Home className="h-4 w-4" />}
                    {getBreadcrumbName(id, index)}
                  </button>
                </div>
              ))}
            </div>

            {/* 검색 및 뷰 모드 */}
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="파일 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 파일 목록 - 리스트 뷰 */}
          {viewMode === "list" && (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">이름</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground w-24">수정일</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground w-28">수정자</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground w-20">크기</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const Icon = getFileIcon(item)
                      const iconColor = getFileIconColor(item)
                      return (
                        <tr 
                          key={item.id}
                          className={cn(
                            "border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors",
                            item.aiMoved && "bg-amber-50/50"
                          )}
                          onClick={() => item.type === "folder" && handleFolderClick(item.id, item.name)}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Icon className={cn("h-5 w-5", iconColor)} />
                              <span className="font-medium">{item.name}</span>
                              {item.isNew && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">New</Badge>
                              )}
                              {item.aiMoved && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        AI 정리
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>이전 위치: {item.previousLocation}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{item.modified}</td>
                          <td className="p-3 text-sm text-muted-foreground">{item.modifiedBy}</td>
                          <td className="p-3 text-sm text-muted-foreground">{item.size || "-"}</td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {item.type === "file" && (
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    다운로드
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Star className="h-4 w-4 mr-2" />
                                  즐겨찾기
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  이름 변경
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Move className="h-4 w-4 mr-2" />
                                  이동
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  복사
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredItems.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>이 폴더는 비어 있습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 파일 목록 - 그리드 뷰 */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredItems.map((item) => {
                const Icon = getFileIcon(item)
                const iconColor = getFileIconColor(item)
                return (
                  <Card 
                    key={item.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all hover:border-primary/50",
                      item.aiMoved && "border-amber-200 bg-amber-50/30"
                    )}
                    onClick={() => item.type === "folder" && handleFolderClick(item.id, item.name)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="relative">
                        <Icon className={cn("h-12 w-12 mx-auto mb-2", iconColor)} />
                        {item.aiMoved && (
                          <div className="absolute -top-1 -right-1">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.modified}</p>
                      {item.isNew && (
                        <Badge variant="secondary" className="text-xs mt-2 bg-blue-100 text-blue-700">New</Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full p-8 text-center text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>이 폴더는 비어 있습니다</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* AI 정리 내역 다이얼로그 */}
      <Dialog open={showAiLog} onOpenChange={setShowAiLog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI 자동 정리 내역
            </DialogTitle>
            <DialogDescription>
              AI가 신규 등록된 파일을 자동으로 분류하고 정리한 내역입니다.
              변경사항을 확인하고 필요시 원래 위치로 복원할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {aiOrganizationLog.map((log) => (
              <Card key={log.id} className={cn(
                "border",
                log.status === "pending_confirm" ? "border-amber-200 bg-amber-50/50" : ""
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{log.fileName}</span>
                        {log.status === "pending_confirm" && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                            확인 필요
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 line-through">{log.from}</span>
                          <ArrowUpRight className="h-3 w-3" />
                          <span className="text-green-600 font-medium">{log.to}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        {log.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {log.timestamp}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.status === "completed" ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          완료
                        </Badge>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                            복원
                          </Button>
                          <Button size="sm" className="h-7 text-xs">
                            확인
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiLog(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
