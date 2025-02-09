export interface Links {
    sources:   Source[];
    subtitles: Subtitle[];
    headers:  Header;
}

export interface Header {
    Referer:    string;
}

export interface Source {
    url:    string;
    isM3U8: boolean;
}

export interface Subtitle {
    url:  string;
    lang: string;
}