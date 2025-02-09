import axios from 'axios';
import { getRedirectedUrl } from '../redirecturl';
import { Header, Links, Source, Subtitle } from '../types';

const baseUrl = 'https://dood.re';
const tokenRegex = /\?token=([^&]+)&expiry=/;
const pathRegex = /\$\.get\('\/pass_md5([^']+)/;
const thumbnailRegex = /thumbnails:\s\{\s*vtt:\s'([^']*)'/;

export async function doodExtractor(embedurl: string) : Promise<Links | null> {
  let url = embedurl;
  if (embedurl.includes('primewire')) url = await getRedirectedUrl(embedurl);
  
  try {
    const id = url.split('/d/')[1] || url.split('/e/')[1];
    const finalEmbedUrl = `${baseUrl}/e/${id}`;
    const dood = await axios.get(finalEmbedUrl);
    const doodData = dood.data;
    const token = doodData.match(tokenRegex)?.[1];
    const path = doodData.match(pathRegex)?.[1];
    const thumbnailTrack = doodData.match(thumbnailRegex);
  
    const doodPage = await axios.get(
      `${baseUrl}/pass_md5${path}`, {
        headers: {
          Referer: finalEmbedUrl,
        }
      }
    );

    // Eight hours in milliseconds
    const expInTime = 8 * 60 * 60 * 1000;
    const expiry = Date.now() + expInTime;
  
    const downloadURL = `${doodPage}${generateRandomToken()}?token=${token}&expiry=${expiry}`;
  
    if (!downloadURL.startsWith('http')) throw new Error('Invalid URL');

    const sources: Source[] = [
      {
        url: downloadURL,
        isM3U8: false,
      },
    ];
    let subURL = "";
    thumbnailTrack ? subURL = `https:${thumbnailTrack[1]}` : "";
  
    const subtitles: Subtitle[] = [
      {
        url: subURL,
        lang: "original",
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

  } catch(error) {
    console.error("Error extracting link:", error);
    throw error;
  }
}

function generateRandomToken(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 10 
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters[randomIndex];
  }
  
  return result;
}
