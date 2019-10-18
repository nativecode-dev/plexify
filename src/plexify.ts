import os from 'os'
import yargs, { Argv, Arguments, Options, PositionalOptions, CommandModule } from 'yargs'

import { PlexifyManager } from './PlexifyManager'

process.on('uncaughtException', (error: Error) => console.error(error))
process.on('unhandledRejection', (response: {} | null | undefined) => console.log(response))

interface OptionConvert {
  path: string
  rename: boolean
}

const ConvertCommand: CommandModule = {
  builder: (argv: Argv): Argv => {
    return argv
      .positional<string, PositionalOptions>('path', {
        desc: 'path to files',
        type: 'string',
      })
      .option<string, Options>('rename', {
        boolean: true,
        default: false,
        type: 'boolean',
      })
  },
  handler: async (args: Arguments<{} & OptionConvert>): Promise<void> => {
    const manager = new PlexifyManager(args.path)
    const results = await manager.execute(os.hostname(), args.rename, os.cpus().length)
    console.log(results)
  },
}

const ListCommand: CommandModule = {
  builder: (argv: Argv): Argv => {
    return argv.positional<string, PositionalOptions>('path', {
      desc: 'path to files',
      type: 'string',
    })
  },
  handler: (args: Arguments<{}>): void => {
    console.log(args)
  },
}

yargs
  .scriptName('plexify')
  .usage('usage: $0 <command>')
  .command('convert <path> [options]', 'convert video files to standard format', ConvertCommand)
  .command('list <path>', 'list video files and states', ListCommand)
  .demandCommand()
  .showHelpOnFail(true)
  .parse()
