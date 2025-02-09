import axios from "axios";
import { NotFoundError } from "../../utils/errors";
import { Header, Links, Source } from "../types";

const referer = 'https://ridomovies.tv/';

export async function ridooExtractor(embedurl:string) : Promise<Links | null> {
  try {
    const response = await axios.get<string>(embedurl, {
      headers: { referer },
    });
    const regexPattern = /file:"([^"]+)"/g;
    const url = regexPattern.exec(response.data)?.[1];
    if (!url) throw new NotFoundError('Unable to find source url');

    const sources: Source[] = [
      {
        url: url,
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

