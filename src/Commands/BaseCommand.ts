import { fs } from '@nofrills/fs'
import { Lincoln } from '@nnode/lincoln'
import { Throttle } from '@nnode/common'
import { CommandModule, CommandBuilder, Arguments } from 'yargs'

import { BError } from 'berror'
import { Logger } from '../Logger'
import { BarManager } from '../BarManager'
import { StreamFile } from '../StreamFile'
import { MediaScanner } from '../MediaScanner'
import { MediaConverter } from '../MediaConverter'
import { StreamProgress } from '../StreamProgress'
import { ScanOptions } from '../Options/ScanOptions'
import { PlexifyOptions } from '../Options/PlexifyOptions'
import { ConvertOptions } from '../Options/ConvertOptions'

export abstract class BaseCommand<T extends PlexifyOptions> implements CommandModule<{}, T> {
  abstract aliases: string[]
  abstract command: string
  abstract builder: CommandBuilder<{}, T>
  abstract handler(args: Arguments<T>): void

  protected log: Lincoln = Logger.extend('command')

  protected async scan(args: ScanOptions, bars: BarManager) {
    const scanbar = 'scanner'
    const scanner = new MediaScanner(Logger)
    const payload = { message: 'scanning' }

    const handleProgress = (filename: string) => {
      bars.incrementBar(scanbar, 1, { message: filename })
    }

    const handleStart = (total: number) => {
      bars.createBar(scanbar, payload)
      bars.startBar(scanbar, total, payload)
    }

    const handleStop = () => {
      bars.stopBar(scanbar)
    }

    scanner.on('progress', handleProgress)
    scanner.on('start', handleStart)
    scanner.on('stop', handleStop)

    const results = await scanner.scan(args.path, args.minutes, args.reverse, (filename: string) => {
      if (args.filenames.length > 0) {
        return args.filenames.some((name) => {
          const basename = fs.basename(filename).toLowerCase()
          const selected = name.toLowerCase()
          this.log.trace(basename, selected)
          return basename === selected
        })
      }

      return true
    })

    scanner.off('stop', handleStop)
    scanner.off('start', handleStart)
    scanner.off('progress', handleProgress)

    return results
  }

  protected async transcode(args: ConvertOptions, bars: BarManager, scanned: StreamFile[]) {
    const filebar = 'filebar'
    const payload = { message: args.path }

    bars.createBar(filebar, payload)
    bars.startBar(filebar, scanned.length, payload)

    await Throttle(
      scanned.map((file) => async () => {
        const id = fs.basename(file.fullpath, false)
        const converter = new MediaConverter(Logger)

        const handleProgress = (progress: StreamProgress) => {
          bars.updateBar(id, progress.percent, { message: fs.basename(file.fullpath) })
        }

        const handleStart = () => {
          bars.createBar(id)
          bars.startBar(id, 100, { message: file.fullpath })
        }

        const handleStop = () => {
          bars.stopBar(id)
        }

        converter.on('start', handleStart)
        converter.on('stop', handleStop)
        converter.on('progress', handleProgress)

        try {
          await converter.convert(file, args.preset, args.format, args.dryrun)
        } catch (error) {
          this.log.error(new BError('transcode', error))
        } finally {
          converter.off('progress', handleProgress)
          converter.off('stop', handleStop)
          converter.off('start', handleStart)
        }

        bars.incrementBar(filebar, 1)
      }),
      args.processors,
    )

    bars.stopBar(filebar)
  }
}
