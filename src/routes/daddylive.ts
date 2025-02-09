import { FastifyInstance } from "fastify";
import { getLiveChannels } from "../providers/sources/daddylive/daddylive";
import { getScheduledEvents } from "../providers/sources/daddylive/events";

const routes = async (fastify: FastifyInstance) => {
    fastify.get("/", async (_, rp) => {
        
        rp.status(200).send({
            intro: "Welcome to the daddylive provider",
            routes: ["/live", "/events"],
        });
    });

    fastify.get("/live", async (_, rp) => {
        const channels = await getLiveChannels();
        if (channels) {
            rp.status(200).send({channels: channels});
        } else {
            rp.status(500).send({message: "Unknown error occured. Could not fetch channels"});
        }
    });

    fastify.get("/events", async (_, rp) => {
        const events = await getScheduledEvents();
        if (events) {
            rp.status(200).send(events);
        } else {
            rp.status(500).send({message: "Unknown error occured. Could not fetch events"});
        }
    });
};

export default routes;
