import { FfprobeData } from 'fluent-ffmpeg'

export type DocumentInfo = PouchDB.Core.IdMeta

export interface MediaInfo extends DocumentInfo {
  host: string | null
  locked: boolean
  source: FfprobeData
}
