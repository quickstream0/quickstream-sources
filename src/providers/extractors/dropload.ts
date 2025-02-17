import axios from 'axios';
import { unpack } from 'unpacker';
import { Header, Links, Source, Subtitle } from '../types';
import { getRedirectedUrl } from '../redirecturl';
import { load } from 'cheerio';

const m3u8Regex = /file:"(.*?)"/g;
const tracksRegex = /\{file:"([^"]+)",kind:"thumbnails"\}/g;

export async function droploadExtractor(embedurl: string, clientIP: string, clientTime: string) : Promise<Links | null> {
  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);

  try {
    const response = await axios.get(url);
    // const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } });
    const data = response.data;

    const $ = load(data);

    const packedScript = $("script")
      .filter((_, script) => $(script).html()?.includes("function(p,a,c,k,e,d)") ?? false)
      .html();

    if (!packedScript) {
      throw new Error("Packed script not found");
    }

    const unpackedScript = unpack(packedScript);
    if (!unpackedScript) {
      throw new Error("Failed to unpack JavaScript");
    }

    const m3u8Match = unpackedScript.match(m3u8Regex);
    const m3u8Url = m3u8Match ? m3u8Match[1] : null;

    if (!m3u8Url) {
      throw new Error("m3u8 URL not found");
    }

    const thumbnailTrack = tracksRegex.exec(unpackedScript);

    const sources: Source[] = [
      {
        url: m3u8Url,
        isM3U8: true,
      },
    ];

    let subtitles: Subtitle[] = [];

    if (thumbnailTrack) {
      subtitles = [
        {
          url: url + thumbnailTrack[1],
          lang: 'original',
        },
      ];
    }

    const headers: Header = {
      Referer: "",
    };

    return {
      sources,
      subtitles,
      headers,
    };
  } catch(error) {
    console.error("Error extracting link:", error);
    throw error;
  }
}


// const evalCodeRegex = /eval\((.*)\)/g;
// const fileRegex = /file:"(.*?)"/g;
// const tracksRegex = /\{file:"([^"]+)",kind:"thumbnails"\}/g;

// export async function droploadExtractor(embedurl: string) : Promise<Links | null> {
//   let url = embedurl;
//   if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);

//   try {
//     const response = await axios.get(url);
//     const data = response.data;
//     const evalCode = data.match(evalCodeRegex);
//     if (!evalCode) throw new Error('Failed to find eval code');
//     const unpacked = unpack(evalCode[1]);
  
//     const file = fileRegex.exec(unpacked);
//     const thumbnailTrack = tracksRegex.exec(unpacked);
//     if (!file?.[1]) throw new Error('Failed to find file');

//     const sources: Source[] = [
//       {
//         url: file[1],
//         isM3U8: true,
//       },
//     ];

//     let subtitles: Subtitle[] = [];

//     if (thumbnailTrack) {
//       subtitles = [
//         {
//           url: url + thumbnailTrack[1],
//           lang: 'original',
//         },
//       ];
//     }

//     return {
//       sources,
//       subtitles: [],
//       referer: "",
//     };
//   } catch(error) {
//     console.error("Error extracting link:", error);
//     throw error;
//   }
// }