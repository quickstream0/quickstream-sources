import { Embeds } from '../../utils/types';
import { streamwishExtractor } from './streamwish';
import { streamtapeExtractor } from './streamtape';
import { voeExtractor } from './voe';
import { vidmolyExtractor } from './vidmoly';
import { upstreamExtractor } from './upstream';
import { streamvidExtractor } from './streamvid';
import { doodExtractor } from './dood';
import { droploadExtractor } from './dropload';
import { filelionsExtractor } from './filelions';
import { vtubeExtractor } from './vtube';
import { mixdropExtractor } from './mixdrop';
import { youtubeExtractor } from './youtube';
import { closeloadExtractor } from './closeload';
import { ridooExtractor } from './ridoo';

export async function processPrimewireEmbeds(embeds: Embeds[], clientIP: string, clientTime: string) {
    for (const embed of embeds) {
      const { url, embedId } = embed;
      
      try {
        let result;
  
        switch (embedId) {
          case 'streamtape':
            result = await streamtapeExtractor(url, clientIP, clientTime);
            break;
          case 'voe':
            result = await voeExtractor(url, clientIP, clientTime);
            break;
          case 'streamwish':
            result = await streamwishExtractor(url, clientIP, clientTime);
            break;
          case 'vidmoly':
            result = await vidmolyExtractor(url, clientIP, clientTime);
            break;
          case 'upstream':
            result = await upstreamExtractor(url, clientIP, clientTime);
            break;
          case 'streamvid':
            result = await streamvidExtractor(url, clientIP, clientTime);
            break;
          case 'dood':
            result = await doodExtractor(url, clientIP, clientTime);
            break;
          case 'dropload':
            result = await droploadExtractor(url, clientIP, clientTime);
            break;
          case 'filelions':
            result = await filelionsExtractor(url, clientIP, clientTime);
            break;
          case 'vtube':
            result = await vtubeExtractor(url, clientIP, clientTime);
            break;
          case 'mixdrop':
            result = await mixdropExtractor(url, clientIP, clientTime);
            break;
          case 'youtube':
            result = await youtubeExtractor(url);
            break;
          default:
            console.log(`No function available for embedId: ${embedId}`);
            continue;
        }

        console.log(`EMBED ID ${embedId} : RESULT ${result}`);
        
        // If result is successful, break the loop and return the result
        if (result) {
          return result;
        }
      } catch (error) {
        console.error("Error extractig links: ", error);
        // If an error occurs, continue to the next embed
        continue;
      }
    }
    
    throw new Error("Error extractig links");
}

export async function processRidomoviesEmbeds(embeds: Embeds[]) {
    for (const embed of embeds) {
      const { url, embedId } = embed;
      
      try {
        let result;
  
        switch (embedId) {
          case 'closeload':
            result = await closeloadExtractor(url);
            break;
          case 'ridoo':
            result = await ridooExtractor(url);
            break;
          default:
            console.log(`No function available for embedId: ${embedId}`);
            continue;
        }
        
        if (result) {
          return result;
        }
      } catch (error) {
        console.error("Error extractig links: ", error);
        continue;
      }
    }
    
    throw new Error("Error extractig links");
}
