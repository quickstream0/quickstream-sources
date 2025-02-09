import axios from "axios";
import { load } from "cheerio";
import { unpack } from "unpacker";
import { Header, Links, Source } from "../types";
import { getRedirectedUrl } from "../redirecturl";

const m3u8Regex = /(http.*?\.m3u8\?[^'"]+)/;

export async function streamwishExtractor(embedurl: string) : Promise<Links | null> {
    let url = embedurl;
    if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);

    try {
        const response = await axios.get(url);
        const $ = load(response.data);

        // Find the packed script with function(p,a,c,k,e,d)
        const packedScript = $("script")
        .filter((_, script) => $(script).html()?.includes("function(p,a,c,k,e,d)") ?? false)
        .html();

        if (!packedScript) {
        throw new Error("Packed script not found");
        }

        // Unpack the JavaScript code
        const unpackedScript = unpack(packedScript);
        if (!unpackedScript) {
            throw new Error("Failed to unpack JavaScript");
        }

        // Extract the m3u8 URL using regex
        const m3u8Match = unpackedScript.match(m3u8Regex);
        const m3u8Url = m3u8Match ? m3u8Match[1] : null;

        if (!m3u8Url) {
        throw new Error("m3u8 URL not found");
        }

        const sources: Source[] = [
            {
                url: m3u8Url,
                isM3U8: true,
            },
        ];
        
        const headers: Header = {
            Referer: 'https://cdnplaypro.com/',
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