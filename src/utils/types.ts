export type ResolutionStream = {
    quality: string;
    url: string;
    isM3U8: boolean;
};

export type SubData = {
    lang: string;
    url: string;
};

export type SubFormat = {
    shortCode: string;
    longName: string;
};

export type ChannelEntry = {
    channel_name: string;
    channel_id: string;
};

export type Embeds = {
    url: string;
    embedId: string;
};

export type Media = {
    type: string;
    imdbId: string;
    seasonNumber: number;
    episodeNumber: number;
};

export type MovieMedia = {
    type: string;
    imdbId: string;
};

export type TvMedia = {
    type: string;
    imdbId: string;
    seasonNumber: number;
    episodeNumber: number;
};

// export type MediaSearch = {
//     imdbId: string;
//     tmdbId: string;
//     title: string;
//     fullSlug: string;
//     releaseYear: string;
// };

export const supportedLanguages: SubFormat[] = [
    { shortCode: "ar", longName: "Arabic" },
    { shortCode: "bg", longName: "Bulgarian" },
    { shortCode: "zh", longName: "Chinese" },
    { shortCode: "hr", longName: "Croatian" },
    { shortCode: "rs", longName: "Serbian" },
    { shortCode: "cs", longName: "Czech" },
    { shortCode: "da", longName: "Danish" },
    { shortCode: "nl", longName: "Dutch" },
    { shortCode: "en", longName: "English" },
    { shortCode: "et", longName: "Estonian" },
    { shortCode: "fi", longName: "Finnish" },
    { shortCode: "fr", longName: "French" },
    { shortCode: "de", longName: "German" },
    { shortCode: "el", longName: "Greek" },
    { shortCode: "he", longName: "Hebrew" },
    { shortCode: "hi", longName: "Hindi" },
    { shortCode: "hu", longName: "Hungarian" },
    { shortCode: "id", longName: "Indonesian" },
    { shortCode: "it", longName: "Italian" },
    { shortCode: "ja", longName: "Japanese" },
    { shortCode: "ko", longName: "Korean" },
    { shortCode: "lv", longName: "Latvian" },
    { shortCode: "lt", longName: "Lithuanian" },
    { shortCode: "ms", longName: "Malay" },
    { shortCode: "no", longName: "Norwegian" },
    { shortCode: "pl", longName: "Polish" },
    { shortCode: "pt", longName: "Portuguese" },
    { shortCode: "ro", longName: "Romanian" },
    { shortCode: "ru", longName: "Russian" },
    { shortCode: "sk", longName: "Slovak" },
    { shortCode: "sl", longName: "Slovene" },
    { shortCode: "es", longName: "Spanish" },
    { shortCode: "sv", longName: "Swedish" },
    { shortCode: "th", longName: "Thai" },
    { shortCode: "tr", longName: "Turkish" },
    { shortCode: "uk", longName: "Ukrainian" },
];
