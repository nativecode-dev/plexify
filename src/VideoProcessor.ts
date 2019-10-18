import mediainfo from 'node-mediainfo'

import { VideoCollection } from './VideoCollection'

export class VideoProcessor {
  constructor(private readonly videos: VideoCollection) {}

  convertible(filename: string): Promise<boolean> {
    return Promise.reject()
  }

  async convert(filename: string, owner: string): Promise<boolean> {
    const locked = await this.videos.lock(filename, owner)

    if (locked === false) {
      return Promise.reject(`could not lock ${filename}`)
    }

    // TODO: Perform the conversion.
    const info = await mediainfo(filename)
    console.log(info)

    const unlocked = await this.videos.unlock(filename)

    if (unlocked === false) {
      return Promise.reject(`could not unlock ${filename}`)
    }

    return Promise.resolve(locked && unlocked)
  }
}
