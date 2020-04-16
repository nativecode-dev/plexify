import os from 'os'
import moment from 'moment'

import { FfprobeData, FfprobeStream } from 'fluent-ffmpeg'

import { fs } from '@nofrills/fs'
import { EventEmitter } from 'events'
import { Throttle } from '@nnode/common'

import { MediaStore } from './MediaStore'
import { StreamFile } from './StreamFile'
import { getMediaInfo } from './MediaFunctions'

export type MediaFileNameFilter = (filename: string) => boolean

const DefaultMediaFileNameFilter = () => true

export class MediaScanner extends EventEmitter {
  static readonly codecs = ['aac', 'hevc']
  static readonly extensions = ['avi', 'mkv', 'mp4', 'mpeg', 'mpg', 'wmv']

  static readonly events = {
    progress: 'progress',
    start: 'start',
    stop: 'stop',
  }

  private readonly globs: string[]
  private readonly media: MediaStore

  constructor(allowedExtensions = MediaScanner.extensions, private readonly allowedCodecs = MediaScanner.codecs) {
    super()
    this.globs = allowedExtensions.map((glob) => `**/*.${glob}`)
    this.media = new MediaStore()
  }

  async scan(
    path: string,
    minutes: number = 120,
    reverse: boolean = false,
    filter: MediaFileNameFilter = DefaultMediaFileNameFilter,
  ) {
    const unsorted = await fs.globs(this.globs, path)

    const sorted = this.applySort(
      unsorted.filter((filename) => filter(filename)),
      reverse,
    )

    const filtered = await this.applyAgeFilter(sorted, minutes)

    const total = filtered.length

    this.emit(MediaScanner.events.start, total)

    const files = await Throttle(
      filtered.map((filename) => {
        return async () => {
          const info = await getMediaInfo(filename)
          const audio = this.findAudioStream(info)
          const video = this.findVideoStream(info)
          const stream: StreamFile = { data: info, filename, format: info.format, audio, video }

          const id = fs.basename(filename)

          await this.media.upsert({
            _id: id,
            filename,
            host: null,
            locked: false,
            source: info,
          })

          this.emit(MediaScanner.events.progress)

          const audioCodeDisallowed = this.codec_allowed(audio.codec_name) === false
          const videoCodecDisallowed = this.codec_allowed(video.codec_name) === false

          if (audioCodeDisallowed || videoCodecDisallowed) {
            return stream
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
