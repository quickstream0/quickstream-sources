import dotenv from "dotenv";
dotenv.config();

if (!process.env.DADDYLIVE_URL) {
    throw new Error("URL environment variable is missing.");
}

export const daddyliveBase = process.env.DADDYLIVE_URL || '';
export const daddyServerUrl = process.env.SERVER_URL || '';