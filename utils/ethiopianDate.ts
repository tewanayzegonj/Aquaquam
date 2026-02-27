import * as abushakir from 'abushakir';

export const ETHIOPIAN_MONTHS = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miazia", "Genbot", "Sene", "Hamle", "Nehase", "Pagume"
];

export const ETHIOPIAN_MONTHS_GEEZ = [
  "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዚያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
];

export const ETHIOPIAN_DAYS_GEEZ = [
  "እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"
];

export function toEthiopian(date: Date): { year: number; month: number; day: number } {
  try {
    const ethDate = new abushakir.EtDatetime(date.getTime());
    return { year: ethDate.year, month: ethDate.month, day: ethDate.day };
  } catch (e) {
    console.error("Date conversion error:", e);
    return { year: 2018, month: 6, day: 19 };
  }
}

export function toGeezNumber(num: number): string {
  try {
    return abushakir.ConvertToEthiopic(num);
  } catch {
    return num.toString();
  }
}

export function getLiturgicalYearIndex(ethYear: number): number {
  // The 7-Year Aquaquam Shuffle (Sabe’aye Amet)
  const val = (ethYear + 1) % 7;
  return val === 0 ? 7 : val;
}

export function isZemeneTsige(ethMonth: number, ethDay: number): boolean {
  // Meskerem 26 (Month 1, Day 26) to Hidar 6 (Month 3, Day 6)
  if (ethMonth === 1 && ethDay >= 26) return true;
  if (ethMonth === 2) return true;
  if (ethMonth === 3 && ethDay <= 6) return true;
  return false;
}

export function getWazemaAdjustedDate(date: Date): Date {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = date.getHours();
  
  if (day === 6 && hour >= 18) {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    return nextDay;
  }
  return date;
}

export function getDayName(date: Date): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()];
}

export function getGeezDayName(date: Date): string {
    return ETHIOPIAN_DAYS_GEEZ[date.getDay()];
}

// Helper to get Bahire Hasab movable feasts for a given year
export function getMovableFeasts(year: number) {
  const bh = new abushakir.BahireHasab(year);
  return {
    nenewe: bh.getNenewe(),
    fasika: bh.getFasika(),
    // add more if needed
  };
}
