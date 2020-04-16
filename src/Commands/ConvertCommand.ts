import os from 'os'

import { fs } from '@nofrills/fs'
import { Throttle } from '@nnode/common'
import { MultiBar, Presets } from 'cli-progress'
import { CommandModule, Arguments, CommandBuilder } from 'yargs'

import { StreamFile } from '../StreamFile'
import { MediaScanner } from '../MediaScanner'
import { MediaConverter } from '../MediaConverter'
import { StreamProgress } from '../StreamProgress'
import { ConvertOptions } from '../Options/ConvertOptions'

export class ConvertCommand implements CommandModule<{}, ConvertOptions> {
  aliases = ['convert']
  command = 'convert <path> [filenames..]'

  builder: CommandBuilder<{}, ConvertOptions> = {
    dryrun: {
      alias: 'd',
      default: false,
      type: 'boolean',
    },
    minutes: {
      alias: 'a',
      default: 120,
      type: 'number',
    },
    rename: {
      alias: 'm',
      default: true,
      type: 'boolean',
    },
    reverse: {
      alias: 'r',
      default: false,
      type: 'boolean',
    },
    processors: {
      alias: 'p',
      default: os.cpus().length,
      type: 'number',
    },
  }

  handler = async (args: Arguments<ConvertOptions>) => {
    const bars = new MultiBar(
      {
        format: '[{bar} {percentage}%] ETA: {eta_formatted} - {message}',
        stopOnComplete: true,
      },
      Presets.shades_classic,
    )

    const scanbar = bars.create(0, 0, { message: 'scanner' })
    const scanner = new MediaScanner()

    scanner.on('progress', () => {
      scanbar.increment(1)
    })

    scanner.on('start', (total: number) => {
      scanbar.start(total, 0, { message: 'scanning' })
    })

    scanner.on('stop', () => {
      scanbar.stop()
      bars.remove(scanbar)
    })

    const scanned = await scanner.scan(args.path, args.minutes, args.reverse, (filename) => {
      if (args.filenames.length > 0) {
        return args.filenames.some((name) => name.endsWith(filename))
      }

      return true
    })

    const filter = (results: StreamFile[]) => {
      return results.filter((scanned) =>
        args.filenames.reduce((result, current) => {
          if (scanned.filename.endsWith(current)) {
            return true
          }

          return result
        }, false),
      )
    }

    const files = args.filenames.length > 0 ? filter(scanned) : scanned

    let current = 0

    const payload = { message: args.path }
    const filebar = bars.create(files.length, current, payload)

    filebar.start(files.length, current, payload)

    await Throttle(
      files.map((file) => async () => {
        const conversion = bars.create(100, 0, { message: fs.basename(file.filename) })
        const converter = new MediaConverter()

        const handleProgress = (progress: StreamProgress) => {
          conversion.update(progress.percent, { message: fs.basename(file.filename) })
          filebar.update(current)
        }

        const handleStart = () => conversion.start(100, 0, { message: file.filename })

        const handleStop = () => {
          current++
          bars.remove(conversion)
        }

        converter.on('start', handleStart)
        converter.on('stop', handleStop)
        converter.on('progress', handleProgress)

        try {
          await converter.convert(file, args.rename, args.dryrun)
        } catch (error) {
          throw error
        } finally {
          converter.off('progress', handleProgress)
          converter.off('stop', handleStop)
          converter.off('start', handleStart)
        }

        filebar.increment(1)
      }),
      args.processors,
    )

    filebar.stop()
  }
}
