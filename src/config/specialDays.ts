export interface SpecialDay {
  name: string;
  message: string;
  hindiMessage?: string;
  month: number; // 0-11 (January = 0)
  date: number; // 1-31
  colors: {
    primary: string; // Left color
    middle: string; // Middle color
    secondary: string; // Right color
    text: string; // Text color
    accent: string; // Accent color for buttons/borders
  };
  emoji: string;
  flowerColors?: string[]; // Colors for falling flowers
}

export const specialDays: SpecialDay[] = [
  // 🇮🇳 National Days
  {
    name: "Republic Day",
    message: "Happy Republic Day",
    hindiMessage: "जय हिन्द!",
    month: 0,
    date: 26,
    colors: {
      primary: "#FF9933",
      middle: "#FFFFFF",
      secondary: "#138808",
      text: "#000080",
      accent: "#000080",
    },
    emoji: "🇮🇳",
    flowerColors: ["#FF9933", "#FFFFFF", "#138808"],
  },
  {
    name: "Independence Day",
    message: "Happy Independence Day",
    hindiMessage: "जय हिन्द!",
    month: 7,
    date: 15,
    colors: {
      primary: "#FF9933",
      middle: "#FFFFFF",
      secondary: "#138808",
      text: "#000080",
      accent: "#000080",
    },
    emoji: "🇮🇳",
    flowerColors: ["#FF9933", "#FFFFFF", "#138808"],
  },
  {
    name: "Gandhi Jayanti",
    message: "Gandhi Jayanti",
    hindiMessage: "बापू को नमन",
    month: 9,
    date: 2,
    colors: {
      primary: "#FF6B35",
      middle: "#F7F7F7",
      secondary: "#4A90E2",
      text: "#2C3E50",
      accent: "#FF6B35",
    },
    emoji: "🕊️",
  },

  // 🎓 Education & Social Impact
  {
    name: "National Youth Day",
    message: "Empowering Youth for a Better Future",
    month: 0,
    date: 12,
    colors: {
      primary: "#1ABC9C",
      middle: "#A3E4D7",
      secondary: "#E8F8F5",
      text: "#0E6251",
      accent: "#1ABC9C",
    },
    emoji: "🚀",
  },
  {
    name: "Teacher's Day",
    message: "Happy Teacher's Day",
    hindiMessage: "शिक्षक दिवस की शुभकामनाएं",
    month: 8,
    date: 5,
    colors: {
      primary: "#3498DB",
      middle: "#AED6F1",
      secondary: "#EBF5FB",
      text: "#1B4F72",
      accent: "#3498DB",
    },
    emoji: "📚",
  },
  {
    name: "Children's Day",
    message: "Every Child Deserves Education",
    hindiMessage: "हर बच्चे को शिक्षा का अधिकार है",
    month: 10,
    date: 14,
    colors: {
      primary: "#FF9F1C",
      middle: "#FFD166",
      secondary: "#FFF3B0",
      text: "#7B3F00",
      accent: "#FF9F1C",
    },
    emoji: "🧒",
  },

  // 🌍 Awareness Days
  {
    name: "National Science Day",
    message: "Celebrate Innovation & Science",
    month: 1,
    date: 28,
    colors: {
      primary: "#2E86C1",
      middle: "#AED6F1",
      secondary: "#EBF5FB",
      text: "#1B4F72",
      accent: "#2E86C1",
    },
    emoji: "🔬",
  },
  {
    name: "World Environment Day",
    message: "Save Environment, Save Future 🌱",
    month: 5,
    date: 5,
    colors: {
      primary: "#27AE60",
      middle: "#ABEBC6",
      secondary: "#EAFAF1",
      text: "#145A32",
      accent: "#27AE60",
    },
    emoji: "🌱",
  },
  {
    name: "International Literacy Day",
    message: "Literacy for All",
    month: 8,
    date: 8,
    colors: {
      primary: "#8E44AD",
      middle: "#D2B4DE",
      secondary: "#F5EEF8",
      text: "#4A235A",
      accent: "#8E44AD",
    },
    emoji: "📖",
  },

  // 🎨 Major Festivals (limited & meaningful)
  {
    name: "Holi",
    message: "Celebrate Joy & Unity",
    hindiMessage: "रंगों का त्योहार मुबारक",
    month: 2,
    date: 3, // 2026
    colors: {
      primary: "#FF1493",
      middle: "#00FF00",
      secondary: "#0000FF",
      text: "#4B0082",
      accent: "#FF1493",
    },
    emoji: "🎨",
  },
  {
    name: "Diwali",
    message: "Light Over Darkness",
    hindiMessage: "दीपावली की शुभकामनाएं",
    month: 10,
    date: 8, // 2026
    colors: {
      primary: "#FFD700",
      middle: "#FFA500",
      secondary: "#FF6347",
      text: "#8B4513",
      accent: "#FFD700",
    },
    emoji: "🪔",
  },
];

/**
 * Get the special day for today, if any
 */
export function getTodaySpecialDay(): SpecialDay | null {
  const today = new Date();
  const month = today.getMonth();
  const date = today.getDate();

  return (
    specialDays.find((day) => day.month === month && day.date === date) || null
  );
}

/**
 * Check if today is a special day
 */
export function isTodaySpecialDay(): boolean {
  return getTodaySpecialDay() !== null;
}
