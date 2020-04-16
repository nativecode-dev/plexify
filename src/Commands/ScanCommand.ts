import { fs } from '@nofrills/fs'
import { MultiBar, Presets } from 'cli-progress'
import { CommandModule, Arguments, CommandBuilder } from 'yargs'

import { Logger } from '../Logger'
import { MediaScanner } from '../MediaScanner'
import { ScanOptions } from '../Options/ScanOptions'
import { createChildBar } from '../BarFunctions'

export class ScanCommand implements CommandModule<{}, ScanOptions> {
  aliases = ['scan']
  command = 'scan <path> [filenames..]'

  builder: CommandBuilder<{}, ScanOptions> = {
    'disable-bars': {
      default: false,
      type: 'boolean',
    },
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

  async handler(args: Arguments<ScanOptions>) {
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

    const results = await scanner.scan(args.path, args.minutes, args.reverse, (filename) => {
      if (args.filenames.length > 0) {
        return args.filenames.some((name) => fs.basename(filename).toLowerCase() === name.toLowerCase())
      }

      return true
    })

    console.log(JSON.stringify(results))
  }
}
