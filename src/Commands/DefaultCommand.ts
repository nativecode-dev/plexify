import { CommandModule, Argv, Arguments } from 'yargs'

import { InfoCommand } from './InfoCommand'
import { ScanCommand } from './ScanCommand'
import { ConvertCommand } from './ConvertCommand'
import { DefaultOptions } from '../Options/DefaultOptions'

import { getAvailableCodecs, getAvailableEncoders, getAvailableFormats } from '../MediaFunctions'
import { WatchCommand } from './WatchCommand'

export class DefaultCommand implements CommandModule<{}, DefaultOptions> {
  command = '$0 [command]'

  builder = (args: Argv<{}>): Argv<DefaultOptions> => {
    return args
      .positional('command', {
        choices: ['convert', 'info', 'scan'],
        type: 'string',
      })
      .option('codecs', {
        default: false,
        type: 'boolean',
      })
      .option('encoders', {
        default: false,
        type: 'boolean',
      })
      .option('formats', {
        default: false,
        type: 'boolean',
      })
      .command(new ConvertCommand())
      .command(new ScanCommand())
      .command(new InfoCommand())
      .command(new WatchCommand())
  }

  handler = async (args: Arguments<DefaultOptions>) => {
    if (args.codecs) {
      const codecs = await getAvailableCodecs()

      Object.keys(codecs)
        .sort()
        .forEach((key) => console.log(key, codecs[key].description))
    }

    if (args.encoders) {
      const encoders = await getAvailableEncoders()

      Object.keys(encoders)
        .sort()
        .forEach((key) => console.log(key, encoders[key].description))
    }

    if (args.formats) {
      const formats = await getAvailableFormats()

      Object.keys(formats)
        .sort()
        .forEach((key) => console.log(key, formats[key].description))
    }
  }
}
