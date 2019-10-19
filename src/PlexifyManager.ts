import watch from 'node-watch'
import mediainfo from 'node-mediainfo'

import { fs } from '@nofrills/fs'
import { all as throttle } from 'promise-parallel-throttle'

import Logger from './Logger'

import { Result, VideoStates } from './Result'
import { Handbrake } from './Handbrake/Handbrake'
import { VideoProcessor } from './VideoProcessor'
import { VideoCollection } from './VideoCollection'

const EXTENSIONS: string[] = ['.avi', '.mkv', '.mp4', '.mpeg', '.mpg', '.ts', '.wmv']
const GLOBS: string[] = EXTENSIONS.map(ext => `**/*${ext}`)

export class PlexifyManager {
  private readonly log = Logger.extend('manager')

  private readonly handbrake: Handbrake
  private readonly processor: VideoProcessor
  private readonly videos: VideoCollection

  constructor(private readonly directory: string) {
    this.handbrake = new Handbrake()
    this.videos = new VideoCollection()
    this.processor = new VideoProcessor(this.videos, this.handbrake)

    watch(directory, async (event, filename) => {
      try {
        const result = await this.watchEvent(event, filename)
        this.log.trace('watch-event', event, filename, result)
      } catch (error) {
        this.log.error(error)
      }
    })
  }

  close(): Promise<void> {
    return this.videos.close()
  }

  async execute(owner: string, rename: boolean, concurrency: number = 2): Promise<Result[]> {
    const throttler = (filename: string) => {
      return async (): Promise<Result> => {
        try {
          await this.videos.upsert(filename)

          const video = await this.videos.get(filename)
          const convertible = await this.processor.convertible(filename)

          if (convertible) {
            const result = await this.processor.convert(filename, owner, rename)

            return {
              state: result ? VideoStates.Converted : VideoStates.Failed,
              video,
            }
          }

          return {
            state: VideoStates.Converted,
            video,
          }
        } catch (error) {
          this.log.error(error)
          throw error
        }
      }
    }

    try {
      const globs = await fs.globs(GLOBS, this.directory)
      return throttle(globs.map(throttler), { maxInProgress: concurrency })
    } catch (error) {
      this.log.error(error)
      throw error
    }
  }

  async fileinfo(filename: string): Promise<{ track: any[] }> {
    try {
      const info = await mediainfo(filename)
      return {
        track: info.media.track,
      }
    } catch (error) {
      this.log.error(error)
      throw error
    }
  }

  files(): Promise<string[]> {
    return fs.globs(GLOBS, this.directory)
  }

  private watchEvent(event: string, filename: string): Promise<boolean> {
    switch (event) {
      case 'update':
        return this.videos.upsert(filename)

      case 'remove':
        return this.videos.remove(filename)
    }

    return Promise.resolve(true)
  }
}
