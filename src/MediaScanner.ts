import moment from 'moment'

import { BError } from 'berror'
import { fs } from '@nofrills/fs'
import { EventEmitter } from 'events'
import { Lincoln } from '@nnode/lincoln'
import { Throttle } from '@nnode/common'
import { FfprobeData, FfprobeStream } from 'fluent-ffmpeg'

import { MediaStore } from './MediaStore'
import { StreamFile } from './StreamFile'
import { getMediaInfo } from './MediaFunctions'
import { MediaInfo } from './MediaInfo'

export type MediaFileNameFilter = (filename: string) => boolean

const DefaultFilter = () => true

export class MediaScanner extends EventEmitter {
  static readonly codecs = ['aac', 'hevc']
  static readonly extensions = ['avi', 'mkv', 'mp4', 'mpeg', 'mpg', 'wmv']

  static readonly events = {
    progress: 'progress',
    start: 'start',
    stop: 'stop',
  }

  private readonly globs: string[]
  private readonly log: Lincoln
  private readonly media: MediaStore

  constructor(
    logger: Lincoln,
    readonly allowedExtensions = MediaScanner.extensions,
    readonly allowedCodecs = MediaScanner.codecs,
  ) {
    super()
    this.globs = allowedExtensions.map((glob) => `**/*.${glob}`)
    this.log = logger.extend('scanner')
    this.media = new MediaStore(logger)
  }

  async scan(path: string, minutes: number = 0, reverse: boolean = false, filter: MediaFileNameFilter = DefaultFilter) {
    const documents: MediaInfo[] = await this.media.all({
      selector: {
        'source.streams': {
          $elemMatch: {
            codec_name: {
              $ne: 'hevc',
            },
            codec_type: {
              $eq: 'video',
            },
          },
        },
      },
      fields: ['_id', 'filename'],
    })

    this.log.info('[scan] retrieving cached', { cached: documents.length })

    this.log.info('[scan] gathering globs')
    const unsorted = await fs.globs(this.globs, path)

    this.log.info('[scan] unsorted', { length: unsorted.length })
    const sorted = this.applySort(unsorted, reverse)

    this.log.info('[scan] sorted', sorted.length, reverse)

    const filtered = await this.applyAgeFilter(
      sorted.filter((filename) => filter(filename)),
      minutes,
    )

    this.log.info('[scan] filtered', { length: filtered.length })

    const total = filtered.length
    this.log.info('[scan] total', { total })

    this.emit(MediaScanner.events.start, total)

    const files = await Throttle(
      filtered.map((fullname, index) => async () => {
        try {
          const filename = fs.basename(fullname)
          const filepath = fs.dirname(fullname)

          if (this.media.has(filename, documents)) {
            const document = await this.media.get(filename)

            if (document) {
              return this.convertable(document, index, total)
            }
          }

          const source = await getMediaInfo(fullname)

          const document: MediaInfo = this.media.document({
            filename,
            filepath,
            host: null,
            locked: false,
            source,
          })

          console.log(await this.media.upsert(filename, document))

          return this.convertable(document, index, total)
        } catch (error) {
          this.log.error(new BError('scan', error), error)
        }

        return null
      }),
    )

    this.emit(MediaScanner.events.stop)

    return files.reduce<StreamFile[]>((results, file) => (file !== null ? [...results, file] : results), [])
  }

  private async convertable(info: MediaInfo, index: number, total: number): Promise<StreamFile | null> {
    try {
      const audio = this.findAudioStream(info.source)
      const video = this.findVideoStream(info.source)

      const audioCodeDisallowed = this.codec_allowed(audio.codec_name) === false
      const videoCodecDisallowed = this.codec_allowed(video.codec_name) === false

      const locked = await this.media.locked(info.filename)
      this.log.trace(info.filename, 'lock-status', locked, 'progress', index, total)
      this.emit(MediaScanner.events.progress, info.filename, locked)

      if ((audioCodeDisallowed || videoCodecDisallowed) && locked === false) {
        const streamFile: StreamFile = {
          audio,
          video,
          fullpath: fs.join(info.filepath, info.filename),
          data: info.source,
          format: info.source.format,
        }

        return streamFile
      }

      return null
    } catch (error) {
      throw new BError('convertible', error)
    }
  }

  private applyAgeFilter(files: string[], minutes: number): Promise<string[]> {
    return files.reduce<Promise<string[]>>(async (previous, current) => {
      const results = await previous
      const stat = await fs.stat(current)
      const created = stat.stats.ctime
      const $created = moment(created)
      const diff = $created.diff(new Date(), 'minutes')

      if (Math.abs(diff) > minutes) {
        results.push(current)
      }

      return results
    }, Promise.resolve([]))
  }

  private applySort(files: string[], reverse: boolean): string[] {
    return files.sort((source, target) => {
      if (source > target) {
        return reverse ? -1 : 1
      }

      if (source < target) {
        return reverse ? 1 : -1
      }

      return 0
    })
  }

  private codec_allowed(codec?: string): boolean {
    if (codec) {
      return this.allowedCodecs.some((name) => codec === name)
    }

    return false
  }

  private findAudioStream(data: FfprobeData): FfprobeStream {
    return data.streams
      .filter((stream) => stream.codec_type === 'audio')
      .reduce<FfprobeStream | any>((_, current) => current, {})
  }

  private findVideoStream(data: FfprobeData): FfprobeStream {
    return data.streams
      .filter((stream) => stream.codec_type === 'video')
      .reduce<FfprobeStream | any>((_, current) => current, {})
  }
}
