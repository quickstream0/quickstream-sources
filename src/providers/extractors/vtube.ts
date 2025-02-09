import axios from 'axios';
import { load } from 'cheerio';
import { unpack } from 'unpacker';
import { Header, Links, Source } from '../types';
import { getRedirectedUrl } from '../redirecturl';

const evalCodeRegex = /eval\((.*)\)/g;
const fileRegex = /file:"(.*?)"/g;
const tracksRegex = /\{file:"([^"]+)",kind:"thumbnails"\}/g;

export async function vtubeExtractor(embedurl: string) : Promise<Links | null> {
  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);

  try {
    const response = await axios.get(url);
    const $ = load(response.data);
    const evalCode = $('script').text().match(evalCodeRegex);
    if (!evalCode) throw new Error('Failed to find eval code');
    const unpacked = unpack(evalCode?.toString());
    const file = fileRegex.exec(unpacked);
    // const thumbnailTrack = tracksRegex.exec(unpacked);
    if (!file?.[1]) throw new Error('Failed to find file');

    const sources: Source[] = [
      {
        url: file[1],
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
