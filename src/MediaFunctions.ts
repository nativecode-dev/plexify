import ffmpeg, { Codecs, Encoders, Filters, Formats, FfprobeData } from 'fluent-ffmpeg'

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

export function getAvailableCodecs(): Promise<Codecs> {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableCodecs((error, codecs) => {
      if (error) {
        reject(error)
      } else {
        resolve(codecs)
      }
    })
  })
}

export function getAvailableEncoders(): Promise<Encoders> {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableEncoders((error, encoders) => {
      if (error) {
        reject(error)
      } else {
        resolve(encoders)
      }
    })
  })
}

export function getAvailableFilters(): Promise<Filters> {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFilters((error, filters) => {
      if (error) {
        reject(error)
      } else {
        resolve(filters)
      }
    })
  })
}

export function getAvailableFormats(): Promise<Formats> {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats((error, formats) => {
      if (error) {
        reject(error)
      } else {
        resolve(formats)
      }
    })
  })
}
