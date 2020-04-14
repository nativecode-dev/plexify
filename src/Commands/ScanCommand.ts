import { CommandModule, Arguments, CommandBuilder } from 'yargs'

import { ScanOptions } from '../Options/ScanOptions'
import { MediaScanner } from '../MediaScanner'

export class ScanCommand implements CommandModule<{}, ScanOptions> {
  aliases = ['scan']
  command = 'scan <path> [minutes]'

  builder: CommandBuilder<{}, ScanOptions> = {
    reverse: {
      alias: 'r',
      default: false,
      type: 'boolean',
    },
  }

  handler = async (args: Arguments<ScanOptions>) => {
    const scanner = new MediaScanner()
    await scanner.scan(args.path, args.minutes, true)
  }
}
