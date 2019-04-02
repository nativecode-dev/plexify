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
  rename: false,

  datastore: DefaultDataStoreOptions,
  handbrake: DefaultHandbrakeOptions,
  mediainfo: DefaultMediaInfoOptions,
}

const ValidVideoFormats: string[] = ['AVC', 'HEVC', 'MPEG-4', 'xvid']
const ValidVideoProfiles: string[] = ['@L4', '@L5', 'High@']

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
    return all(videos.filter(video => video.converted === false).map(video => () => this.convertVideo(video)))
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
        const format = await this.mediainfo.videoFormat(file)
        const profile = await this.mediainfo.videoProfileFormat(file)
        const video: VideoInfo = {
          converted: this.requiresConversion(format, profile),
          source: file,
          videoFormat: format,
          videoProfileFormat: profile,
        }

        if (await this.datastore.exists(video.source)) {
          const videoData = await this.datastore.getJson<VideoInfo>(fs.basename(video.source))

          if (videoData.converted) {
            return videoData
          }
        }

        this.log.info(video.source, video.converted, video.videoFormat, video.videoProfileFormat)

        return video
      }),
    )
  }

  private async convertVideo(video: VideoInfo): Promise<EncodeResults> {
    const target = `${video.source}.processing`

    if (await fs.exists(target)) {
      await fs.delete(target)
    }

    const results = await this.handbrake.encode(video.source, target)

    this.log.debug(results.filename, results.success)

    try {
      if (results.success) {
        video.converted = results.success

        if ((await this.datastore.setJson(fs.basename(video.source), video)) === false) {
          throw new Error(`Failed to set redis key: ${video.source}`)
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
      }
    } catch (error) {
      results.success = false
      this.log.error(error)
    } finally {
      return results
    }
  }

  private requiresConversion(format: string, profile: string): boolean {
    const formatIncluded = ValidVideoFormats.some(x => format.indexOf(x) >= 0)
    const profileIncluded = ValidVideoProfiles.some(x => profile.indexOf(x) >= 0)
    const requireConversion = formatIncluded && profileIncluded
    this.log.debug(`requiresConversion=${requireConversion}`, `[format:${format}]`, formatIncluded, `[profile:${profile}]`, profileIncluded)
    return requireConversion
  }
}
