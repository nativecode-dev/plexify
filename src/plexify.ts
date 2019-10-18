import yargs, { Argv, Arguments, Options, PositionalOptions } from 'yargs'

process.on('uncaughtException', (error: Error) => console.error(error))
process.on('unhandledRejection', (response: {} | null | undefined) => console.log(response))

yargs
  .scriptName('plexify')
  .usage('usage: $0 <command>')
  .command('convert <path> [options]', 'convert video files to standard format', {
    builder: (argv: Argv): Argv => {
      return argv
        .positional<string, PositionalOptions>('path', {
          desc: 'path to files',
          type: 'string',
        })
        .option<string, Options>('execute', {
          boolean: true,
          default: false,
          type: 'boolean',
        })
        .option<string, Options>('rename', {
          boolean: true,
          default: false,
          type: 'boolean',
        })
    },
    handler: (args: Arguments): void => {
      console.log(args)
    },
  })
  .command('list <path>', 'list video files and states', {
    builder: (argv: Argv): Argv => {
      return argv.positional<string, PositionalOptions>('path', {
        desc: 'path to files',
        type: 'string',
      })
    },
    handler: (args: Arguments): void => {
      console.log(args)
    },
  })
  .demandCommand()
  .showHelpOnFail(true)
  .parse()
