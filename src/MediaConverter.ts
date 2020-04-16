import os from 'os'
import ffmpeg from 'fluent-ffmpeg'

import { fs } from '@nofrills/fs'
import { EventEmitter } from 'events'

import { StreamFile } from './StreamFile'
import { MediaError } from './Errors/MediaError'
import { StreamProgress } from './StreamProgress'
import { MediaStore } from './MediaStore'
import { MediaInfo } from './MediaInfo'

interface Context {
  dryrun: boolean
  rename: boolean
  file: StreamFile
  filename: {
    converted: string
    original: string
    processing: string

    extension: {
      converted: string
      original: string
    }
  }
}

export class MediaConverter extends EventEmitter {
  static readonly events = {
    progress: 'progress',
    start: 'start',
    stop: 'stop',
  }

  private readonly store: MediaStore

  constructor(
    private readonly format: string = 'mp4',
    private readonly audioCodec: string = 'aac',
    private readonly videoCodec: string = 'libx265',
  ) {
    super()
    this.store = new MediaStore()
  }

  convert(file: StreamFile, rename: boolean = false, dryrun: boolean = true): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const basename = fs.basename(file.filename, false)
      const dirname = fs.dirname(file.filename)
      const id = fs.basename(file.filename)

      const document = await this.store.database.get<MediaInfo>(id)

      if (document && document.locked && document.host !== os.hostname()) {
        return
      }

      await this.store.upsert({
        _id: id,
        filename: file.filename,
        host: os.hostname(),
        locked: true,
        source: file.data,
      })

      const context: Context = {
        dryrun,
        rename,
        file,
        filename: {
          converted: fs.join(dirname, `${basename}.mp4`),
          original: file.filename,
          processing: `${file.filename}.processing`,
          extension: {
            converted: '.mp4',
            original: fs.ext(file.filename),
          },
        },
      }

      const exists = await fs.exists(context.filename.processing)

      if (exists) {
        await fs.delete(context.filename.processing)
      }

      if (dryrun) {
        return this.complete(resolve, reject, context)
      }

      return ffmpeg()
        .addInput(file.filename)
        .addOutput(context.filename.processing)
        .outputFormat(this.format)
        .withAudioCodec(this.audioCodec)
        .withVideoCodec(this.videoCodec)
        .on('start', () => {
          this.emit(MediaConverter.events.start, file.filename, context.filename.converted)
        })
        .on('stop', () => {
          this.emit(MediaConverter.events.stop)
        })
        .on('end', () => {
          this.complete(resolve, reject, context)
        })
        .on('progress', (progress: StreamProgress) => {
          this.emit(MediaConverter.events.progress, progress)
        })
        .on('error', (error, stdout, stderr) => {
          console.log(error, stderr)
          reject(new MediaError(stdout, stderr, error))
        })
        .run()
    })
  }

  private async complete(resolve: Function, reject: Function, context: Context): Promise<void> {
    try {
      if (context.rename) {
        if (context.filename.extension.original !== '.mp4') {
          if (context.dryrun === false) {
            await fs.delete(context.file.filename)
          }
        }

        if (await fs.exists(context.filename.converted)) {
          if (context.dryrun === false) {
            await fs.delete(context.filename.converted)
          }
        }

        if (context.dryrun === false) {
          await fs.rename(context.filename.processing, context.filename.converted)
        }
      }

      const id = fs.basename(context.filename.original)

      await this.store.upsert({
        _id: id,
        filename: context.file.filename,
        host: null,
        locked: false,
        source: context.file.data,
      })

      this.emit(MediaConverter.events.stop)
      resolve()
    } catch (error) {
      reject(error)
    }
  }
}
