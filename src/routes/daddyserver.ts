import { FastifyInstance } from "fastify";
import { daddyServerUrl } from "../constants/api_constants";

const routes = async (fastify: FastifyInstance) => {
    fastify.get("/", async (_, rp) => {
        
        rp.status(200).send({'server_url': daddyServerUrl});
    });
};

export default routes;
