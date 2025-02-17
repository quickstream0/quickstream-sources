import axios from "axios";
import { load } from "cheerio";
import { Header, Links, Source } from "../types";
import { getRedirectedUrl, getFinalRedirectedUrl } from "../redirecturl";

export async function voeExtractor(embedurl: string, clientIP: string, clientTime: string) : Promise<Links | null> {

  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);
  // redirecting for second time
  url = await getFinalRedirectedUrl(url);
  
  try {
    // Fetch the page content from the provided URL
    const response = await axios.get(
      url, 
      { 
        headers: {
          "X-Client-Time": clientTime,
          "X-Client-IP": clientIP
        } 
      }
    );

    // Load the HTML into Cheerio to easily traverse the DOM
    const $ = load(response.data);

    // Extract the base64 encoded URL from the "sources" object in the script
    const scriptContent = $('script:contains("sources")').html();
    
    if (!scriptContent) {
      throw new Error('Could not find the sources object in the script.');
    }

    // Extract the base64 HLS URL from the script content
    const base64HlsUrlMatch = scriptContent.match(/'hls':\s*'([^']+)'/);

    if (!base64HlsUrlMatch || !base64HlsUrlMatch[1]) {
      throw new Error('Stream URL not found in embed code');
    }

    // Decode the base64 encoded HLS URL
    const streamUrl = atob(base64HlsUrlMatch[1]);

    const sources: Source[] = [
      {
        url: streamUrl,
        isM3U8: true,
      },
    ];

    const headers: Header = {
      Referer: "https://voe.sx/",
    };
    
    return {
      sources,
      subtitles: [],
      headers,
    };

  } catch (error) {
    console.error(`[Voe]> Error fetching stream from ${embedurl}:`, error);
    throw error;
  }
}
