// import {
//     makeStandardFetcher,
//     makeSimpleProxyFetcher,
//     ShowMedia,
//     MovieMedia,
//     NotFoundError,
//     buildProviders,
//     targets,
// } from "@movie-web/providers";
// import axios, { AxiosError } from "axios";
// import dotenv from "dotenv";
// import { tmdbBaseUrl, tmdbKey } from "../constants/api_constants";
// import { ResolutionStream, SubData, supportedLanguages } from "./types";
// import { FastifyReply } from "fastify";
// import { redis } from "../app";
// import cache from "./cache";
// dotenv.config();
// const proxyUrl = process.env.WORKERS_URL;

// const providers = (useProxy: string, reply: FastifyReply) => {
//     let config = buildProviders()
//         .setTarget(targets.BROWSER_EXTENSION)
//         .setFetcher(makeStandardFetcher(fetch))
//         .addBuiltinProviders();

//     if (useProxy === "true" || typeof useProxy === "undefined") {
//         if (typeof proxyUrl === "undefined" || proxyUrl === "") {
//             reply.status(500).send({
//                 message:
//                     "No proxy (workers) URL found in environment variables use `proxied=false` to fetch without a proxy",
//             });
//         }
//         config.setProxiedFetcher(
//             makeSimpleProxyFetcher(proxyUrl || proxyUrl || "", fetch),
//         );
//     } else if (useProxy !== "false") {
//         reply.status(500).send({
//             message: "Invalid 'proxied' argument",
//         });
//     }
//     return config.build();
// };

// async function fetchM3U8Content(url: string): Promise<string> {
//     try {
//         const response = await axios.get(url);
//         return response.data;
//     } catch (error) {
//         if (axios.isAxiosError(error)) {
//             throw new Error(
//                 `Error fetching M3U8 content: ${(error as AxiosError).message}`,
//             );
//         } else {
//             throw new Error(`Error fetching M3U8 content: ${error}`);
//         }
//     }
// }

// function extractBaseUrl(url: string): string {
//     // Split the URL by '/'
//     const parts = url.split("/");
//     // Join the first few parts (up to the index where we want to extract)
//     const baseUrl = parts.slice(0, 6).join("/");
//     // Add trailing '/' if it's missing
//     return baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
// }

// async function parseM3U8ContentFromUrl(
//     url: string,
//     reply: FastifyReply,
//     provider: string,
// ) {
//     try {
//         const m3u8Content = await fetchM3U8Content(url);
//         const matches: {
//             resolution: string;
//             url: string;
//             isM3U8: boolean;
//         }[] = [];

//         if (provider !== "vidsrcto") {
//             const regex = /RESOLUTION=\d+x(\d+)[\s\S]*?(https:\/\/[^\s]+)/g;

//             let match;

//             while ((match = regex.exec(m3u8Content)) !== null) {
//                 const resolution = match[1];
//                 const url = match[2];
//                 const isM3U8 = true;

//                 matches.push({ resolution, url, isM3U8 });
//             }
//         } else {
//             let vidsrctoBaseUrl = extractBaseUrl(url);

//             const regex =
//                 /^#EXT-X-STREAM-INF:BANDWIDTH=\d+,(RESOLUTION=(\d+)x(\d+))\s*(.*)$/gm;
//             let match;
//             while ((match = regex.exec(m3u8Content)) !== null) {
//                 const resolution = match[3];
//                 const url = vidsrctoBaseUrl + match[4];
//                 const isM3U8 = url.endsWith(".m3u8");
//                 matches.push({ resolution, url, isM3U8 });
//             }
//         }

//         return matches;
//     } catch (error) {
//         reply.status(500).send({
//             message: "Something went wrong. Please try again later.",
//             error: error,
//         });
//     }
// }

// export async function fetchMovieData(id: string): Promise<{
//     title: string;
//     year: number;
// } | null> {
//     const key = `tmdb-movie:${id}`;
//     const fetchData = async () => {
//         const apiUrl = `${tmdbBaseUrl}/3/movie/${id}?language=en-US&api_key=${tmdbKey}`;
//         try {
//             const response = await axios.get(apiUrl);
//             const releaseDate = response.data.release_date;
//             const title = response.data.title;
//             const year: number = parseInt(releaseDate.split("-")[0]);
//             const dataToCache = { title, year };
//             return dataToCache;
//         } catch (error) {
//             throw new Error("Error fetching TMDB data:," + error);
//         }
//     };

//     return redis
//         ? await cache.fetch(redis, key, fetchData, 15 * 24 * 60 * 60)
//         : await fetchData();
// }

// async function fetchTVPrimaryData(
//     id: string,
// ): Promise<{ title: string; year: number; numberOfSeasons: number }> {
//     const key = `tmdb-tv-info:${id}`;
//     const fetchTVData = async () => {
//         try {
//             const apiUrlGeneral = `${tmdbBaseUrl}/3/tv/${id}?language=en-US&api_key=${tmdbKey}`;
//             const resposneGeneral = await axios.get(apiUrlGeneral);
//             const title = resposneGeneral.data.name;
//             const year = parseInt(
//                 resposneGeneral.data.first_air_date.split("-")[0],
//             );
//             const numberOfSeasons = resposneGeneral.data.number_of_seasons;
//             const dataToCache = {
//                 title,
//                 year,
//                 numberOfSeasons,
//             };
//             return dataToCache;
//         } catch (error) {
//             throw new Error("Error fetching TMDB data:," + error);
//         }
//     };

//     return redis
//         ? await cache.fetch(redis, key, fetchTVData, 15 * 24 * 60 * 60)
//         : await fetchTVData();
// }

// export async function fetchTVData(
//     id: string,
//     seasonNum: string,
//     episodeNum: string,
// ): Promise<{
//     title: string;
//     episodeId: number;
//     seasonId: number;
//     year: number;
//     numberOfSeasons: number;
// }> {
//     const key = `tmdb-tv:${id}:${episodeNum}:${seasonNum}`;
//     const fetchData = async () => {
//         try {
//             const apiUrlSeason = `${tmdbBaseUrl}/3/tv/${id}/season/${seasonNum}?language=en-US&api_key=${tmdbKey}`;

//             const response = await axios.get(apiUrlSeason);
//             const resposneGeneral = await fetchTVPrimaryData(id);

//             const episodes = response.data.episodes;
//             const seasonId = response.data.id;
//             const title = resposneGeneral.title;
//             const year = resposneGeneral?.year;
//             const numberOfSeasons = resposneGeneral?.numberOfSeasons;
//             const episodeIndex = parseInt(episodeNum) - 1;

//             if (episodeIndex >= 0 && episodeIndex < episodes.length) {
//                 const { id: episodeId } = episodes[episodeIndex];
//                 const dataToCache = {
//                     title,
//                     episodeId,
//                     seasonId,
//                     year,
//                     numberOfSeasons,
//                 };
//                 return dataToCache;
//             } else {
//                 throw new Error("Invalid episode number");
//             }
//         } catch (error) {
//             throw new Error("Error fetching TMDB data:," + error);
//         }
//     };

//     return redis
//         ? await cache.fetch(redis, key, fetchData, 15 * 24 * 60 * 60)
//         : await fetchData();
// }

// function langConverter(short: string) {
//     for (let i = 0; i < supportedLanguages.length; i++) {
//         if (short === supportedLanguages[i].shortCode) {
//             return supportedLanguages[i].longName;
//         }
//     }

//     return short;
// }

// export async function fetchHlsLinks(
//     proxied: string,
//     reply: FastifyReply,
//     media: ShowMedia | MovieMedia,
//     provider: string,
//     server: string,
// ) {
//     let key = `${provider}`;
//     if (server === "undefined") {
//         server = "-";
//     }
//     media.type === "show"
//         ? (key += `:${server}:show:${media.tmdbId}:${media.season.number}:${media.episode.number}`)
//         : (key += `:${server}:movie:${media.tmdbId}`);

//     const fetchLinks = async () => {
//         let videoSources: ResolutionStream[] = [];
//         let subSources: SubData[] = [];

//         try {
//             const outputEmbed = await providers(
//                 proxied,
//                 reply,
//             ).runSourceScraper({
//                 media: media,
//                 id: provider,
//             });

//             let foundIndex = -1;

//             if (server !== "undefined") {
//                 if (server !== "-") {
//                     for (let i = 0; i < outputEmbed.embeds.length; i++) {
//                         if (outputEmbed.embeds[i].embedId === server) {
//                             foundIndex = i;
//                             break;
//                         }
//                     }
//                 }
//             }

//             const output = await providers(proxied, reply).runEmbedScraper(
//                 foundIndex !== -1
//                     ? {
//                           id: outputEmbed.embeds[foundIndex].embedId,
//                           url: outputEmbed.embeds[foundIndex].url,
//                       }
//                     : {
//                           id: outputEmbed.embeds[0].embedId,
//                           url: outputEmbed.embeds[0].url,
//                       },
//             );

//             if (output?.stream[0].type === "hls") {
//                 for (let i = 0; i < output.stream[0].captions.length; i++) {
//                     subSources.push({
//                         lang: langConverter(
//                             output.stream[0].captions[i].language,
//                         ),
//                         url: output.stream[0].captions[i].url,
//                     });
//                 }
//                 videoSources.push({
//                     quality: "auto",
//                     url: output?.stream[0].playlist,
//                     isM3U8: true,
//                 });

//                 const m3u8Url = output.stream[0].playlist;
//                 await parseM3U8ContentFromUrl(m3u8Url, reply, provider).then(
//                     (v) => {
//                         v?.forEach((r) => {
//                             videoSources.push({
//                                 quality: r.resolution,
//                                 url: r.url,
//                                 isM3U8: r.isM3U8,
//                             });
//                         });
//                     },
//                 );
//             }

//             const dataToCache = {
//                 referrer:
//                     foundIndex !== -1
//                         ? outputEmbed.embeds[foundIndex].url
//                         : outputEmbed.embeds[0].url,
//                 server:
//                     foundIndex !== -1
//                         ? outputEmbed.embeds[foundIndex].embedId
//                         : outputEmbed.embeds[0].embedId,
//                 sources: videoSources,
//                 subtitles: subSources,
//             };

//             return dataToCache;
//         } catch (err) {
//             throw new NotFoundError();
//         }
//     };

//     let res = redis
//         ? await cache.fetch(redis, key, fetchLinks, 15 * 24 * 60 * 60)
//         : await fetchLinks();

//     reply.status(200).send(res);
// }

// export async function fetchDash(
//     proxied: string,
//     reply: FastifyReply,
//     media: ShowMedia | MovieMedia,
//     provider: string,
// ) {
//     let key = `${provider}`;
//     media.type === "show"
//         ? (key += `:show:${media.tmdbId}:${media.season.number}:${media.episode.number}`)
//         : (key += `:movie:${media.tmdbId}`);

//     const fetchLinks = async () => {
//         let videoSources: ResolutionStream[] = [];
//         let subSources: SubData[] = [];

//         try {
//             const outputEmbed = await providers(
//                 proxied,
//                 reply,
//             ).runSourceScraper({
//                 media: media,
//                 id: provider,
//             });

//             const output = await providers(proxied, reply).runEmbedScraper({
//                 id: outputEmbed.embeds[0].embedId,
//                 url: outputEmbed.embeds[0].url,
//             });

//             if (output?.stream[0]?.type === "file") {
//                 if (output.stream[0].qualities["4k"] != undefined) {
//                     videoSources.push({
//                         quality: "4K",
//                         url: output.stream[0].qualities["4k"].url,
//                         isM3U8: false,
//                     });
//                 }
//                 if (output.stream[0].qualities[1080] != undefined) {
//                     videoSources.push({
//                         quality: "1080",
//                         url: output.stream[0].qualities[1080].url,
//                         isM3U8: false,
//                     });
//                 }
//                 if (output.stream[0].qualities[720] != undefined) {
//                     videoSources.push({
//                         quality: "720",
//                         url: output.stream[0].qualities[720].url,
//                         isM3U8: false,
//                     });
//                 }
//                 if (output.stream[0].qualities[480] != undefined) {
//                     videoSources.push({
//                         quality: "480",
//                         url: output.stream[0].qualities[480].url,
//                         isM3U8: false,
//                     });
//                 }
//                 if (output.stream[0].qualities[360] != undefined) {
//                     videoSources.push({
//                         quality: "360",
//                         url: output.stream[0].qualities[360].url,
//                         isM3U8: false,
//                     });
//                 }

//                 for (let i = 0; i < output.stream[0].captions.length; i++) {
//                     subSources.push({
//                         lang: langConverter(
//                             output.stream[0].captions[i].language,
//                         ),
//                         url: output.stream[0].captions[i].url,
//                     });
//                 }
//             }

//             const dataToCache = {
//                 server: outputEmbed.embeds[0].embedId,
//                 sources: videoSources,
//                 subtitles: subSources,
//             };

//             return dataToCache;
//         } catch (err) {
//             throw new NotFoundError();
//         }
//     };

//     let res = redis
//         ? await cache.fetch(redis, key, fetchLinks, 24 * 60 * 60)
//         : await fetchLinks();

//     reply.status(200).send(res);
// }
