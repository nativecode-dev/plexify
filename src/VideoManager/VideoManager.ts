import { fs } from '@nofrills/fs'
import { all } from 'promise-parallel-throttle'

import { Logger } from '../Logging'
import { VideoInfo } from './VideoInfo'
import { VideoManagerOptions } from './VideoManagerOptions'
import { DataStore, DefaultDataStoreOptions } from '../DataStore/DataStore'
import { MediaInfo, DefaultMediaInfoOptions } from '../MediaInfo/MediaInfo'
import { Handbrake, EncodeResults, DefaultHandbrakeOptions } from '../Handbrake/Handbrake'

export const DefaultVideoManagerOptions: VideoManagerOptions = {
  extensions: ['avi', 'mp4', 'mpg', 'mpeg', 'wmv'],
  paths: [],
  rename: true,

  datastore: DefaultDataStoreOptions,
  handbrake: DefaultHandbrakeOptions,
  mediainfo: DefaultMediaInfoOptions,
}

export class VideoManager {
  private readonly datastore: DataStore
  private readonly handbrake: Handbrake
  private readonly log = Logger.extend('videomanager')
  private readonly mediainfo: MediaInfo
  private readonly options: VideoManagerOptions

  constructor(private readonly videoManagerOptions: Partial<VideoManagerOptions>) {
    this.options = { ...DefaultVideoManagerOptions, ...videoManagerOptions }
    this.datastore = new DataStore(this.options.datastore)
    this.handbrake = new Handbrake(this.options.handbrake)
    this.mediainfo = new MediaInfo(this.options.mediainfo)
  }

  encode(videos: VideoInfo[]): Promise<EncodeResults[]> {
    return all(videos.filter(video => video.converted === false).map(video => () => this.reEncodeVideo(video)))
  }

  find(): Promise<string[]> {
    const patterns = this.options.paths.reduce((results, path) => {
      const mapped = this.options.extensions.map(extension => fs.join(path, `**/*.${extension}`))
      return [...results, ...mapped]
    }, [])

    this.log.debug('patterns', ...patterns)
    return fs.globs(patterns)
  }

  scan(files: string[]): Promise<VideoInfo[]> {
    return all(
      files.map(file => async () => {
        const format = await this.mediainfo.videoProfileFormat(file)
        const video: VideoInfo = {
          converted: format.startsWith('High@') || format.startsWith('Main@'),
          source: file,
          videoFormat: format,
        }

        if (await this.datastore.exists(video.source)) {
          return this.datastore.getJson<VideoInfo>(video.source)
        }

        this.log.info(video.source, video)

        return video
      }),
    )
  }

  private async reEncodeVideo(video: VideoInfo): Promise<EncodeResults> {
    const target = `${video.source}.processing`

    if (await fs.exists(target)) {
      await fs.delete(target)
    }

    const results = await this.handbrake.encode(video.source, target)

    try {
      if (await this.datastore.exists(video.source)) {
        video.converted = results.success
        await this.datastore.setJson(video.source, video)
      }

      if (this.options.rename) {
        const temp = `${target}.tmp`

        if ((await fs.rename(target, temp)) === false) {
          throw Error(`Failed to rename ${target} to ${temp}`)
        }

        if ((await fs.rename(temp, video.source)) === false) {
          throw Error(`Failed to rename ${temp} to ${video.source}`)
        }
      }

      this.log.info(video.source, video)

      return results
    } finally {
      results.success = false
      return results
    }
  }
}
