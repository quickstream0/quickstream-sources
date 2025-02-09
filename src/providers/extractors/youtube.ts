import { getRedirectedUrl } from "../redirecturl";
import { Header, Links, Source } from "../types";

const youtubeBase = 'https://youtube.com/watch?v=';

export async function youtubeExtractor(embedurl: string) : Promise<Links | null> {
    try{
        let url = embedurl;
        if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);
        if (url.includes('embed')) url = getWatchUrlFromEmbed(url);
    
        const sources: Source[] = [
            {
              url: url,
              isM3U8: false,
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

function getWatchUrlFromEmbed(url: string) {
    const id = url.split('/embed/')[1];
    const watchUrl = `${youtubeBase}${id}`
    return watchUrl;
}