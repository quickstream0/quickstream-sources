import axios from "axios";
import { daddyliveBase } from "../../../constants/api_constants";
import { eventsEndpoint } from "./common";

export async function getScheduledEvents() {
    const events = await axios.get(`${daddyliveBase}${eventsEndpoint}`);
    return events.data;
}