import axios from 'axios';
import { load } from 'cheerio';
import * as unpacker from 'unpacker';
import { Header, Links, Source } from '../types';
import { getRedirectedUrl } from '../redirecturl';

const packedRegex = /(eval\(function\(p,a,c,k,e,d\).*\)\)\))/;
const linkRegex = /sources:\[{file:"(.*?)"/;

export async function upstreamExtractor(embedurl: string) : Promise<Links | null> {
  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);
  
  try {
    const response = await axios.get(url);
    const data = response.data;
    const packed = data.match(packedRegex);

    if (!packed) throw new Error('upstream source not found');

    const unpacked = unpacker.unpack(packed[1]);
    const link = unpacked.match(linkRegex);

    if (!link) throw new Error('upstream source not found');

    const sources: Source[] = [
      {
        url: link[1],
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