import { Arguments, CommandBuilder } from 'yargs'

import { BarManager } from '../BarManager'
import { BaseCommand } from './BaseCommand'
import { ScanOptions } from '../Options/ScanOptions'

export class ScanCommand extends BaseCommand<ScanOptions> {
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

  handler = async (args: Arguments<ScanOptions>) => {
    const bars = new BarManager(args)
    const results = await this.scan(args, bars)

    if (args.disableBars) {
      console.log(JSON.stringify(results))
    }
  }
}
