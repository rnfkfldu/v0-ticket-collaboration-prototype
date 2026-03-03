"use client"

import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"

// Cookie keys for persisting user selection (works on both server and client)
const USER_COOKIE_KEY = "selected-user-id"
const SCOPE_COOKIE_KEY = "selected-scope-mode"

// Cookie helpers
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

// ============================================================
// 1) Process definitions
// ============================================================
export type Division = "Refining" | "Chemical" | "Upgrading"

export interface ProcessUnit {
  id: string          // short code
  name: string        // display name
  division: Division
  hasDeposition: boolean
  hasCatalystPerformance: boolean
  hasIntegrityRisk: boolean
}

export const ALL_PROCESSES: ProcessUnit[] = [
  // ── Refining (17 units) ──
  { id: "1CDU", name: "#1 CDU", division: "Refining", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "2CDU", name: "#2 CDU", division: "Refining", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "3CDU", name: "#3 CDU", division: "Refining", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "4CDU", name: "#4 CDU", division: "Refining", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "1VDU", name: "#1 VDU", division: "Refining", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },
  { id: "2VDU", name: "#2 VDU", division: "Refining", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },
  { id: "1NHT", name: "#1 NHT", division: "Refining", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "2NHT", name: "#2 NHT", division: "Refining", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "1KHT", name: "#1 KHT", division: "Refining", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "2KHT", name: "#2 KHT", division: "Refining", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "1DHT", name: "#1 DHT", division: "Refining", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "2DHT", name: "#2 DHT", division: "Refining", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "1HDS", name: "#1 HDS", division: "Refining", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "2HDS", name: "#2 HDS", division: "Refining", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "ALKY", name: "Alkylation", division: "Refining", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "ISOU", name: "Isomerization", division: "Refining", hasDeposition: false, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "UTIL-R", name: "Refining Utilities", division: "Refining", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },

  // ── Chemical (16 units) ──
  { id: "1CCR", name: "#1 CCR", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "2CCR", name: "#2 CCR", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "PX", name: "PX", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "OX", name: "OX", division: "Chemical", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },
  { id: "SM", name: "SM", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "BD", name: "BD", division: "Chemical", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "MFC", name: "MFC", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "1PE", name: "#1 PE", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "2PE", name: "#2 PE", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "1PP", name: "#1 PP", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "2PP", name: "#2 PP", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "BTX", name: "BTX", division: "Chemical", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },
  { id: "NCC", name: "NCC", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: true },
  { id: "EOG", name: "EOG", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "AROM", name: "Aromatics Complex", division: "Chemical", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "UTIL-C", name: "Chemical Utilities", division: "Chemical", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },

  // ── Upgrading (17 units) ──
  { id: "HCR", name: "HCR", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: true },
  { id: "VGOFCC", name: "VGOFCC", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: true },
  { id: "RFCC", name: "RFCC", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: true },
  { id: "VRHR", name: "VRHR", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "1KD", name: "#1 KD", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "2KD", name: "#2 KD", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "3KD", name: "#3 KD", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "4KD", name: "#4 KD", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "VBU", name: "VBU", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "RHDS", name: "RHDS", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "VGHDS", name: "VGHDS", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "SRU", name: "SRU", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "SWS", name: "SWS", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },
  { id: "ARU", name: "ARU", division: "Upgrading", hasDeposition: false, hasCatalystPerformance: false, hasIntegrityRisk: true },
  { id: "HYDR", name: "Hydrogen Plant", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: true, hasIntegrityRisk: false },
  { id: "WWTF", name: "WWTF", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },
  { id: "UTIL-U", name: "Upgrading Utilities", division: "Upgrading", hasDeposition: true, hasCatalystPerformance: false, hasIntegrityRisk: false },
]

// ============================================================
// 2) User Roles
// ============================================================
export type UserRole = "engineer" | "team-lead" | "division-head" | "plant-head" | "operator" | "equipment-engineer"

export type Department = "production" | "equipment-tech" | "inspection" | "reliability"

export interface UserProfile {
  id: string
  name: string
  role: UserRole
  roleLabel: string
  division?: Division
  department?: Department
  assignedProcessIds: string[]
  alertMinSeverity: "info" | "warning" | "critical"
  showManagementDashboard: boolean
  showStrategicTasks?: boolean
  showDataSettings?: boolean
  showOptimization?: boolean
  focusArea?: "operations" | "reliability" | "equipment"
}

export const USER_PROFILES: UserProfile[] = [
  {
    id: "u-engineer-1",
    name: "김철수",
    role: "engineer",
    roleLabel: "생산팀원",
    department: "production",
    assignedProcessIds: ["HCR", "VGOFCC"],
    alertMinSeverity: "info",
    showManagementDashboard: false,
    showStrategicTasks: true,
    showDataSettings: true,
    showOptimization: true,
    focusArea: "operations",
  },
  {
    id: "u-engineer-2",
    name: "박영희",
    role: "engineer",
    roleLabel: "생산팀원",
    department: "production",
    assignedProcessIds: ["1CDU", "2CDU", "1VDU"],
    alertMinSeverity: "info",
    showManagementDashboard: false,
    showStrategicTasks: true,
    showDataSettings: true,
    showOptimization: true,
    focusArea: "operations",
  },
  {
    id: "u-team-lead",
    name: "이민수",
    role: "team-lead",
    roleLabel: "기술팀장",
    department: "production",
    assignedProcessIds: ["HCR", "VGOFCC", "RFCC", "VRHR", "1KD", "2KD", "3KD", "4KD", "VBU", "RHDS", "VGHDS", "SRU"],
    alertMinSeverity: "warning",
    showManagementDashboard: true,
    showStrategicTasks: true,
    showDataSettings: true,
    showOptimization: true,
    focusArea: "operations",
  },
  {
    id: "u-div-head",
    name: "정수연",
    role: "division-head",
    roleLabel: "부문장",
    division: "Upgrading",
    department: "production",
    assignedProcessIds: ALL_PROCESSES.filter(p => p.division === "Upgrading").map(p => p.id),
    alertMinSeverity: "warning",
    showManagementDashboard: true,
    showStrategicTasks: true,
    showDataSettings: true,
    showOptimization: true,
    focusArea: "operations",
  },
  {
    id: "u-operator-1",
    name: "최운전",
    role: "operator",
    roleLabel: "운전원",
    department: "production",
    assignedProcessIds: ["HCR", "VGOFCC", "RFCC"],
    alertMinSeverity: "info",
    showManagementDashboard: false,
    showStrategicTasks: false,
    showDataSettings: false,
    showOptimization: false,
    focusArea: "operations",
  },
  {
    id: "u-equip-eng-1",
    name: "박설비",
    role: "equipment-engineer",
    roleLabel: "설비기술팀원",
    department: "equipment-tech",
    assignedProcessIds: ALL_PROCESSES.filter(p => p.division === "Upgrading").map(p => p.id),
    alertMinSeverity: "info",
    showManagementDashboard: false,
    showStrategicTasks: true,
    showDataSettings: true,
    showOptimization: false,
    focusArea: "equipment",
  },
  {
    id: "u-equip-eng-2",
    name: "이정비",
    role: "equipment-engineer",
    roleLabel: "설비기술팀원",
    department: "equipment-tech",
    assignedProcessIds: ALL_PROCESSES.filter(p => p.division === "Refining" || p.division === "Chemical").map(p => p.id),
    alertMinSeverity: "info",
    showManagementDashboard: false,
    showStrategicTasks: true,
    showDataSettings: true,
    showOptimization: false,
    focusArea: "equipment",
  },
  {
    id: "u-equip-lead",
    name: "정기술",
    role: "equipment-engineer",
    roleLabel: "설비기술팀장",
    department: "equipment-tech",
    assignedProcessIds: ALL_PROCESSES.map(p => p.id),
    alertMinSeverity: "warning",
    showManagementDashboard: true,
    showStrategicTasks: true,
    showDataSettings: true,
    showOptimization: false,
    focusArea: "equipment",
  },
]

// ============================================================
// 3) React Context
// ============================================================
export type ScopeMode = "my-processes" | "all-processes"

interface UserContextValue {
  currentUser: UserProfile
  setCurrentUser: (user: UserProfile) => void
  scopeMode: ScopeMode
  setScopeMode: (mode: ScopeMode) => void
  visibleProcesses: ProcessUnit[]
  assignedProcesses: ProcessUnit[]
  isManagement: boolean
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false)
  
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => {
    if (typeof document !== "undefined") {
      const savedUserId = getCookie(USER_COOKIE_KEY)
      if (savedUserId) {
        const found = USER_PROFILES.find(u => u.id === savedUserId)
        if (found) return found
      }
    }
    return USER_PROFILES[0]
  })
  
  const [scopeMode, setScopeModeState] = useState<ScopeMode>(() => {
    if (typeof document !== "undefined") {
      const savedScope = getCookie(SCOPE_COOKIE_KEY)
      if (savedScope === "all-processes" || savedScope === "my-processes") {
        return savedScope
      }
    }
    return "my-processes"
  })

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    
    const savedUserId = getCookie(USER_COOKIE_KEY)
    if (savedUserId) {
      const found = USER_PROFILES.find(u => u.id === savedUserId)
      if (found && found.id !== currentUser.id) {
        setCurrentUserState(found)
      }
    }
    
    const savedScope = getCookie(SCOPE_COOKIE_KEY)
    if (savedScope && (savedScope === "all-processes" || savedScope === "my-processes")) {
      if (savedScope !== scopeMode) {
        setScopeModeState(savedScope)
      }
    }
  }, [currentUser.id, scopeMode])

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user)
    setCookie(USER_COOKIE_KEY, user.id)
  }

  const setScopeMode = (mode: ScopeMode) => {
    setScopeModeState(mode)
    setCookie(SCOPE_COOKIE_KEY, mode)
  }

  const assignedProcesses = ALL_PROCESSES.filter(p =>
    currentUser.assignedProcessIds.includes(p.id)
  )

  const visibleProcesses = scopeMode === "my-processes"
    ? assignedProcesses
    : ALL_PROCESSES

  const isManagement = currentUser.showManagementDashboard

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser,
      scopeMode,
      setScopeMode,
      visibleProcesses,
      assignedProcesses,
      isManagement,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used within UserProvider")
  return ctx
}

// ============================================================
// 4) Helpers
// ============================================================
export function getProcessesByDivision(processes: ProcessUnit[]) {
  const map: Record<Division, ProcessUnit[]> = { Refining: [], Chemical: [], Upgrading: [] }
  for (const p of processes) {
    map[p.division].push(p)
  }
  return map
}

export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case "engineer":
      return "담당 공정의 실시간 운전 현황을 모니터링하고 이벤트에 대응합니다."
    case "team-lead":
      return "팀 내 공정 전체를 관리하고 팀원들의 업무를 조율합니다."
    case "division-head":
      return "부문 전체의 운전 현황을 모니터링하고 의사결정을 지원합니다."
    case "plant-head":
      return "전 공정의 운전 현황을 모니터링하고 전략적 의사결정을 수행합니다."
    case "operator":
      return "현장 운전 현황 모니터링에 집중합니다. 알람 및 실시간 데이터 확인이 주요 업무입니다."
    case "equipment-engineer":
      return "설비 건전성 및 Reliability 관점에서 회전기기, 정적기기를 모니터링합니다."
    default:
      return ""
  }
}

// Helper to get department label for display
export function getDepartmentLabel(dept?: Department): string {
  switch (dept) {
    case "production": return "생산팀"
    case "equipment-tech": return "설비기술팀"
    case "inspection": return "검사팀"
    case "reliability": return "신뢰성팀"
    default: return ""
  }
}
