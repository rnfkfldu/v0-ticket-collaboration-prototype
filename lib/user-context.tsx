"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"

// ============================================================
// 1) Division / Process Registry
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
export type UserRole = "engineer" | "team-lead" | "division-head" | "plant-head"

export interface UserProfile {
  id: string
  name: string
  role: UserRole
  roleLabel: string
  division?: Division       // for division-head
  assignedProcessIds: string[]  // for engineer / team-lead: list of ProcessUnit ids
  alertMinSeverity: "info" | "warning" | "critical"  // role-based default filter
  showManagementDashboard: boolean
}

export const USER_PROFILES: UserProfile[] = [
  {
    id: "u-engineer-1",
    name: "김철수",
    role: "engineer",
    roleLabel: "생산팀원",
    assignedProcessIds: ["HCR", "VGOFCC"],
    alertMinSeverity: "info",
    showManagementDashboard: false,
  },
  {
    id: "u-engineer-2",
    name: "박영희",
    role: "engineer",
    roleLabel: "생산팀원",
    assignedProcessIds: ["1CDU", "2CDU", "1VDU"],
    alertMinSeverity: "info",
    showManagementDashboard: false,
  },
  {
    id: "u-team-lead",
    name: "이민수",
    role: "team-lead",
    roleLabel: "기술팀장",
    assignedProcessIds: ["HCR", "VGOFCC", "RFCC", "VRHR", "1KD", "2KD", "3KD", "4KD", "VBU", "RHDS", "VGHDS", "SRU"],
    alertMinSeverity: "warning",
    showManagementDashboard: true,
  },
  {
    id: "u-div-head",
    name: "정수연",
    role: "division-head",
    roleLabel: "부문장",
    division: "Upgrading",
    assignedProcessIds: ALL_PROCESSES.filter(p => p.division === "Upgrading").map(p => p.id),
    alertMinSeverity: "warning",
    showManagementDashboard: true,
  },
  {
    id: "u-plant-head",
    name: "한상진",
    role: "plant-head",
    roleLabel: "공장장",
    assignedProcessIds: ALL_PROCESSES.map(p => p.id),
    alertMinSeverity: "critical",
    showManagementDashboard: true,
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
  /** Processes visible to the user given the current scope */
  visibleProcesses: ProcessUnit[]
  /** All assigned (not scope filtered) */
  assignedProcesses: ProcessUnit[]
  /** Whether the user has management-level view */
  isManagement: boolean
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_PROFILES[0])
  const [scopeMode, setScopeMode] = useState<ScopeMode>("my-processes")

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
    case "engineer": return "담당 공정(1~3개)에 대한 상세 모니터링 및 운전 관리"
    case "team-lead": return "팀원 담당 공정 합산(~12개) 관리, 주요 이슈 대시보드 중심"
    case "division-head": return "부문 내 전체 공정(~17개) 총괄, 경영지표 중심 대시보드"
    case "plant-head": return "전체 50개 공정 총괄, KPI 요약 및 핵심 지표 중심"
  }
}
