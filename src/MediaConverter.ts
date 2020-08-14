import ffmpeg from 'fluent-ffmpeg'

import { BError } from 'berror'
import { fs } from '@nofrills/fs'
import { EventEmitter } from 'events'
import { Lincoln } from '@nnode/lincoln'

import { MediaStore } from './MediaStore'
import { StreamFile } from './StreamFile'
import { FileContext } from './FileContext'
import { getMediaInfo } from './MediaFunctions'
import { MediaError } from './Errors/MediaError'
import { StreamProgress } from './StreamProgress'
import { formatFileName } from './FileNameFunctions'

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
    private readonly videoCodec: string = 'hevc_vaapi',
  ) {
    super()
    this.log = logger.extend('converter')
    this.store = new MediaStore(logger)
  }

  convert(file: StreamFile, preset: string, format: string, dryrun: boolean): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (await this.store.locked(file.fullpath)) {
        return
      }

      await this.store.lock(file.fullpath, file.data)

      const context: FileContext = {
        dryrun,
        file,
        filename: {
          converted: formatFileName(file.fullpath, format),
          original: file.fullpath,
          processing: `${file.fullpath}.processing`,
          extension: {
            converted: '.mp4',
            original: fs.ext(file.fullpath),
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

      this.log.info('[convert]', {
        original: fs.basename(context.filename.original),
        converted: fs.basename(context.filename.converted),
      })

      const exe = ffmpeg()
        .withOption('-hwaccel vaapi')
        .withOption('-hwaccel_device /dev/dri/renderD128')
        .withOption('-hwaccel_output_format vaapi')
        .addInput(file.fullpath)
        .addOutput(context.filename.processing)
        .outputFormat(this.format)
        .withAudioCodec(this.audioCodec)
        .withVideoCodec(this.videoCodec)
        .on('start', () => this.emit(MediaConverter.events.start, file.fullpath, context.filename.converted))
        .on('stop', () => this.emit(MediaConverter.events.stop))
        .on('end', () => this.complete(resolve, reject, context))
        .on('progress', (progress: StreamProgress) => this.emit(MediaConverter.events.progress, progress))
        .on('error', async (error, stdout, stderr) => {
          this.log.error(new BError('convert', error))
          this.log.trace(stdout)
          this.log.trace(stderr)
          await this.store.unlock(file.fullpath, context.file.data)
          reject(new MediaError(stdout, stderr, error))
        })

      return exe.run()
    })
  }

  private async complete(resolve: Function, reject: Function, context: FileContext): Promise<void> {
    try {
      this.log.trace('completed', context.filename.original, context.filename.processing, context.filename.converted)

      if (context.dryrun === false) {
        if (context.filename.extension.original !== '.mp4') {
          await fs.delete(context.file.fullpath)
          this.log.trace('delete', fs.basename(context.file.fullpath))
        }

        if (await fs.exists(context.filename.converted)) {
          await fs.delete(context.filename.converted)
          this.log.trace('delete', fs.basename(context.filename.converted))
        }

        await fs.rename(context.filename.processing, context.filename.converted)

        if (await fs.exists(context.filename.processing)) {
          await fs.delete(context.filename.processing)
        }

        this.log.trace('rename', fs.basename(context.filename.processing), fs.basename(context.filename.converted))
      }

      const data = await getMediaInfo(context.filename.converted)
      await this.store.unlock(context.file.fullpath, data)

      this.emit(MediaConverter.events.stop)
      resolve()
    } catch (error) {
      this.log.error(new BError('complete', error))
      reject(error)
      throw error
    }
  }
}
