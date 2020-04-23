import { CommandModule, CommandBuilder } from 'yargs'

export class ConfigureCommand implements CommandModule<{}, {}> {
  aliases = ['configure', 'config', 'cfg']
  command = 'configure'

  builder: CommandBuilder<{}, {}> = {
    host: {
      default: 'http://localhost:5984',
      type: 'string',
    },
  }

  handler = async () => {}
}
