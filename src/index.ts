import yargs from 'yargs'

import { fs } from '@nofrills/fs'

import { Logger } from './Logger'
import { DefaultCommand } from './Commands/DefaultCommand'
import { DefaultOptions } from './Options/DefaultOptions'
import { Configuration } from './Configuration'

async function main() {
  const filepath = fs.join(process.env.HOME || process.cwd(), '.config')
  const configuration = new Configuration(filepath, 'plexify.json')
  const config = await configuration.load()

  const args = yargs
    .scriptName('plexify')
    .command<DefaultOptions>(new DefaultCommand())
    .config(fs.join(filepath, 'plexify.json'))
    .parse()

  Logger.trace(args)

  await configuration.save(config)
}

main().catch(console.error)
