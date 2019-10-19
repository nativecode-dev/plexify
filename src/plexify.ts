import * as yargs from 'yargs'

import Logger from './Logger'

import ConvertCommand, { ConvertCommandOptions } from './commands/ConvertCommand'
import ListCommand, { ListCommandOptions } from './commands/ListCommand'

process.on('uncaughtException', (error: Error) => console.error(error))
process.on('unhandledRejection', (response: {} | null | undefined) => console.error(response))

async function main() {
  const result = yargs
    .scriptName('plexify')
    .usage('usage: $0 <command>')
    .command<ConvertCommandOptions>(ConvertCommand)
    .command<ListCommandOptions>(ListCommand)
    .demandCommand()
    .showHelpOnFail(true)
    .completion()
    .parse()

  Logger.trace(result)
}

main().catch(console.error)
