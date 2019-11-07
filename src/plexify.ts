import * as yargs from 'yargs'

import Logger from './Logger'

import ConvertCommand, { ConvertOptions } from './commands/ConvertCommand'
import ListCommand, { ListOptions } from './commands/ListCommand'

process.on('uncaughtException', (error: Error) => console.error(error))
process.on('unhandledRejection', (response: {} | null | undefined) => console.error(response))

async function main() {
  const result = yargs
    .scriptName('plexify')
    .usage('usage: $0 <command>')
    .command<ConvertOptions>(ConvertCommand)
    .command<ListOptions>(ListCommand)
    .demandCommand()
    .showHelpOnFail(true)
    .completion()
    .parse()

  Logger.trace(result)
}

main().catch(console.error)
