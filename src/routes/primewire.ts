import { FastifyInstance } from "fastify";
import { getMovieLink, getTvLink } from "../providers/sources/primewire";
import { MovieMedia, TvMedia } from "../utils/types";
import axios from "axios";

const routes = async (fastify: FastifyInstance) => {
    fastify.get("/", async (_, rp) => {
        
        rp.status(200).send({
            intro: "Welcome to the primewire provider",
            routes: ["/movie", "/tv"],
        });
    });

    fastify.get("/movie", async (request, response) => {
        const imdbId = (request.query as { imdbId: string }).imdbId;
        const servers = (request.query as { servers: string}).servers;
        const embed = (request.query as { embed: string}).embed;
        const clientIP = (request.query as { clientIP: string }).clientIP;
        const clientTime = (request.query as { clientTime: string}).clientTime;

        if (typeof imdbId === "undefined")
            return response
                .status(400)
                .send({ "message": "imdb id is required" });

        let clientPriority: string[] | undefined = [];

        if (typeof servers !== "undefined")
            clientPriority = servers.split(',').filter(Boolean);

        const media: MovieMedia = {
            type: "movie",
            imdbId: imdbId,
        };

        var links;

        if (typeof embed !== "undefined" && embed === "true") {
            links = await getMovieLink(media, true, clientIP, clientTime, clientPriority);
        } else {
            links = await getMovieLink(media, false, clientIP, clientTime, clientPriority);
        }
        if (links) {
            response.status(200).send(links);
        } else {
            response.status(500).send({"message": "Unknown error occured. Could not fetch links"});
        }
    });

    fastify.get("/tv", async (request, response) => {
        const imdbId = (request.query as { imdbId: string }).imdbId;
        const season = (request.query as { season: number }).season ?? 1;
        const episode = (request.query as { episode: number }).episode ?? 1;
        const servers = (request.query as { servers: string}).servers;
        const embed = (request.query as { embed: string}).embed;
        const clientIP = (request.query as { clientIP: string }).clientIP;
        const clientTime = (request.query as { clientTime: string}).clientTime;

        if (typeof imdbId === "undefined")
            return response
                .status(400)
                .send({ "message": "IMDB id is required" });

        let clientPriority: string[] | undefined = [];

        if (typeof servers !== "undefined")
            clientPriority = servers.split(',').filter(Boolean);

        const media: TvMedia = {
            type: "show",
            imdbId: imdbId,
            seasonNumber: season,
            episodeNumber: episode,
        };

        var links;

        if (typeof embed !== "undefined" && embed === "true") {
            links = await getTvLink(media, true, clientIP, clientTime, clientPriority);
        } else {
            links = await getTvLink(media, false, clientIP, clientTime, clientPriority);
        }
        if (links) {
            response.status(200).send(links);
        } else {
            response.status(500).send({"message": "Unknown error occured. Could not fetch links"});
        }
    });
};

export default routes;