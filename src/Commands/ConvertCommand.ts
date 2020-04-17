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
      default: 120,
      type: 'number',
    },
    reverse: {
      alias: 'r',
      default: false,
      type: 'boolean',
    },
    dryrun: {
      alias: 'd',
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
    const bars = new BarManager(args)
    const scanned = await this.scan(args, bars)
    await this.transcode(args, bars, scanned)
  }
}
