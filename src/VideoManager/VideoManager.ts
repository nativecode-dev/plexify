import { fs } from '@nofrills/fs'
import { all } from 'promise-parallel-throttle'

import { VideoInfo } from './VideoInfo'
import { MediaInfo } from '../MediaInfo/MediaInfo'
import { VideoManagerOptions } from './VideoManagerOptions'
import { Handbrake, EncodeResults } from '../Handbrake/Handbrake'

const DefaultOptions: Partial<VideoManagerOptions> = {
  extensions: ['avi', 'mp4', 'mpg', 'mpeg', 'wmv'],
}

export class VideoManager {
  private readonly handbrake: Handbrake
  private readonly mediainfo: MediaInfo
  private readonly options: VideoManagerOptions

  constructor(private readonly videoManagerOptions: Partial<VideoManagerOptions>) {
    this.handbrake = new Handbrake()
    this.mediainfo = new MediaInfo()
    this.options = { ...DefaultOptions, ...videoManagerOptions } as VideoManagerOptions
  }

  async encode(files: string[]): Promise<EncodeResults[]> {
    return all(
      files.map(file => async () => {
        const basepath = fs.dirname(file)
        const target = fs.join(basepath, `${file}.processing`)
        const results = await this.handbrake.encode(file, target)
        return results
      }),
    )
  }

  async find(): Promise<string[]> {
    const patterns = this.options.paths.reduce((results, path) => {
      const mapped = this.options.extensions.map(extension => fs.join(path, `**/*.${extension}`))
      return [...results, ...mapped]
    }, [])

    console.log('patterns', ...patterns)

    return fs.globs(patterns)
  }

  async scan(files: string[]): Promise<VideoInfo[]> {
    return all(
      files.map(file => async () => {
        const format = await this.mediainfo.videoProfileFormat(file)
        return {
          source: file,
          videoFormat: format,
        }
      }),
    )
  }
}
