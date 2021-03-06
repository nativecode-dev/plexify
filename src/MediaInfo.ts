import { FfprobeData } from 'fluent-ffmpeg'

export type DocumentInfo = PouchDB.Core.IdMeta

export interface MediaInfo extends DocumentInfo {
  filename: string
  filepath: string
  host: string | null
  locked: boolean
  source: FfprobeData
}
