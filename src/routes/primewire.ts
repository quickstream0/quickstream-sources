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

        if (typeof imdbId === "undefined")
            return response
                .status(400)
                .send({ message: "imdb id is required" });

        let clientPriority: string[] | undefined = [];

        if (typeof servers !== "undefined")
            clientPriority = servers.split(',').filter(Boolean);

        const media: MovieMedia = {
            type: "movie",
            imdbId: imdbId,
        };

        const links = await getMovieLink(media, clientPriority);
        if (links) {
            response.status(200).send(links);
        } else {
            response.status(500).send({message: "Unknown error occured. Could not fetch links"});
        }
        // const resp = await axios.get<string>('https://premiumembeding.cloud/v2/embed-4/k3PBOknU8xKp', { headers: { 'Referer': `https://bingewatch.to/` } });
        // console.log(resp);
    });

    fastify.get("/tv", async (request, response) => {
        const imdbId = (request.query as { imdbId: string }).imdbId;
        const season = (request.query as { season: number }).season ?? 1;
        const episode = (request.query as { episode: number }).episode ?? 1;
        const servers = (request.query as { servers: string}).servers;

        if (typeof imdbId === "undefined")
            return response
                .status(400)
                .send({ message: "IMDB id is required" });

        let clientPriority: string[] | undefined = [];

        if (typeof servers !== "undefined")
            clientPriority = servers.split(',').filter(Boolean);

        const media: TvMedia = {
            type: "show",
            imdbId: imdbId,
            seasonNumber: season,
            episodeNumber: episode,
        };

        const links = await getTvLink(media, clientPriority);
        if (links) {
            response.status(200).send(links);
        } else {
            response.status(500).send({message: "Unknown error occured. Could not fetch links"});
        }
    });
};

export default routes;