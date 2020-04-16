import { MultiBar, Presets } from 'cli-progress'
import { CommandModule, Arguments, CommandBuilder } from 'yargs'

import { ScanOptions } from '../Options/ScanOptions'
import { MediaScanner } from '../MediaScanner'

export class ScanCommand implements CommandModule<{}, ScanOptions> {
  aliases = ['scan']
  command = 'scan <path> [filenames..]'

  builder: CommandBuilder<{}, ScanOptions> = {
    minutes: {
      alias: 'a',
      default: 120,
      type: 'number',
    },
    reverse: {
      alias: 'r',
      default: false,
      type: 'boolean',
    },
  }

  handler = async (args: Arguments<ScanOptions>) => {
    const bars = new MultiBar(
      {
        format: '[{bar} {percentage}%] ETA: {eta_formatted} - {message}',
        stopOnComplete: true,
      },
      Presets.shades_classic,
    )

    const scanbar = bars.create(100, 0, { message: 'scanner' })
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

    await scanner.scan(args.path, args.minutes, args.reverse, (filename) => {
      if (args.filenames.length > 0) {
        return args.filenames.includes(filename)
      }

      return true
    })
  }
}
