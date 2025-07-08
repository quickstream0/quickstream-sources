import { load } from "cheerio";
import { Media, MovieMedia, TvMedia } from "../../../utils/types";
import { vidsrcBase, vidsrcRCPBase } from "./common";
import { Embed } from "./base";
import axios from "axios";

function decodeSrc(encoded: string, seed: string) {
    let decoded = '';
    const seedLength = seed.length;

    for (let i = 0; i < encoded.length; i += 2) {
        const byte = parseInt(encoded.substr(i, 2), 16);
        const seedChar = seed.charCodeAt((i / 2) % seedLength);
        decoded += String.fromCharCode(byte ^ seedChar);
    }

    return decoded;
}

async function getVidSrcEmbeds(startingURL: string) {
    // VidSrc works by using hashes and a redirect system.
    // The hashes are stored in the html, and VidSrc will
    // make requests to their servers with the hash. This
    // will trigger a 302 response with a Location header
    // sending the user to the correct embed. To get the
    // real embed links, we must do the same. Slow, but
    // required

    const embeds: { url: string; embedId: string; }[] = [];

    let html = await axios.get(`${vidsrcBase}${startingURL}`, {});

    let $ = load(html.data);

    const sourceHashes = $('.server[data-hash]')
        .toArray()
        .map((el) => $(el).attr('data-hash'))
        .filter((hash) => hash !== undefined);

    for (const hash of sourceHashes) {
        html = await axios.get(`${vidsrcRCPBase}/rcp/${hash}`, {
            headers: {
                referer: vidsrcBase,
            },
        });

        $ = load(html.data);
        console.log(html.data);
        const encoded = $('#hidden').attr('data-h');
        const seed = $('body').attr('data-i');

        if (!encoded || !seed) {
            throw new Error('Failed to find encoded iframe src');
        }

        let redirectURL = decodeSrc(encoded, seed);
        if (redirectURL.startsWith('//')) {
            redirectURL = `https:${redirectURL}`;
        }

        const response = await axios.get(redirectURL, {
            method: 'HEAD',
            headers: {
                referer: vidsrcBase,
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 300 && status < 400,
        });

        const finalUrl = response.headers.location;

        const embed: Embed = {
            embedId: '',
            url: finalUrl,
        };

        const parsedUrl = new URL(finalUrl);

        switch (parsedUrl.host) {
            case 'vidsrc.stream':
                embed.embedId = 'vidsrcembed';
                break;
            case 'streambucket.net':
                embed.embedId = 'streambucket';
                break;
            case '2embed.cc':
            case 'www.2embed.cc':
                // Just ignore this. This embed just sources from other embeds we can scrape as a 'source'
                break;
            case 'player-cdn.com':
                // Just ignore this. This embed streams video over a custom WebSocket connection
                break;
            default:
                throw new Error(`Failed to find VidSrc embed source for ${finalUrl}`);
        }

        // Since some embeds are ignored on purpose, check if a valid one was found
        if (embed.embedId !== '') {
            embeds.push(embed);
        }
    }

    return embeds;
}

export async function getVidSrcMovieSources(media: Media) {
    return getVidSrcEmbeds(`/embed/${media.imdbId}`);
}

export async function getVidSrcShowSources(media: Media) {
    // VidSrc will always default to season 1 episode 1
    // no matter what embed URL is used. It sends back
    // a list of ALL the shows episodes, in order, for
    // all seasons. To get the real embed URL, have to
    // parse this from the response
    const html = await axios.get(`${vidsrcBase}/embed/${media.imdbId}`);

    const $ = load(html.data);

    const episodeElement = $(`.ep[data-s="${media.seasonNumber}"][data-e="${media.episodeNumber}"]`).first();
    if (episodeElement.length === 0) {
        throw new Error('failed to find episode element');
    }

    const startingURL = episodeElement.attr('data-iframe');
    if (!startingURL) {
        throw new Error('failed to find episode starting URL');
    }

    return getVidSrcEmbeds(startingURL);
}
