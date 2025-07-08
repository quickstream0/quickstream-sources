import { FastifyInstance } from "fastify";
import { Media } from "../utils/types";
import { getVidSrcMovieSources, getVidSrcShowSources } from "../providers/sources/vidsrc";

const routes = async (fastify: FastifyInstance) => {
    fastify.get("/", async (_, rp) => {
        
        rp.status(200).send({
            intro: "Welcome to the vidsrc provider",
            routes: ["/movie", "/tv"],
        });
    });

    fastify.get("/movie", async (request, response) => {
        const imdbId = (request.query as { imdbId: string }).imdbId;
        console.log(imdbId);

        if (typeof imdbId === "undefined")
            return response
                .status(400)
                .send({ "message": "imdb id is required" });

        const media: Media = {
            type: "movie",
            imdbId: imdbId,
            seasonNumber: 1,
            episodeNumber: 1
        };

        const links = await getVidSrcMovieSources(media);
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

        if (typeof imdbId === "undefined")
            return response
                .status(400)
                .send({ "message": "IMDB id is required" });

        const media: Media = {
            type: "tv",
            imdbId: imdbId,
            seasonNumber: season,
            episodeNumber: episode,
        };
        const links = await getVidSrcShowSources(media);
        if (links) {
            response.status(200).send(links);
        } else {
            response.status(500).send({"message": "Unknown error occured. Could not fetch links"});
        }
    });
};

export default routes;