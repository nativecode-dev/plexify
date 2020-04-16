import os from 'os'

import { fs } from '@nofrills/fs'
import { Throttle } from '@nnode/common'
import { CommandModule, Arguments, CommandBuilder } from 'yargs'

import { Logger } from '../Logger'
import { BarManager } from '../BarManager'
import { MediaScanner } from '../MediaScanner'
import { MediaConverter } from '../MediaConverter'
import { StreamProgress } from '../StreamProgress'
import { ConvertOptions } from '../Options/ConvertOptions'

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
    const bars = new BarManager(args)

    const scanbar = 'scanner'
    const scanner = new MediaScanner(Logger)

    bars.createBar(scanbar)

    scanner.on('progress', () => {
      bars.incrementBar(scanbar)
    })

    scanner.on('start', (total: number) => {
      bars.startBar(scanbar, total, { message: 'scanning' })
    })

    scanner.on('stop', () => {
      bars.stopBar(scanbar)
      bars.removeBar(scanbar)
    })

    const scanned = await scanner.scan(args.path, args.minutes, args.reverse, (filename: string) => {
      if (args.filenames.length > 0) {
        return args.filenames.some((name) => fs.basename(filename).toLowerCase() === name.toLowerCase())
      }

      return true
    })

    const filebar = 'filebar'
    const payload = { message: args.path }

    bars.createBar(filebar)
    bars.startBar(filebar, scanned.length, payload)

    await Throttle(
      scanned.map((file) => async () => {
        const id = fs.basename(file.filename)
        const converter = new MediaConverter(Logger)

        const handleProgress = (progress: StreamProgress) => {
          bars.updateBar(id, progress.percent, { message: fs.basename(file.filename) })
        }

        const handleStart = () => {
          bars.createBar(id)
          bars.startBar(id, 100, { message: file.filename })
        }

        const handleStop = () => {
          bars.stopBar(id)
          bars.removeBar(id)
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

        bars.incrementBar(filebar, 1)
      }),
      args.processors,
    )

    bars.stopBar(filebar)
  }
}
