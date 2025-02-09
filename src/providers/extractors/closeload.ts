import { load } from 'cheerio';
import { unpack } from 'unpacker';
import axios from 'axios';
import { NotFoundError } from '../../utils/errors';
import { Caption, getCaptionTypeFromUrl, labelToLanguageCode } from '../captions';
import { Header, Links, Source, Subtitle } from '../types';
import { ridoMoviesBase } from '../sources/ridomovies/common';

const baseUrl = 'https://closeload.top';

export async function closeloadExtractor(embedurl: string) : Promise<Links | null> {
  try {
    // const baseUrl = new URL(embedurl).origin;
    const response = await axios.get<string>(embedurl, { headers: { 'Referer': `${ridoMoviesBase}/` } });
    const iframeRes = response.data;
    const $ = load(iframeRes);

    // Extract subtitles
    const subtitles: Subtitle[] = $('track')
      .map((_, el) => {
        const track = $(el);
        const url = `${baseUrl}${track.attr('src')}`;
        const label = track.attr('label') ?? 'Unknown';
        const language = labelToLanguageCode(label);

        if (!language) return null;
        return {
          url,
          lang: label,
        };
      })
      .get()
      .filter((subtitle): subtitle is Subtitle => subtitle !== null);

    const packed = $("script")
      .filter((_, script) => $(script).html()?.includes("function(p,a,c,k,e,d)") ?? false)
      .html();
    
    if (!packed) throw new Error("Couldn't find packed script");

    const unpacked = unpack(packed);
    const regexPattern = /var\s+(\w+)\s*=\s*"([^"]+)";/g;
    const base64EncodedUrl = regexPattern.exec(unpacked)?.[2];

    if (!base64EncodedUrl) throw new NotFoundError('Unable to find source URL');
    
    const url = atob(base64EncodedUrl);

    // Populate sources
    const sources: Source[] = [
      {
        url,
        isM3U8: true,
      },
    ];

    const headers: Header = {
      Referer: `${baseUrl}/`,
    };
    

    return {
      sources,
      subtitles,
      headers,
    };
  } catch (error) {
    console.error("Error extracting link:", error);
    throw error;
  }
}
