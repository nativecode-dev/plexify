import moment from 'moment'

import { FfprobeData, FfprobeStream } from 'fluent-ffmpeg'

import { fs } from '@nofrills/fs'
import { EventEmitter } from 'events'
import { Throttle } from '@nnode/common'

import { MediaStore } from './MediaStore'
import { StreamFile } from './StreamFile'
import { getMediaInfo } from './MediaFunctions'
import { Lincoln } from '@nnode/lincoln'
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
    allowedExtensions = MediaScanner.extensions,
    private readonly allowedCodecs = MediaScanner.codecs,
  ) {
    super()
    this.globs = allowedExtensions.map((glob) => `**/*.${glob}`)
    this.log = logger.extend('scanner')
    this.media = new MediaStore(logger)
  }

  async scan(path: string, minutes: number = 0, reverse: boolean = false, filter: MediaFileNameFilter = DefaultFilter) {
    this.log.info('[scan] gathering globs')

    const unsorted = await fs.globs(this.globs, path)
    this.log.trace('[scan] unsorted', { length: unsorted.length })

    const sorted = this.applySort(unsorted, reverse)
    this.log.trace('[scan] sorted', sorted.length, reverse)

    const filtered = await this.applyAgeFilter(
      sorted.filter((filename) => filter(filename)),
      minutes,
    )

    this.log.trace('[scan] filtered', { lenght: filtered.length })

    const total = filtered.length
    this.log.trace('[scan] total', { total })

    this.emit(MediaScanner.events.start, total)

    const documents = await this.media.all()

    const files = await Throttle(
      filtered.map((filename, index) => async () => {
        try {
          const id = fs.basename(filename, false)

          if (documents.map((doc) => doc?._id).includes(id)) {
            const document = await this.media.get(id)
            return this.convertible(filename, document, index, total)
          }

          const info = await getMediaInfo(filename)
          const document: MediaInfo = { _id: id, host: null, locked: false, source: info }
          await this.media.upsert(id, info)
          return this.convertible(filename, document, index, total)
        } catch (error) {
          this.log.error(error)
        }

        return null
      }),
    )

    this.emit(MediaScanner.events.stop)

    return files.reduce<StreamFile[]>((results, file) => (file !== null ? [...results, file] : results), [])
  }

  private async convertible(
    filename: string,
    info: MediaInfo,
    index: number,
    total: number,
  ): Promise<StreamFile | null> {
    const id = fs.basename(filename, false)

    const audio = this.findAudioStream(info.source)
    const video = this.findVideoStream(info.source)

    const audioCodeDisallowed = this.codec_allowed(audio.codec_name) === false
    const videoCodecDisallowed = this.codec_allowed(video.codec_name) === false

    const locked = await this.media.locked(id)
    this.log.trace(id, 'lock-status', locked, 'progress', index, total)
    this.emit(MediaScanner.events.progress, filename, locked)

    if ((audioCodeDisallowed || videoCodecDisallowed) && locked === false) {
      const streamFile: StreamFile = {
        audio,
        video,
        filename,
        data: info.source,
        format: info.source.format,
      }

      return streamFile
    }

    return null
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
    return data.streams.filter((stream) => stream.codec_type === 'audio').reduce((_, current) => current)
  }

  private findVideoStream(data: FfprobeData): FfprobeStream {
    return data.streams.filter((stream) => stream.codec_type === 'video').reduce((_, current) => current)
  }
}
