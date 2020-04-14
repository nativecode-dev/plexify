import { FfprobeStream, FfprobeFormat } from 'fluent-ffmpeg'

export interface StreamFile {
  audio: FfprobeStream
  format: FfprobeFormat
  filename: string
  video: FfprobeStream
}
