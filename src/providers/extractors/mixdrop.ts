import * as unpacker from 'unpacker';
import { getRedirectedUrl } from '../redirecturl';
import axios from 'axios';
import { Header, Links, Source } from '../types';

const mixdropBase = 'https://mixdrop.ps';
const packedRegex = /(eval\(function\(p,a,c,k,e,d\){.*{}\)\))/;
const linkRegex = /MDCore\.wurl="(.*?)";/;

export async function mixdropExtractor(embedurl: string) : Promise<Links | null> {
  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);
  
  try {
    const id = url.split('/e/')[1];
    const response = await axios.get(`${mixdropBase}/e/${id}`);
    const data = response.data;
    const packed = data.match(packedRegex);
    if (!packed) {
      throw new Error('failed to find packed mixdrop JavaScript');
    }

    const unpacked = unpacker.unpack(packed[1]);
    const link = unpacked.match(linkRegex);

    if (!link) {
      throw new Error('failed to find packed mixdrop source link');
    }

    const linkurl = link[1];

    const sources: Source[] = [
      {
        url: linkurl.startsWith('http') ? linkurl : `https:${linkurl}`,
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
