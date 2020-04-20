import { CommandModule, Argv, Arguments } from 'yargs'

import { PlexifyOptions } from '../Options/PlexifyOptions'
import { InfoCommand } from './InfoCommand'
import { ScanCommand } from './ScanCommand'
import { ConvertCommand } from './ConvertCommand'

export class DefaultCommand implements CommandModule<{}, PlexifyOptions> {
  command = '$0 <command>'

  builder = (args: Argv<PlexifyOptions>) => {
    return args
      .positional('command', {
        choices: ['convert', 'info', 'scan'],
        type: 'string',
      })
      .command(new ConvertCommand())
      .command(new InfoCommand())
      .command(new ScanCommand())
  }

  handler = (args: Arguments<PlexifyOptions>) => {
    return
  }
}
