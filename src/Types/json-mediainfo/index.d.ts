declare type JsonMediaInfo = (error: Error, info: any) => void
declare function json_mediainfo(source: string, callback: JsonMediaInfo): void

declare module 'json-mediainfo' {
  export = json_mediainfo
}
