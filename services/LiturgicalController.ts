import { 
  toEthiopian, 
  getLiturgicalYearIndex, 
  isZemeneTsige, 
  getWazemaAdjustedDate,
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_MONTHS_GEEZ,
  getDayName,
  getGeezDayName
} from '../utils/ethiopianDate';
import { FIXED_FEASTS } from '../data/fixed_feasts';
import { canonicalMonthlyCommemorations } from '../utils/liturgyData';
import { BahireHasab } from 'abushakir';

export interface Ceremony {
  name: string;
  geezName: string;
  folderPath: string;
  dateString: string;
  dayName: string;
  geezDayName: string;
  weekName: string;
  season: string;
  weeklyTheme?: string;
}

export class LiturgicalController {
  
  static getWeeklyTheme(date: Date): string {
      // Find the most recent Sunday
      const sunday = new Date(date);
      const day = sunday.getDay(); // 0 = Sunday
      const diff = sunday.getDate() - day;
      sunday.setDate(diff);
      
      // Get ceremony for that Sunday
      const ceremony = this.getCurrentCeremony(sunday);
      return ceremony.geezName || ceremony.weekName;
  }

  static getCurrentCeremony(date?: Date, yearOffset: number = 0): Ceremony {
    const now = date || new Date();
    
    // 1. The Saturday Flip (Wazema Rule)
    const adjustedDate = getWazemaAdjustedDate(now);
    
    // 2. Convert to Ethiopian Date
    const ethDate = toEthiopian(adjustedDate);
    
    // 3. The 7-Year Aquaquam Shuffle
    const yearIndex = getLiturgicalYearIndex(ethDate.year + yearOffset);
    
    // 4. Determine Season & Week
    let season = "Regular";
    let weekName = "General";
    let geezWeekName = "ጠቅላላ";
    
    // --- CMS HIERARCHY CHECK ---
    let customName = null;
    
    // Primary: Annual Custom (Month/Day)
    try {
        const annualCustom = JSON.parse(localStorage.getItem('custom_annual_commemorations') || '{}');
        const key = `${ethDate.month}-${ethDate.day}`;
        if (annualCustom[key]) customName = annualCustom[key];
    } catch (e) { console.error(e); }

    // Secondary: Monthly Custom (Day 1-30)
    if (!customName) {
        try {
            const monthlyCustom = JSON.parse(localStorage.getItem('monthlyCustom') || '{}');
            if (monthlyCustom[ethDate.day]) customName = monthlyCustom[ethDate.day];
        } catch (e) { console.error(e); }
    }

    if (customName) {
        weekName = customName;
        geezWeekName = customName; // Assuming custom name is entered in desired language
        season = "Custom Commemoration";
    } else {
        // Tertiary: System Defaults
        
        // Priority 1: Annual Exception (Fixed Feasts)
        const fixedKey = `${ethDate.month}-${ethDate.day}`;
        if (FIXED_FEASTS[fixedKey]) {
            weekName = FIXED_FEASTS[fixedKey].name;
            geezWeekName = FIXED_FEASTS[fixedKey].geez;
            season = "Fixed Feast";
        }
        // Priority 2: Zemene Tsige (Specific Season)
        else if (isZemeneTsige(ethDate.month, ethDate.day)) {
            season = "Zemene Tsige";
            weekName = "Mahlete Tsige";
            geezWeekName = "ማህሌተ ጽጌ";
        } 
        else {
            // Priority 3: Movable Feasts (using Abushakir)
            const bh = new BahireHasab(ethDate.year);
            const atswamat = bh.allAtswamat;
            
            // Map Abushakir month names to our 1-based index
            const abushakirMonths = [
                'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሳስ', 'ጥር', 'የካቲት',
                'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'
            ];
            
            const currentMonthName = abushakirMonths[ethDate.month - 1];
            
            // Check if current day is a movable feast
            const movableFeast = atswamat.find(a => a.day.month === currentMonthName && a.day.date === ethDate.day);
            
            if (movableFeast) {
                season = "Movable Feast";
                weekName = movableFeast.beal;
                geezWeekName = movableFeast.beal;
            } else {
                // Priority 4: Monthly Recurring (Default)
                const monthly = canonicalMonthlyCommemorations[ethDate.day];
                if (monthly) {
                    weekName = monthly.english;
                    geezWeekName = monthly.amharic;
                    season = "Monthly Commemoration";
                }
            }
        }
    }

    // 5. Folder Mapping
    const monthName = ETHIOPIAN_MONTHS[ethDate.month - 1];
    const folderPath = `/audio/year_${yearIndex}/${monthName}/day_${ethDate.day}`;

    // 6. Date String
    const dateString = `${ETHIOPIAN_MONTHS_GEEZ[ethDate.month - 1]} ${ethDate.day}, ${ethDate.year}`;
    const dayName = getDayName(adjustedDate);
    const geezDayName = getGeezDayName(adjustedDate);

    return {
      name: `${weekName} - ${season}`,
      geezName: geezWeekName,
      folderPath,
      dateString,
      dayName,
      geezDayName,
      weekName,
      season
    };
  }

  static getCalendarGrid() {
    const now = new Date();
    const ethDate = toEthiopian(now);
    const daysInMonth = ethDate.month === 13 ? (ethDate.year % 4 === 3 ? 6 : 5) : 30;
    
    const grid = [];
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push({
            day: i,
            ceremony: "Daily Prayer",
            isToday: i === ethDate.day
        });
    }
    return {
        month: ETHIOPIAN_MONTHS_GEEZ[ethDate.month - 1],
        year: ethDate.year,
        days: grid
    };
  }
}
