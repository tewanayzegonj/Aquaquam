import { CategoryData, PerformanceType, LiturgicalCategory, Track, DayData } from './types';

export const DEFAULT_CATEGORIES = [
  "ክብረ በዓል",
  "ማህሌተ ጽጌ",
  "ወርኃ በዓል",
  "መወድስ",
  "ምቅናይ",
  "አርባዕት",
  "ሰላም ዘኪዳን",
  "መርገፍ"
];

// Helper to generate a dummy track
const createTrack = (
  idSuffix: string, 
  title: string, 
  category: LiturgicalCategory, 
  perfs: PerformanceType[] = [PerformanceType.Zema, PerformanceType.Zimame]
): Track => ({
  id: `trk_${idSuffix}`,
  title,
  category,
  audio_url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`, // Mock URL
  available_performances: perfs,
  merigeta_metadata: {
    notes: category === LiturgicalCategory.Mltan ? "Attention needed for performance." : "Standard performance notes apply.",
    regional_school: "Gonder",
    tempo: "Moderate",
    author: "Saint Yared"
  }
});

const generateDay = (dayNum: number, name: string): DayData => {
  return {
      dayNumber: dayNum,
      name: name,
      isMajorChristFeast: dayNum % 5 === 0,
      wazemaTracks: [
          createTrack(`${dayNum}_w_1`, "Wazema Zema", LiturgicalCategory.Wazema),
          createTrack(`${dayNum}_w_2`, "Mahtew Zema", LiturgicalCategory.Mahtew),
          createTrack(`${dayNum}_w_3`, "Yitbarek Zema", LiturgicalCategory.Yitbarek),
          createTrack(`${dayNum}_w_4`, "Qine Zema", LiturgicalCategory.Qine),
          createTrack(`${dayNum}_w_5`, "Selam Zema", LiturgicalCategory.Selam),
      ],
      mahletTracks: [
           createTrack(`${dayNum}_m_1`, "Sebuh Zema", LiturgicalCategory.Sebuh),
           createTrack(`${dayNum}_m_2`, "Melk Zema", LiturgicalCategory.Melk),
           createTrack(`${dayNum}_m_3`, "Wereb Zema", LiturgicalCategory.Wereb, [PerformanceType.Wereb, PerformanceType.Zema]),
           createTrack(`${dayNum}_m_4`, "Ziq Zema", LiturgicalCategory.Ziq),
           createTrack(`${dayNum}_m_5`, "Mltan Zema", LiturgicalCategory.Mltan),
           createTrack(`${dayNum}_m_6`, "Abun Zema", LiturgicalCategory.Abun),
           createTrack(`${dayNum}_m_7`, "Ezl Zema", LiturgicalCategory.Ezl),
           createTrack(`${dayNum}_m_8`, "Selam Zema", LiturgicalCategory.Selam),
      ]
  }
}

export const MOCK_DB: CategoryData[] = DEFAULT_CATEGORIES.map(cat => ({
  name: cat,
  days: Array.from({length: 5}, (_, i) => generateDay(i + 1, `Day ${i + 1} of ${cat}`))
}));