import { fs } from '@nofrills/fs'

import JsonMediaInfo from 'json-mediainfo'

import { VideoCollection } from './VideoCollection'
import { Handbrake } from './Handbrake/Handbrake'

export class VideoProcessor {
  constructor(private readonly videos: VideoCollection, private readonly handbrake: Handbrake) {}

  async convertible(filename: string): Promise<boolean> {
    const info = await JsonMediaInfo(filename)
    console.log(info)
    return Promise.reject()
  }

  async convert(filename: string, owner: string, rename: boolean): Promise<boolean> {
    const locked = await this.videos.lock(filename, owner)

    if (locked === false) {
      return Promise.reject(`could not lock ${filename}`)
    }

    try {
      const target = `${filename}.processing`
      const results = await this.handbrake.encode(filename, target)

      if (results.success && rename) {
        const renamed = `${filename}.renamed`
        // Rename original file to temp file.
        await fs.rename(filename, renamed)
        // Rename processing file to original file.
        await fs.rename(target, filename)
        // Delete renamed file (original).
        await fs.delete(renamed)
      }
    } finally {
      const unlocked = await this.videos.unlock(filename)

      if (unlocked === false) {
        return Promise.reject(`could not unlock ${filename}`)
      }

      return Promise.resolve(locked && unlocked)
    }
  }
}
