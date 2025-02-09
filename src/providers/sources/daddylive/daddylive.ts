import axios from "axios";
import { load } from "cheerio";
import { daddyliveBase } from "../../../constants/api_constants";
import { ChannelEntry } from "../../../utils/types";
import { liveEndpoint } from "./common";

export async function getLiveChannels() : Promise<ChannelEntry[] | null> {
    const channels = await axios.get(`${daddyliveBase}${liveEndpoint}`);
    const $ = load(channels.data);
    const firstGridContainer = $('.grid-container').first();
    const gridItems = firstGridContainer.find('.grid-item').toArray();

    const parsedChannels: ChannelEntry[] = [];
    gridItems.forEach((element) => {
        const isChannelIdValid = extractChannelId($(element).find('a').attr('href')!);
        if (typeof isChannelIdValid !== "boolean" && !$(element).find('strong').text().startsWith("18+")) {
            parsedChannels.push({channel_id: isChannelIdValid, channel_name: $(element).find('strong').text()});
        }
    });
    
    return parsedChannels;
}

function extractChannelId(text: string) : string | boolean {
    const regex = /(\d+)/;
    const match = text.match(regex);

    if (match) {
        return match[0];
    } else {
        return false;
    }
}