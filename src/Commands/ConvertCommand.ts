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
    dryrun: {
      default: false,
      type: 'boolean',
    },
    format: {
      default: '{dirname}/{basename}.mp4',
      type: 'string',
    },
    minutes: {
      default: 120,
      type: 'number',
    },
    reverse: {
      default: false,
      type: 'boolean',
    },
    preset: {
      default: 'normal',
      type: 'string',
    },
    processors: {
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
      //
    } else {
      const scanned = await this.scan(args, bars)
      await this.transcode(args, bars, scanned)
    }
  }
}
