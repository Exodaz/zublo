/**
 * Popular subscription services offered as presets in the subscription form.
 * `domain` drives the Brandfetch logo; `url` pre-fills the subscription link.
 */
export interface ServicePreset {
  name: string;
  domain: string;
  url: string;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  // Video
  { name: "Netflix", domain: "netflix.com", url: "https://www.netflix.com" },
  { name: "YouTube Premium", domain: "youtube.com", url: "https://www.youtube.com/premium" },
  { name: "Prime Video", domain: "primevideo.com", url: "https://www.primevideo.com" },
  { name: "HBO Max", domain: "hbomax.com", url: "https://www.hbomax.com" },
  { name: "Disney+", domain: "disneyplus.com", url: "https://www.disneyplus.com" },
  { name: "Apple TV+", domain: "tv.apple.com", url: "https://tv.apple.com" },
  { name: "Paramount+", domain: "paramountplus.com", url: "https://www.paramountplus.com" },
  { name: "Viu", domain: "viu.com", url: "https://www.viu.com" },
  { name: "iQIYI", domain: "iq.com", url: "https://www.iq.com" },
  { name: "WeTV", domain: "wetv.vip", url: "https://wetv.vip" },
  { name: "TrueID", domain: "trueid.net", url: "https://www.trueid.net" },
  { name: "Crunchyroll", domain: "crunchyroll.com", url: "https://www.crunchyroll.com" },
  { name: "Twitch", domain: "twitch.tv", url: "https://www.twitch.tv" },
  // Music
  { name: "Spotify", domain: "spotify.com", url: "https://www.spotify.com" },
  { name: "Apple Music", domain: "music.apple.com", url: "https://music.apple.com" },
  { name: "YouTube Music", domain: "music.youtube.com", url: "https://music.youtube.com" },
  { name: "JOOX", domain: "joox.com", url: "https://www.joox.com" },
  { name: "Tidal", domain: "tidal.com", url: "https://tidal.com" },
  { name: "Deezer", domain: "deezer.com", url: "https://www.deezer.com" },
  // Productivity & cloud
  { name: "Microsoft 365", domain: "microsoft.com", url: "https://www.microsoft365.com" },
  { name: "Google One", domain: "one.google.com", url: "https://one.google.com" },
  { name: "Google Workspace", domain: "workspace.google.com", url: "https://workspace.google.com" },
  { name: "iCloud+", domain: "icloud.com", url: "https://www.icloud.com" },
  { name: "Apple One", domain: "apple.com", url: "https://www.apple.com/apple-one" },
  { name: "Dropbox", domain: "dropbox.com", url: "https://www.dropbox.com" },
  { name: "Notion", domain: "notion.so", url: "https://www.notion.so" },
  { name: "Canva", domain: "canva.com", url: "https://www.canva.com" },
  { name: "Adobe Creative Cloud", domain: "adobe.com", url: "https://www.adobe.com/creativecloud.html" },
  { name: "Figma", domain: "figma.com", url: "https://www.figma.com" },
  { name: "Zoom", domain: "zoom.us", url: "https://zoom.us" },
  { name: "Slack", domain: "slack.com", url: "https://slack.com" },
  { name: "Grammarly", domain: "grammarly.com", url: "https://www.grammarly.com" },
  { name: "1Password", domain: "1password.com", url: "https://1password.com" },
  { name: "NordVPN", domain: "nordvpn.com", url: "https://nordvpn.com" },
  { name: "Duolingo", domain: "duolingo.com", url: "https://www.duolingo.com" },
  // AI & developer
  { name: "ChatGPT Plus", domain: "chatgpt.com", url: "https://chatgpt.com" },
  { name: "Claude", domain: "claude.ai", url: "https://claude.ai" },
  { name: "Google Gemini", domain: "gemini.google.com", url: "https://gemini.google.com" },
  { name: "Perplexity", domain: "perplexity.ai", url: "https://www.perplexity.ai" },
  { name: "Midjourney", domain: "midjourney.com", url: "https://www.midjourney.com" },
  { name: "GitHub", domain: "github.com", url: "https://github.com" },
  { name: "Cursor", domain: "cursor.com", url: "https://cursor.com" },
  // Gaming & social
  { name: "Xbox Game Pass", domain: "xbox.com", url: "https://www.xbox.com/xbox-game-pass" },
  { name: "PlayStation Plus", domain: "playstation.com", url: "https://www.playstation.com/ps-plus" },
  { name: "Nintendo Switch Online", domain: "nintendo.com", url: "https://www.nintendo.com/switch/online" },
  { name: "Discord Nitro", domain: "discord.com", url: "https://discord.com/nitro" },
  { name: "LINE", domain: "line.me", url: "https://line.me" },
  { name: "X Premium", domain: "x.com", url: "https://x.com" },
];

/** Case-insensitive match on name or domain; the whole catalog for an empty query. */
export function searchServicePresets(query: string): ServicePreset[] {
  const q = query.trim().toLowerCase();
  if (!q) return SERVICE_PRESETS;
  return SERVICE_PRESETS.filter(
    (preset) => preset.name.toLowerCase().includes(q) || preset.domain.includes(q),
  );
}
