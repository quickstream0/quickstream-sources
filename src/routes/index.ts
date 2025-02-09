import { FastifyInstance } from "fastify";

import movies_tv from "./index";
const routes = async (fastify: FastifyInstance) => {
    await fastify.register(movies_tv, { prefix: "/movies-tv" });
    fastify.get("/", async (reply: any) => {
        reply.status(200).send("Welcome to QuickStream api");
    });
};

export default routes;
