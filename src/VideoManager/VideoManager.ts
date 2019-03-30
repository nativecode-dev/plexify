import { fs } from '@nofrills/fs'
import { all } from 'promise-parallel-throttle'

import { VideoInfo } from './VideoInfo'
import { MediaInfo, DefaultMediaInfoOptions } from '../MediaInfo/MediaInfo'
import { VideoManagerOptions } from './VideoManagerOptions'
import { Handbrake, EncodeResults, DefaultHandbrakeOptions } from '../Handbrake/Handbrake'
import { DataStore, DefaultDataStoreOptions } from '../DataStore/DataStore'

const DefaultOptions: VideoManagerOptions = {
  extensions: ['avi', 'mp4', 'mpg', 'mpeg', 'wmv'],
  paths: [],

  datastore: DefaultDataStoreOptions,
  handbrake: DefaultHandbrakeOptions,
  mediainfo: DefaultMediaInfoOptions,
}

export class VideoManager {
  private readonly datastore: DataStore
  private readonly handbrake: Handbrake
  private readonly mediainfo: MediaInfo
  private readonly options: VideoManagerOptions

  constructor(private readonly videoManagerOptions: Partial<VideoManagerOptions>) {
    this.options = { ...DefaultOptions, ...videoManagerOptions }
    this.datastore = new DataStore(this.options.datastore)
    this.handbrake = new Handbrake(this.options.handbrake)
    this.mediainfo = new MediaInfo(this.options.mediainfo)
  }

  async encode(videos: VideoInfo[]): Promise<EncodeResults[]> {
    return all(
      videos
        .filter(video => video.converted === false)
        .map(video => async () => {
          const basepath = fs.dirname(video.source)
          const target = fs.join(basepath, `${video.source}.processing`)
          const results = await this.handbrake.encode(video.source, target)
          if (await this.datastore.exists(video.source)) {
            video.converted = results.success
            await this.datastore.setJson(video.source, video)
          }
          return results
        }),
    )
  }

  async find(): Promise<string[]> {
    const patterns = this.options.paths.reduce((results, path) => {
      const mapped = this.options.extensions.map(extension => fs.join(path, `**/*.${extension}`))
      return [...results, ...mapped]
    }, [])

    return fs.globs(patterns)
  }

  async scan(files: string[]): Promise<VideoInfo[]> {
    return all(
      files.map(file => async () => {
        const format = await this.mediainfo.videoProfileFormat(file)
        const video: VideoInfo = {
          converted: false,
          source: file,
          videoFormat: format,
        }

        if (await this.datastore.exists(video.source)) {
          return this.datastore.getJson<VideoInfo>(video.source)
        }

        return video
      }),
    )
  }
}
