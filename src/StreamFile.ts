import { FfprobeStream, FfprobeFormat, FfprobeData } from 'fluent-ffmpeg'

export interface StreamFile {
  audio: FfprobeStream
  data: FfprobeData
  format: FfprobeFormat
  filename: string
  video: FfprobeStream
}
