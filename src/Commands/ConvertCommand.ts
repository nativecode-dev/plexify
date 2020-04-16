import os from 'os'

import { fs } from '@nofrills/fs'
import { Throttle } from '@nnode/common'
import { MultiBar, Presets } from 'cli-progress'
import { CommandModule, Arguments, CommandBuilder } from 'yargs'

import { Logger } from '../Logger'
import { MediaScanner } from '../MediaScanner'
import { MediaConverter } from '../MediaConverter'
import { StreamProgress } from '../StreamProgress'
import { ConvertOptions } from '../Options/ConvertOptions'
import { createChildBar } from '../BarFunctions'

export class ConvertCommand implements CommandModule<{}, ConvertOptions> {
  aliases = ['convert']
  command = 'convert <path> [filenames..]'

  builder: CommandBuilder<{}, ConvertOptions> = {
    'disable-bars': {
      default: false,
      type: 'boolean',
    },
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

  async handler(args: Arguments<ConvertOptions>) {
    const bars = new MultiBar(
      {
        format: '[{bar} {percentage}%] ETA: {eta_formatted} - {message}',
        stopOnComplete: true,
      },
      Presets.shades_classic,
    )

    const scanbar = createChildBar(bars)
    const scanner = new MediaScanner(Logger)

    if (args.disableBars === false) {
      bars.remove(scanbar)
    }

    scanner.on('progress', () => {
      if (args.disableBars === false) {
        scanbar.increment(1)
      }
    })

    scanner.on('start', (total: number) => {
      if (args.disableBars === false) {
        scanbar.start(total, 0, { message: 'scanning' })
      }
    })

    scanner.on('stop', () => {
      if (args.disableBars === false) {
        scanbar.stop()
      }

      bars.remove(scanbar)
    })

    const scanned = await scanner.scan(args.path, args.minutes, args.reverse, (filename: string) => {
      if (args.filenames.length > 0) {
        return args.filenames.some((name) => fs.basename(filename).toLowerCase() === name.toLowerCase())
      }

      return true
    })

    let current = 0

    const payload = { message: args.path }
    const filebar = bars.create(scanned.length, current, payload)

    filebar.start(scanned.length, current, payload)

    await Throttle(
      scanned.map((file) => async () => {
        const conversion = bars.create(100, 0, { message: fs.basename(file.filename) })
        const converter = new MediaConverter(Logger)

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
