import ffmpeg, { FfprobeData } from 'fluent-ffmpeg'

export function getMediaInfo(filename: string): Promise<FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(filename)
      .ffprobe((error, data) => {
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      })
  })
}
