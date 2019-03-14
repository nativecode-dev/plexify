declare module 'mediainfo-parser' {
  type ParserMediaInfo = (error: Error, info: any | null) => void
  function mediainfo(source: string, callback: ParserMediaInfo): void

  export = mediainfo
}
