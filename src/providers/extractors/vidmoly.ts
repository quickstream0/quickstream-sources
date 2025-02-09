import axios from "axios";
import { load } from "cheerio";
import { Header, Links, Source } from "../types";
import { getRedirectedUrl } from "../redirecturl";

export async function vidmolyExtractor(embedurl: string) : Promise<Links | null> {
  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);

  try {
    // Fetch the page content
    const response = await axios.get(url);
    // const response = await axios.get<string>(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } });
    const html = response.data;

    // Load the HTML into Cheerio
    const $ = load(html);

    // Find the script containing 'player.setup' and extract the .m3u8 link
    const scriptContent = $("script")
      .filter((_, script) => $(script).html()?.includes("player.setup") ?? false)
      .html();

    if (!scriptContent) {
      throw new Error("Player setup script not found");
    }

    // Regex to extract the .m3u8 URL from the player setup code
    const m3u8Regex = /file\s*:\s*"(https?:\/\/[^\s]+\.m3u8[^"]*)"/;
    const m3u8Match = scriptContent.match(m3u8Regex);

    const m3u8Url = m3u8Match ? m3u8Match[1] : null;
    if (!m3u8Url) {
      throw new Error("m3u8 URL not found in player setup");
    }

    // Return the m3u8 link
    const sources: Source[] = [
      {
        url: m3u8Url,
        isM3U8: true,
      },
    ];

    const headers: Header = {
      Referer: "",
    };
      
    return {
        sources,
        subtitles: [],
        headers,
    };
    
  } catch (error) {
    console.error("Error extracting link:", error);
    throw error;
  }
}
