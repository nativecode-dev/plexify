import mediainfo from 'json-mediainfo'

export interface MediaInfoGeneral {
  path: string
  size: number
  bitrate: number
  duration: number
  created: string
  modified: string
  encoded: string
  tagged: string
  menu: boolean
}

export interface MediaInfoAudio {
  ch: number
  ch_post: string
  sample_rate: string
  code: string
  bitrate: string
  bitrate_mode: string
  lang: string
}

export interface MediaInfoVideo {
  width: number
  height: number
  code: string
  fps: number
  bitrate: number
  profile: string
  settings: string
  aspect: string
}

export interface MediaInfo {
  general: MediaInfoGeneral
  audio: MediaInfoAudio[]
  video: MediaInfoVideo[]
  Subs: string[]
}

export default function(filepath: string): Promise<MediaInfo> {
  return new Promise((resolve, reject) => {
    mediainfo(filepath, (error: Error, info: any) => {
      if (error) {
        reject(error)
      } else {
        resolve(info)
      }
    })
  })
}
