// 장기 건전성 관리 - 7개 카테고리 데이터 모델

export type HealthCategory =
  | "fouling"
  | "coking"
  | "catalyst-aging"
  | "hydraulics"
  | "separation"
  | "energy"
  | "mechanical"

export type TrafficLight = "red" | "yellow" | "green"

export interface HealthEquipment {
  id: string
  name: string
  process: string            // HCR, FCC, CDU, VDU, SRU, KD, CCR, MFC, PE
  equipmentType: string      // 열교환기, 가열로 코일 등
  healthIndex: {
    name: string             // U값, WABT, dP 등
    unit: string
    currentValue: number
    designValue: number
    limitValue: number
    weeklySlope: number      // 이번주 기울기 (양수=악화, 음수=개선)
    avgSlope: number         // 지난 N주 평균 기울기
    trend: number[]          // 최근 12주 트렌드 데이터
  }
  trafficLight: TrafficLight
  slopeRatio: number         // weeklySlope / avgSlope
}

export interface RelatedTrendTag {
  tagId: string
  description: string
  unit: string
  type: "Temperature" | "Pressure" | "Flow" | "Level" | "Analysis" | "Control" | "Performance"
  values: number[]
  limit?: number
  lowLimit?: number
}

export interface HealthCategoryConfig {
  id: HealthCategory
  label: string
  description: string
  icon: string             // lucide icon name
  equipmentTypes: string[] // 장치 유형 목록
  healthIndexName: string  // 대표 Health Index 이름
  healthIndexUnit: string
}

// ---- 카테고리 설정 ----
export const HEALTH_CATEGORIES: Record<HealthCategory, HealthCategoryConfig> = {
  fouling: {
    id: "fouling",
    label: "Fouling",
    description: "열교환기, 공랭기, 쿨러, 네트워크의 오염/침적 관리",
    icon: "Flame",
    equipmentTypes: ["열교환기", "공랭기", "쿨러", "네트워크"],
    healthIndexName: "U값 (총괄열전달계수)",
    healthIndexUnit: "W/m2K",
  },
  coking: {
    id: "coking",
    label: "Coking",
    description: "가열로 코일, 반응기, Fractionator Bottom 코킹 관리",
    icon: "Flame",
    equipmentTypes: ["가열로 코일", "반응기", "Fractionator Bottom"],
    healthIndexName: "TMT / Skin Temp",
    healthIndexUnit: "deg.C",
  },
  "catalyst-aging": {
    id: "catalyst-aging",
    label: "촉매 Aging",
    description: "모든 촉매 반응기 (HCR, HDS, FCC 등) 촉매 성능 추적",
    icon: "Activity",
    equipmentTypes: ["촉매 반응기"],
    healthIndexName: "WABT",
    healthIndexUnit: "deg.C",
  },
  hydraulics: {
    id: "hydraulics",
    label: "Hydraulics",
    description: "탑, 필터, 베드, 배관의 유압 건전성 관리",
    icon: "ArrowDownUp",
    equipmentTypes: ["탑", "필터", "베드", "배관"],
    healthIndexName: "차압 (dP)",
    healthIndexUnit: "kg/cm2",
  },
  separation: {
    id: "separation",
    label: "Separation",
    description: "CDU/VDU/Stripping/Recovery Unit 분리 효율 관리",
    icon: "Layers",
    equipmentTypes: ["CDU Column", "VDU Column", "Stripper", "Recovery Unit"],
    healthIndexName: "분리 효율",
    healthIndexUnit: "%",
  },
  energy: {
    id: "energy",
    label: "Energy",
    description: "Heater, Steam, Utilities, HEN 에너지 효율 관리",
    icon: "Zap",
    equipmentTypes: ["Heater", "Steam System", "Utility", "HEN"],
    healthIndexName: "열효율",
    healthIndexUnit: "%",
  },
  mechanical: {
    id: "mechanical",
    label: "Mechanical",
    description: "펌프, 압축기, 회전기계 기계적 건전성 관리",
    icon: "Cog",
    equipmentTypes: ["펌프", "압축기", "회전기계"],
    healthIndexName: "진동 수준",
    healthIndexUnit: "mm/s",
  },
}

// ---- 공정 목록 ----
export const PROCESSES = ["HCR", "FCC", "CDU", "VDU", "SRU", "KD", "CCR", "MFC", "PE"] as const

// ---- 신호등 판정 ----
export function calculateTrafficLight(weeklySlope: number, avgSlope: number): { light: TrafficLight; ratio: number } {
  // 기울기가 양수 = 악화 방향 (U값 제외), 비율로 판정
  if (avgSlope === 0) {
    if (Math.abs(weeklySlope) < 0.01) return { light: "green", ratio: 0 }
    return { light: weeklySlope > 0 ? "yellow" : "green", ratio: 999 }
  }
  const ratio = weeklySlope / avgSlope
  if (ratio >= 1.5) return { light: "red", ratio }
  if (ratio >= 1.2) return { light: "yellow", ratio }
  return { light: "green", ratio }
}

// ---- Mock 트렌드 생성 유틸 ----
function seededRandom(seed: number) {
  return ((Math.sin(seed) * 10000) % 1 + 1) % 1
}

function generateTrend(base: number, volatility: number, slope: number, length: number, seed: number): number[] {
  return Array.from({ length }, (_, i) => {
    const noise = (seededRandom(seed + i * 7) - 0.5) * volatility
    return +(base + slope * i + noise).toFixed(2)
  })
}

// ---- 카테고리별 장비 데이터 생성 ----
export function getEquipmentData(category: HealthCategory): HealthEquipment[] {
  const equipmentMap: Record<HealthCategory, HealthEquipment[]> = {
    fouling: [
      mkEquip("F-E101", "Feed/Effluent Exchanger #1", "HCR", "열교환기", "U값", "W/m2K", 520, 750, 350, -8.2, -4.5, 101),
      mkEquip("F-E102", "Feed/Effluent Exchanger #2", "HCR", "열교환기", "U값", "W/m2K", 480, 750, 350, -12.5, -5.1, 102),
      mkEquip("F-E201", "Preheat Exchanger #1", "CDU", "열교환기", "U값", "W/m2K", 610, 800, 400, -3.8, -3.2, 201),
      mkEquip("F-E202", "Preheat Exchanger #2", "CDU", "열교환기", "U값", "W/m2K", 430, 800, 400, -9.6, -4.8, 202),
      mkEquip("F-A101", "Reactor Eff. Air Cooler", "HCR", "공랭기", "U값", "W/m2K", 340, 500, 250, -6.1, -3.5, 103),
      mkEquip("F-C101", "Product Cooler", "VDU", "쿨러", "U값", "W/m2K", 560, 700, 380, -2.1, -2.0, 301),
      mkEquip("F-E301", "LVGO Cooler", "VDU", "열교환기", "U값", "W/m2K", 490, 680, 370, -4.5, -4.0, 302),
      mkEquip("F-E401", "Overhead Condenser", "CCR", "열교환기", "U값", "W/m2K", 390, 600, 320, -7.8, -3.9, 401),
      mkEquip("F-N101", "Preheat Network", "CDU", "네트워크", "U값", "W/m2K", 550, 750, 400, -5.2, -4.8, 501),
    ],
    coking: [
      mkEquip("C-H101", "Charge Heater Pass 1", "CDU", "가열로 코일", "TMT", "deg.C", 545, 400, 580, 1.8, 0.9, 601),
      mkEquip("C-H102", "Charge Heater Pass 2", "CDU", "가열로 코일", "TMT", "deg.C", 538, 400, 580, 1.2, 1.0, 602),
      mkEquip("C-H201", "VDU Heater", "VDU", "가열로 코일", "TMT", "deg.C", 562, 400, 580, 2.5, 1.1, 603),
      mkEquip("C-R101", "HCR Reactor Bed #1", "HCR", "반응기", "TMT", "deg.C", 425, 350, 460, 0.8, 0.7, 604),
      mkEquip("C-R102", "HCR Reactor Bed #2", "HCR", "반응기", "TMT", "deg.C", 430, 350, 460, 1.5, 0.6, 605),
      mkEquip("C-F101", "CDU Frac. Bottom", "CDU", "Fractionator Bottom", "TMT", "deg.C", 358, 300, 380, 0.5, 0.4, 606),
      mkEquip("C-F201", "VDU Frac. Bottom", "VDU", "Fractionator Bottom", "TMT", "deg.C", 372, 300, 380, 2.1, 0.8, 607),
    ],
    "catalyst-aging": [
      mkEquip("A-R101", "HCR 1st Stage Reactor", "HCR", "촉매 반응기", "WABT", "deg.C", 388, 360, 410, 0.45, 0.25, 701),
      mkEquip("A-R102", "HCR 2nd Stage Reactor", "HCR", "촉매 반응기", "WABT", "deg.C", 392, 360, 410, 0.72, 0.35, 702),
      mkEquip("A-R201", "CCR Reactor #1", "CCR", "촉매 반응기", "WABT", "deg.C", 502, 480, 530, 0.38, 0.30, 703),
      mkEquip("A-R202", "CCR Reactor #2", "CCR", "촉매 반응기", "WABT", "deg.C", 498, 480, 530, 0.28, 0.25, 704),
      mkEquip("A-R301", "FCC Riser Reactor", "FCC", "촉매 반응기", "WABT", "deg.C", 525, 500, 550, 0.85, 0.40, 705),
      mkEquip("A-R401", "KD HDS Reactor", "KD", "촉매 반응기", "WABT", "deg.C", 365, 340, 390, 0.32, 0.28, 706),
      mkEquip("A-R501", "SRU Claus Reactor", "SRU", "촉매 반응기", "WABT", "deg.C", 305, 280, 330, 0.55, 0.30, 707),
    ],
    hydraulics: [
      mkEquip("H-T101", "CDU Main Column", "CDU", "탑", "dP", "kg/cm2", 0.42, 0.2, 0.65, 0.012, 0.008, 801),
      mkEquip("H-T201", "VDU Vacuum Column", "VDU", "탑", "dP", "mmHg", 18.5, 10, 25, 0.35, 0.20, 802),
      mkEquip("H-FL01", "HCR Feed Filter", "HCR", "필터", "dP", "kg/cm2", 1.2, 0.3, 1.8, 0.08, 0.04, 803),
      mkEquip("H-FL02", "CCR Feed Filter", "CCR", "필터", "dP", "kg/cm2", 0.85, 0.3, 1.5, 0.05, 0.04, 804),
      mkEquip("H-B101", "HCR Reactor Bed dP", "HCR", "베드", "dP", "kg/cm2", 0.95, 0.4, 1.5, 0.065, 0.03, 805),
      mkEquip("H-P101", "Transfer Line", "CDU", "배관", "dP", "kg/cm2", 0.28, 0.1, 0.5, 0.005, 0.004, 806),
    ],
    separation: [
      mkEquip("S-C101", "CDU Atmospheric Column", "CDU", "CDU Column", "분리효율", "%", 94.2, 98, 88, -0.18, -0.10, 901),
      mkEquip("S-C201", "VDU Vacuum Column", "VDU", "VDU Column", "분리효율", "%", 91.5, 96, 85, -0.32, -0.15, 902),
      mkEquip("S-S101", "Naphtha Stripper", "CDU", "Stripper", "분리효율", "%", 96.8, 99, 90, -0.05, -0.06, 903),
      mkEquip("S-S201", "VDU Side Stripper", "VDU", "Stripper", "분리효율", "%", 93.1, 98, 88, -0.25, -0.12, 904),
      mkEquip("S-R101", "LPG Recovery Unit", "FCC", "Recovery Unit", "분리효율", "%", 92.0, 97, 86, -0.40, -0.18, 905),
    ],
    energy: [
      mkEquip("E-H101", "CDU Charge Heater", "CDU", "Heater", "열효율", "%", 88.5, 92, 82, -0.22, -0.15, 1001),
      mkEquip("E-H201", "VDU Charge Heater", "VDU", "Heater", "열효율", "%", 85.2, 92, 80, -0.45, -0.20, 1002),
      mkEquip("E-H301", "HCR Charge Heater", "HCR", "Heater", "열효율", "%", 87.1, 90, 82, -0.18, -0.16, 1003),
      mkEquip("E-ST01", "HP Steam System", "CDU", "Steam System", "열효율", "%", 91.0, 95, 85, -0.08, -0.07, 1004),
      mkEquip("E-U101", "Cooling Water System", "VDU", "Utility", "열효율", "%", 89.3, 93, 83, -0.15, -0.12, 1005),
      mkEquip("E-N101", "CDU Preheat HEN", "CDU", "HEN", "열효율", "%", 82.5, 90, 75, -0.55, -0.25, 1006),
    ],
    mechanical: [
      mkEquip("M-P101", "HCR Feed Pump", "HCR", "펌프", "진동", "mm/s", 3.8, 0, 7.0, 0.15, 0.08, 1101),
      mkEquip("M-P102", "HCR Recycle Pump", "HCR", "펌프", "진동", "mm/s", 2.5, 0, 7.0, 0.05, 0.06, 1102),
      mkEquip("M-P201", "CDU Reflux Pump", "CDU", "펌프", "진동", "mm/s", 4.2, 0, 7.0, 0.22, 0.10, 1103),
      mkEquip("M-K101", "H2 Makeup Compressor", "HCR", "압축기", "진동", "mm/s", 5.1, 0, 8.0, 0.35, 0.15, 1104),
      mkEquip("M-K201", "Wet Gas Compressor", "FCC", "압축기", "진동", "mm/s", 4.8, 0, 8.0, 0.30, 0.18, 1105),
      mkEquip("M-R101", "Blower", "SRU", "회전기계", "진동", "mm/s", 3.2, 0, 6.0, 0.10, 0.08, 1106),
    ],
  }
  return equipmentMap[category] || []
}

// 장비 생성 helper - Fouling의 경우 U값은 감소가 악화이므로 기울기가 음수가 "나쁜" 방향
// Coking/Catalyst/Hydraulics/Mechanical은 증가가 악화
// Separation/Energy는 감소가 악화
function mkEquip(
  id: string, name: string, process: string, equipType: string,
  hiName: string, hiUnit: string, current: number, design: number, limit: number,
  weeklySlope: number, avgSlope: number, seed: number
): HealthEquipment {
  // 방향 정규화: 항상 "악화 방향"이 양수가 되도록 slopeRatio 계산
  // Fouling (U값 감소=악화) -> 기울기 음수가 악화 -> ratio = |weeklySlope| / |avgSlope|
  // Coking, Hydraulics, Mechanical (값 증가=악화) -> 양수 기울기가 악화
  // Separation, Energy (효율 감소=악화) -> 음수 기울기가 악화
  const absWeekly = Math.abs(weeklySlope)
  const absAvg = Math.abs(avgSlope)
  const { light, ratio } = calculateTrafficLight(absWeekly, absAvg)

  const trend = generateTrend(current - weeklySlope * 11, Math.abs(weeklySlope) * 2, weeklySlope, 12, seed)

  return {
    id, name, process, equipmentType: equipType,
    healthIndex: {
      name: hiName, unit: hiUnit, currentValue: current, designValue: design, limitValue: limit,
      weeklySlope, avgSlope, trend,
    },
    trafficLight: light,
    slopeRatio: ratio,
  }
}

// ---- 카테고리별 연관 트렌드 태그 그룹 ----
export function getRelatedTrends(category: HealthCategory, equipId: string): RelatedTrendTag[] {
  const seed = equipId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const mkTrend = (tagId: string, desc: string, unit: string, type: RelatedTrendTag["type"], base: number, vol: number, s: number, limit?: number, lowLimit?: number): RelatedTrendTag => ({
    tagId, description: desc, unit, type,
    values: generateTrend(base, vol, 0, 12, s),
    limit, lowLimit,
  })

  const relatedMap: Record<HealthCategory, (s: number) => RelatedTrendTag[]> = {
    fouling: (s) => [
      mkTrend("TI-FO01", "Shell Side Inlet Temp", "deg.C", "Temperature", 180, 8, s+1, 220),
      mkTrend("TI-FO02", "Shell Side Outlet Temp", "deg.C", "Temperature", 150, 6, s+2, 200),
      mkTrend("TI-FO03", "Tube Side Inlet Temp", "deg.C", "Temperature", 280, 10, s+3),
      mkTrend("TI-FO04", "Tube Side Outlet Temp", "deg.C", "Temperature", 240, 8, s+4),
      mkTrend("FI-FO01", "Shell Side Flow", "m3/h", "Flow", 350, 20, s+5, 500, 200),
      mkTrend("FI-FO02", "Tube Side Flow", "m3/h", "Flow", 280, 15, s+6, 400, 150),
      mkTrend("PDI-FO01", "Exchanger dP (Shell)", "kg/cm2", "Pressure", 0.8, 0.15, s+7, 1.5),
      mkTrend("PDI-FO02", "Exchanger dP (Tube)", "kg/cm2", "Pressure", 0.6, 0.1, s+8, 1.2),
    ],
    coking: (s) => [
      mkTrend("TI-CK01", "Coil Outlet Temp", "deg.C", "Temperature", 380, 12, s+1, 420),
      mkTrend("TI-CK02", "Skin Temp (Max)", "deg.C", "Temperature", 540, 15, s+2, 580),
      mkTrend("TI-CK03", "Firebox Temp", "deg.C", "Temperature", 850, 25, s+3, 950),
      mkTrend("FI-CK01", "Coil Flow Rate", "m3/h", "Flow", 120, 10, s+4, undefined, 80),
      mkTrend("FI-CK02", "Fuel Gas Flow", "Nm3/h", "Flow", 3500, 200, s+5, 5000),
      mkTrend("AI-CK01", "Excess O2", "%", "Analysis", 3.2, 0.8, s+6, 6.0, 1.5),
      mkTrend("PI-CK01", "Draft Pressure", "mmH2O", "Pressure", -12, 3, s+7),
    ],
    "catalyst-aging": (s) => [
      mkTrend("PI-CA01", "Reactor Pressure", "kg/cm2", "Pressure", 155, 3, s+1, 170, 140),
      mkTrend("TI-CA01", "Reactor Outlet Temp", "deg.C", "Temperature", 400, 8, s+2, 420),
      mkTrend("FI-CA01", "Feed Flow", "m3/h", "Flow", 280, 15, s+3, 350, 200),
      mkTrend("FI-CA02", "H2/HC Ratio", "Nm3/m3", "Flow", 800, 40, s+4, undefined, 600),
      mkTrend("AI-CA01", "Feed Sulfur", "ppm", "Analysis", 2500, 200, s+5, 4000),
      mkTrend("AI-CA02", "Product Sulfur", "ppm", "Analysis", 15, 5, s+6, 50),
      mkTrend("PDI-CA01", "Reactor dP", "kg/cm2", "Pressure", 1.2, 0.2, s+7, 2.0),
      mkTrend("XI-CA01", "Conversion Rate", "%", "Performance", 92, 2, s+8, undefined, 85),
    ],
    hydraulics: (s) => [
      mkTrend("FI-HY01", "Feed Flow Rate", "m3/h", "Flow", 450, 25, s+1, 600, 300),
      mkTrend("PI-HY01", "Top Pressure", "kg/cm2", "Pressure", 1.5, 0.2, s+2, 2.5),
      mkTrend("PI-HY02", "Bottom Pressure", "kg/cm2", "Pressure", 1.9, 0.2, s+3, 3.0),
      mkTrend("LI-HY01", "Tray Level", "%", "Level", 55, 8, s+4, 80, 20),
      mkTrend("TI-HY01", "Top Temperature", "deg.C", "Temperature", 120, 5, s+5, 150),
      mkTrend("FI-HY02", "Reflux Flow", "m3/h", "Flow", 180, 12, s+6, 250, 100),
    ],
    separation: (s) => [
      mkTrend("TI-SP01", "Column Top Temp", "deg.C", "Temperature", 125, 4, s+1, 145),
      mkTrend("TI-SP02", "Column Bottom Temp", "deg.C", "Temperature", 345, 8, s+2, 380),
      mkTrend("PI-SP01", "Column Pressure", "kg/cm2", "Pressure", 1.2, 0.15, s+3, 1.8),
      mkTrend("FI-SP01", "Feed Flow", "m3/h", "Flow", 520, 30, s+4, 700, 350),
      mkTrend("FI-SP02", "Reflux Ratio", "-", "Control", 3.5, 0.3, s+5, 5.0, 2.0),
      mkTrend("AI-SP01", "Product Purity", "%", "Analysis", 95, 1.5, s+6, undefined, 90),
      mkTrend("AI-SP02", "Overlap (5-95)", "deg.C", "Analysis", 12, 3, s+7, 20),
    ],
    energy: (s) => [
      mkTrend("TI-EN01", "Stack Temp", "deg.C", "Temperature", 185, 10, s+1, 250),
      mkTrend("FI-EN01", "Fuel Consumption", "Nm3/h", "Flow", 4200, 300, s+2, 5500),
      mkTrend("AI-EN01", "Excess O2", "%", "Analysis", 3.5, 0.6, s+3, 6.0, 1.5),
      mkTrend("TI-EN02", "Feed Preheat Temp", "deg.C", "Temperature", 280, 8, s+4, undefined, 240),
      mkTrend("XI-EN01", "Energy Intensity", "Gcal/kBBL", "Performance", 85, 5, s+5, 100),
      mkTrend("FI-EN02", "Steam Generation", "ton/h", "Flow", 45, 5, s+6, undefined, 30),
    ],
    mechanical: (s) => [
      mkTrend("VI-MC01", "Bearing Vibration (DE)", "mm/s", "Performance", 3.5, 0.8, s+1, 7.0),
      mkTrend("VI-MC02", "Bearing Vibration (NDE)", "mm/s", "Performance", 2.8, 0.6, s+2, 7.0),
      mkTrend("TI-MC01", "Bearing Temp (DE)", "deg.C", "Temperature", 65, 5, s+3, 90),
      mkTrend("TI-MC02", "Bearing Temp (NDE)", "deg.C", "Temperature", 58, 4, s+4, 90),
      mkTrend("PI-MC01", "Discharge Pressure", "kg/cm2", "Pressure", 12, 1.5, s+5, 16),
      mkTrend("FI-MC01", "Seal Oil Flow", "L/min", "Flow", 8, 1.2, s+6, undefined, 4),
      mkTrend("AI-MC01", "Lube Oil Quality", "ppm", "Analysis", 15, 5, s+7, 40),
    ],
  }

  return relatedMap[category]?.(seed) || []
}

// 카테고리별 신호등 요약
export function getCategorySummary(category: HealthCategory): { red: number; yellow: number; green: number; total: number } {
  const equipment = getEquipmentData(category)
  return {
    red: equipment.filter(e => e.trafficLight === "red").length,
    yellow: equipment.filter(e => e.trafficLight === "yellow").length,
    green: equipment.filter(e => e.trafficLight === "green").length,
    total: equipment.length,
  }
}
