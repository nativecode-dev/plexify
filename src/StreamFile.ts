import { FfprobeStream, FfprobeFormat, FfprobeData } from 'fluent-ffmpeg'

export interface StreamFile {
  audio: FfprobeStream
  data: FfprobeData
  format: FfprobeFormat
  fullpath: string
  video: FfprobeStream
}
