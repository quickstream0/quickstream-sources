import { load } from 'cheerio';
import { NotFoundError } from '../../../utils/errors';
import { primewireApiKey, primewireBase } from './common';
import { getLinks } from './decryption/blowfish';
import axios from 'axios';
import { MovieMedia, TvMedia } from '../../../utils/types';
import { processPrimewireEmbeds } from '../../extractors/extractors';


// vidmoly, dropload [403]
// voe, filelions, streamvid, upstream, streamtape

const defaultPriority = ['streamwish', 'vtube', 'vidmoly', 'streamtape', 'voe', 'filelions', 'dropload', 'streamvid', 'upstream'];
const defaultExclusions = ['vidmoly', 'dropload', 'dood', 'voe', 'filelions', 'streamvid', 'upstream', 'streamtape', 'vtube'];

function rearrangeEmbeds(embeds: { url: string; embedId: string; }[], clientPriority: string[] = [], clientExclusions: string[] = []) {
  // Combine default and client exclusions
  const exclusions = new Set([...defaultExclusions, ...clientExclusions]);

  // Filter out excluded embeds
  const filteredEmbeds = embeds.filter(embed => !exclusions.has(embed.embedId));

  // Sort remaining embeds by client or default priority
  const clientServers = clientPriority.length > 0 ? clientPriority : defaultPriority;
  const sortedEmbeds = filteredEmbeds.sort((a, b) => {
      const aIndex = clientServers.indexOf(a.embedId);
      const bIndex = clientServers.indexOf(b.embedId);
      return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
  });

  return sortedEmbeds;
}

async function getStreams(titlePageHtml: string, clientPriority: string[] = [], clientExclusions: string[] = []) {
  try {
    const $ = load(titlePageHtml);
    const userData = $('#user-data').attr('v');
    if (!userData) throw new NotFoundError('No user data found');

    const links = getLinks(userData);
    const embeds: { url: string; embedId: string; }[] = [];

    if (!links || links.length === 0) throw new NotFoundError('No links found');

    links.forEach((link, index) => {
      const element = $(`.propper-link[link_version='${index}']`);
      const sourceName = element.parent().parent().parent().find('.version-host').text().trim();
      let embedId: string | null = null;

      switch (sourceName) {
        case 'streamwish.to':
          embedId = 'streamwish';
          break;
        case 'streamtape.com':
          embedId = 'streamtape';
          break;
        case 'mixdrop.ag':
          embedId = 'mixdrop';
          break;
        case 'vidmoly.me':
          embedId = 'vidmoly';
          break;
        case 'voe.sx':
          embedId = 'voe';
          break;
        case 'upstream.to':
          embedId = 'upstream';
          break;
        case 'streamvid.net':
          embedId = 'streamvid';
          break;
        case 'dood.watch':
          embedId = 'dood';
          break;
        case 'dropload.io':
          embedId = 'dropload';
          break;
        case 'filelions.to':
          embedId = 'filelions';
          break;
        case 'vtube.to':
          embedId = 'vtube';
          break;
        case 'youtube.com':
          embedId = 'youtube';
          break;
        default:
          embedId = null;
      }

      if (embedId) {
        embeds.push({
          url: `${primewireBase}/links/go/${link}`,
          embedId,
        });
      }
    });

    return rearrangeEmbeds(embeds, clientPriority, clientExclusions);
  } catch (error) {
    console.error('Error: ', error);
    throw error;
  }
}

async function search(imdbId: string) {
  try {
      const { data } = await axios.get(`${primewireBase}/api/v1/show/`, {
          params: { key: primewireApiKey, imdb_id: imdbId },
      });
      return data;
  } catch (error) {
      console.error(`Failed to fetch data for IMDb ID ${imdbId}:`, error);
      throw new Error('Search failed');
  }
}

export async function getMovieLink(media: MovieMedia, clientPriority: string[] = [], clientExclusions: string[] = []) {
  try {
    if (!media.imdbId) throw new Error('No imdbId provided');

    const searchResult = await search(media.imdbId);
    if (!searchResult.id) throw new NotFoundError('Movie not found');

    const { data: moviePageHtml } = await axios.get(`${primewireBase}/movie/${searchResult.id}`);
    const embeds = await getStreams(moviePageHtml, clientPriority, clientExclusions);

    let streams;

    await processPrimewireEmbeds(embeds)
      .then(result => streams = result)
      .catch(error => console.error("Failed to process embeds:", error));

    return streams;

  } catch (error) {
    console.error('Failed to fetch streams: ', error);
    throw error;
  }  
}

export async function getTvLink(media: TvMedia, clientPriority: string[] = [], clientExclusions: string[] = []) {
  try {
    if (!media.imdbId) throw new Error('No imdbId provided');

    const searchResult = await search(media.imdbId);
    if (!searchResult.id) throw new NotFoundError('Show not found');

    const { data: seasonPageHtml } = await axios.get(`${primewireBase}/tv/${searchResult.id}`);
    const seasonPage = load(seasonPageHtml);
    const episodeLink = seasonPage(`.show_season[data-id='${media.seasonNumber}'] > div > a`)
        .toArray()
        .find((link) => link.attribs.href.includes(`-episode-${media.episodeNumber}`))
        ?.attribs.href;

    if (!episodeLink) throw new NotFoundError('No episode links found');

    const { data: episodePageHtml } = await axios.get(`${primewireBase}${episodeLink}`);
    const embeds = await getStreams(episodePageHtml, clientPriority, clientExclusions);

    let streams;

    await processPrimewireEmbeds(embeds)
      .then(result => streams = result)
      .catch(error => console.error("Failed to process embeds:", error));

    return streams;

  } catch (error) {
    console.error('Failed to fetch streams: ', error);
    throw error;
  }
}
