import ffmpeg from 'fluent-ffmpeg'

import { fs } from '@nofrills/fs'
import { EventEmitter } from 'events'

import { MediaStore } from './MediaStore'
import { StreamFile } from './StreamFile'
import { MediaError } from './Errors/MediaError'
import { StreamProgress } from './StreamProgress'
import { Lincoln } from '@nnode/lincoln'

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

  private readonly log: Lincoln
  private readonly store: MediaStore

  constructor(
    logger: Lincoln,
    private readonly format: string = 'mp4',
    private readonly audioCodec: string = 'aac',
    private readonly videoCodec: string = 'libx265',
  ) {
    super()
    this.log = logger.extend('converter')
    this.store = new MediaStore(logger)
  }

  convert(file: StreamFile, rename: boolean = false, dryrun: boolean = true): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const basename = fs.basename(file.filename, false)
      const dirname = fs.dirname(file.filename)
      const id = fs.basename(file.filename)

      if (await this.store.locked(id)) {
        return
      }

      await this.store.lock(id, file.filename, file.data)

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
        .on('end', async () => {
          await this.complete(resolve, reject, context)
        })
        .on('progress', (progress: StreamProgress) => {
          this.emit(MediaConverter.events.progress, progress)
        })
        .on('error', async (error, stdout, stderr) => {
          await this.store.unlock(id, context.file.filename, context.file.data)
          this.log.error(error)
          this.log.trace(stdout)
          this.log.trace(stderr)
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
            this.log.trace('delete', fs.basename(context.file.filename))
          }
        }

        if (await fs.exists(context.filename.converted)) {
          if (context.dryrun === false) {
            await fs.delete(context.filename.converted)
            this.log.trace('delete', fs.basename(context.filename.converted))
          }
        }

        if (context.dryrun === false) {
          await fs.rename(context.filename.processing, context.filename.converted)
          this.log.trace('delete', fs.basename(context.filename.processing), fs.basename(context.filename.converted))
        }
      }

      const id = fs.basename(context.filename.original)
      await this.store.unlock(id, context.file.filename, context.file.data)

      this.emit(MediaConverter.events.stop)
      resolve()
    } catch (error) {
      reject(error)
    }
  }
}
