import watch from 'node-watch'
import throttle from 'promise-parallel-throttle'

import { fs } from '@nofrills/fs'

import { Result, VideoStates } from './Result'
import { VideoProcessor } from './VideoProcessor'
import { VideoCollection } from './VideoCollection'
import { Handbrake } from './Handbrake/Handbrake'

const EXTENSIONS: string[] = ['.avi', '.mp4', '.mpeg', '.mpg', '.ts', '.wmv']
const GLOBS: string[] = EXTENSIONS.map(ext => `**/*${ext}`)

export class PlexifyManager {
  private readonly handbrake: Handbrake
  private readonly processor: VideoProcessor
  private readonly videos: VideoCollection

  constructor(private readonly directory: string) {
    this.handbrake = new Handbrake()
    this.videos = new VideoCollection()
    this.processor = new VideoProcessor(this.videos, this.handbrake)

    watch(directory, async (event, filename) => {
      switch (event) {
        case 'update':
          await this.videos.upsert(filename)
          break

        case 'remove':
          await this.videos.remove(filename)
          break
      }
    })
  }

  async execute(owner: string, rename: boolean, concurrency: number = 2): Promise<Result[]> {
    const throttler = (filename: string) => {
      return async (): Promise<Result> => {
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
      }
    }

    const globs = await fs.globs(GLOBS, this.directory)
    return throttle.all(globs.map(throttler), { maxInProgress: concurrency })
  }
}
