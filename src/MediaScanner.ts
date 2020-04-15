import moment from 'moment'

import { FfprobeData, FfprobeStream } from 'fluent-ffmpeg'

import { fs } from '@nofrills/fs'
import { EventEmitter } from 'events'
import { Throttle } from '@nnode/common'

import { StreamFile } from './StreamFile'
import { getMediaInfo } from './MediaFunctions'

export class MediaScanner extends EventEmitter {
  static readonly codecs = ['aac', 'hevc']
  static readonly extensions = ['avi', 'mkv', 'mp4', 'mpeg', 'mpg', 'wmv']

  static readonly events = {
    progress: 'progress',
    start: 'start',
    stop: 'stop',
  }

  private readonly globs: string[]

  constructor(allowed_extensions = MediaScanner.extensions, private readonly allowed_codecs = MediaScanner.codecs) {
    super()
    this.globs = allowed_extensions.map((glob) => `**/*.${glob}`)
  }

  async scan(path: string, minutes: number = 120, reverse: boolean = false) {
    const filenames_unsorted = await fs.globs(this.globs, path)
    const filenames_sorted = this.applySort(filenames_unsorted, reverse)
    const filenames_filtered = await this.applyAgeFilter(filenames_sorted, minutes)

    const total = filenames_sorted.length

    this.emit(MediaScanner.events.start, total)

    const files = await Throttle(
      filenames_filtered.map((filename) => {
        return async () => {
          const info = await getMediaInfo(filename)
          const audio = this.findAudioStream(info)
          const video = this.findVideoStream(info)
          const format = info.format
          const stream_file = { filename, format, audio, video }

          this.emit(MediaScanner.events.progress)

          if (this.codec_allowed(audio.codec_name) === false || this.codec_allowed(video.codec_name) === false) {
            return stream_file
          }

          return null
        }
      }),
    )

    this.emit(MediaScanner.events.stop)

    return files.reduce<StreamFile[]>((results, file) => (file !== null ? [...results, file] : results), [])
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
      return this.allowed_codecs.some((name) => codec === name)
    }

    return false
  }

  private findAudioStream(data: FfprobeData): FfprobeStream {
    return data.streams.filter((stream) => stream.codec_type == 'audio').reduce((_, current) => current)
  }

  private findVideoStream(data: FfprobeData): FfprobeStream {
    return data.streams.filter((stream) => stream.codec_type == 'video').reduce((_, current) => current)
  }
}
