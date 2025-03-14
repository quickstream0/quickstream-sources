import * as unpacker from 'unpacker';
import axios from "axios";
import { Header, Links, Source } from '../types';
import { getRedirectedUrl } from '../redirecturl';
const packedRegex = /(eval\(function\(p,a,c,k,e,d\).*\)\)\))/;
const linkRegex = /src:"(https:\/\/[^"]+)"/;

export async function streamvidExtractor(embedurl: string, clientIP: string, clientTime: string) : Promise<Links | null> {
  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);
  
  try {
    const response = await axios.get(
      embedurl, 
      { 
        headers: {
          "X-Client-Time": clientTime,
          "X-Client-IP": clientIP
        } 
      }
    );
    const data = response.data;
    const packed = data.match(packedRegex);
    if (!packed) throw new Error('streamvid packed not found');

    const unpacked = unpacker.unpack(packed[1]);
    const link = unpacked.match(linkRegex);

    if (!link) throw new Error('streamvid link not found');

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

