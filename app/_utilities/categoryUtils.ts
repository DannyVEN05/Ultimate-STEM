const EMOJI_MAP: Record<string, string> = {
  hydro: "💧", water: "💧", fluid: "💧",
  bot: "🤖", robot: "🤖", code: "🤖",
  chem: "⚗️",
  phys: "⚡", solar: "⚡", light: "⚡",
  math: "📐",
  geo: "🌍", earth: "🌍",
  bio: "🧬",
};

export function getCategoryEmoji(category: string): string {
  const c = category.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (c.includes(key)) return emoji;
  }
  return "🔬";
}

export function getCategoryBg(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("hydro") || c.includes("water")) return "bg-blue-500";
  if (c.includes("bot") || c.includes("robot") || c.includes("code")) return "bg-orange-500";
  if (c.includes("chem")) return "bg-green-500";
  if (c.includes("phys") || c.includes("solar")) return "bg-yellow-500";
  if (c.includes("math")) return "bg-pink-500";
  if (c.includes("geo")) return "bg-teal-500";
  return "bg-purple-600";
}
