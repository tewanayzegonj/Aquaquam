export type Category = string;

export enum PerformanceType {
  Nbab = "Nbab",
  Zema = "Zema",
  Zimame = "Zimame",
  Tsenatsel = "Tsenatsel",
  Amelales = "Amelales",
  Wereb = "Wereb"
}

export enum ServiceSection {
  Wazema = "Wazema", // Eve
  Mahlet = "Mahlet"  // Dawn
}

// Liturgical Categories used for sequencing
export enum LiturgicalCategory {
  Mahtew = "Mahtew",
  Wazema = "Wazema",
  Yitbarek = "Yitbarek",
  Qine = "Qine",
  Selam = "Selam",
  Sebuh = "Sebuh",
  Melk = "Melk",
  Wereb = "Wereb",
  Ziq = "Ziq",
  Esmelealem = "Esmelealem",
  Mltan = "Mltan",
  Ezl = "Ezl",
  HyenteEzl = "Hyente Ezl",
  Abun = "Abun",
  WeeklyMezmur = "Weekly Mezmur",
  Imported = "Imported"
}

export interface MerigetaMetadata {
  notes?: string;
  regional_school?: string;
  tempo?: string;
  author?: string;
}

export interface Track {
  id: string;
  title: string;
  category: string; 
  audio_url: string;
  available_performances: PerformanceType[];
  merigeta_metadata: MerigetaMetadata;
}

export interface DayData {
  dayNumber: number;
  name: string;
  isMajorChristFeast: boolean; 
  wazemaTracks: Track[];
  mahletTracks: Track[];
}

export interface CategoryData {
  name: Category;
  days: DayData[];
}

export interface NavItemType {
  id: string;
  name: string;
  isDefault: boolean;
}

export type LibraryItemType = 'folder' | 'audio';

export interface LibraryItem {
  id: string;
  parentId: string | null; 
  categoryId: string;      
  name: string;
  type: LibraryItemType;
  url?: string;            
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}