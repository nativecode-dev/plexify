import os from 'os'

import { Arguments, CommandBuilder } from 'yargs'

import { BarManager } from '../BarManager'
import { BaseCommand } from './BaseCommand'
import { ConvertOptions } from '../Options/ConvertOptions'

export class ConvertCommand extends BaseCommand<ConvertOptions> {
  aliases = ['convert']
  command = 'convert <path> [filenames..]'

  builder: CommandBuilder<{}, ConvertOptions> = {
    'disable-bars': {
      default: false,
      type: 'boolean',
    },
    minutes: {
      alias: 'a',
      default: 0,
      type: 'number',
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
    'skip-scan': {
      default: false,
      type: 'boolean',
    },
  }

  handler = async (args: Arguments<ConvertOptions>) => {
    const bars = new BarManager(args)

    if (args.skipScan) {
      // Get all documents
    } else {
      const scanned = await this.scan(args, bars)
      await this.transcode(args, bars, scanned)
    }
  }
}
