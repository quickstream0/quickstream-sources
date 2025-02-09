import axios from "axios";
import { load } from "cheerio";
import { Header, Links, Source } from "../types";
import { getRedirectedUrl } from "../redirecturl";

export async function streamtapeExtractor(embedurl: string) : Promise<Links | null> {
  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);

  try {
    const response = await axios.get(url);
    const embed = response.data;
    const match = embed.match(/robotlink'\).innerHTML = (.*)'/);
    if (!match) throw new Error('No match found');

    const [fh, sh] = match?.[1]?.split("+ ('") ?? [];
    if (!fh || !sh) throw new Error('No match found');

    const link = `https:${fh?.replace(/'/g, '').trim()}${sh?.substring(3).trim()}`;

    const sources: Source[] = [
      {
        url: link,
        isM3U8: false,
      },
    ];

    const headers: Header = {
      Referer: "https://streamtape.com/",
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

