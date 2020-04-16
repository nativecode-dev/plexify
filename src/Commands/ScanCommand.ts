import { fs } from '@nofrills/fs'
import { CommandModule, Arguments, CommandBuilder } from 'yargs'

import { Logger } from '../Logger'
import { BarManager } from '../BarManager'
import { MediaScanner } from '../MediaScanner'
import { ScanOptions } from '../Options/ScanOptions'

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
    const bars = new BarManager(args)
    const scanbar = 'scanbar'
    const scanner = new MediaScanner(Logger)

    bars.createBar(scanbar)

    scanner.on('progress', () => {
      if (args.disableBars === false) {
        bars.incrementBar(scanbar, 1)
      }
    })

    scanner.on('start', (total: number) => {
      if (args.disableBars === false) {
        bars.startBar(scanbar, total, { message: 'scanning' })
      }
    })

    scanner.on('stop', () => {
      if (args.disableBars === false) {
        bars.stopBar(scanbar)
      }

      bars.removeBar(scanbar)
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
