import Fastify from "fastify";
// import chalk from "chalk";
import FastifyCors from "@fastify/cors";
import dotenv from "dotenv";
import daddylive from "./routes/daddylive";
import primewire from "./routes/primewire";
import ridomovies from "./routes/ridomovies";
import vidsrc from "./routes/vidsrc";
import daddyserver from "./routes/daddyserver";

dotenv.config();

async function startServer() {
    const PORT = Number(process.env.PORT) || 3000;
    // console.log(chalk.green(`Starting server on port ${PORT}... 🚀`));

    const fastify = Fastify({
        maxParamLength: 1000,
        logger: true,
    });
    await fastify.register(FastifyCors, {
        origin: "*",
        methods: "GET",
    });

    await fastify.register(daddylive, { prefix: "/daddylive" });
    await fastify.register(primewire, { prefix: "/primewire" });
    await fastify.register(ridomovies, { prefix: "/ridomovies" });
    await fastify.register(vidsrc, { prefix: "/vidsrc" });
    await fastify.register(daddyserver, { prefix: "/server-url" });

    try {
        fastify.get("/", async (_, rp) => {
            rp.status(200).send("Welcome to QuickStream API! 🎉");
        });
        fastify.get("*", (_, reply) => {
            reply.status(404).send({
                message: "",
                error: "page not found",
            });
        });

        fastify.listen({ port: PORT, host: "0.0.0.0" }, (e, address) => {
            if (e) throw e;
            console.log(`server listening on ${address}`);
        });
    } catch (err: any) {
        fastify.log.error(err);
        process.exit(1);
    }
}
export default startServer;
