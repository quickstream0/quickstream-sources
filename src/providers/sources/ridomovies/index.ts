import { load } from 'cheerio';
import { IframeSourceResult, SearchResult, SearchResultItem } from './types';
import { NotFoundError } from '../../../utils/errors';
import { Embeds, Media } from '../../../utils/types';
import axios from 'axios';
import { processRidomoviesEmbeds } from '../../extractors/extractors';
import { ridoMoviesBase, ridoMoviesApiBase } from './common';

export async function searchByImdbId(imdbId: string): Promise<SearchResultItem | null> {
  try {
    const { data } = await axios.get<SearchResult>(`${ridoMoviesApiBase}/search`, {
      params: { q: imdbId },
    });

    // Extract the items from the response
    const items = data?.data?.items || [];

    // Check if any items match the IMDb ID
    const result = items.find(item => item.contentable.imdbId === imdbId);

    // Return the first match or null if none found
    return result || null;

  } catch (error) {
    console.error(`Failed to fetch data for IMDb ID ${imdbId}:`, error);
    throw new Error('Search failed');
  }
}


export async function getStreams(media: Media) {
  try {
    const targetMedia = await searchByImdbId(media.imdbId);
    if (!targetMedia?.fullSlug) throw new NotFoundError('No watchable item found');

    let iframeSourceUrl = `/${targetMedia.fullSlug}/videos`;

    if (media.type === 'tv') {

      const response = await axios.get(`${ridoMoviesBase}/${targetMedia.fullSlug}`);
      const showPageResult = response.data;

      const fullEpisodeSlug = `season-${media.seasonNumber}/episode-${media.episodeNumber}`;
      const regexPattern = new RegExp(
        `\\\\"id\\\\":\\\\"(\\d+)\\\\"(?=.*?\\\\\\"fullSlug\\\\\\":\\\\\\"[^"]*${fullEpisodeSlug}[^"]*\\\\\\")`,
        'g',
      );
      const matches = [...showPageResult.matchAll(regexPattern)];
      const episodeIds = matches.map((match) => match[1]);
      if (episodeIds.length === 0) throw new NotFoundError('No watchable item found');
      const episodeId = episodeIds.at(-1);
      iframeSourceUrl = `/episodes/${episodeId}/videos`;
    }

    const response = await axios.get<IframeSourceResult>(`${ridoMoviesApiBase}${iframeSourceUrl}`);
    const iframeSource = response.data;
    const iframeSource$ = load(iframeSource.data[0].url);
    
    const iframeUrl = iframeSource$('iframe').attr('data-src');
    if (!iframeUrl) throw new NotFoundError('No watchable item found');
    
    const embeds: Embeds[] = [];
    if (iframeUrl.includes('closeload')) {
      embeds.push({
        embedId: 'closeload',
        url: iframeUrl,
      });
    }
    if (iframeUrl.includes('ridoo')) {
      embeds.push({
        embedId: 'ridoo',
        url: iframeUrl,
      });
    }

    let streams;

    await processRidomoviesEmbeds(embeds)
      .then(result => streams = result)
      .catch(error => console.error("Failed to process embeds:", error));

    return streams;
    
  } catch (error) {
    console.error('Failed to fetch streams:', error);
    throw error;
  }
}

