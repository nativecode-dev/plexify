import yargs from 'yargs'

import { fs } from '@nofrills/fs'

import { Logger } from './Logger'

import { DefaultCommand } from './Commands/DefaultCommand'
import { DefaultOptions } from './Options/DefaultOptions'

async function main() {
  const filepath = fs.join(process.env.HOME || process.cwd(), '.config')

  const args = yargs
    .scriptName('plexify')
    .command<DefaultOptions>(new DefaultCommand())
    .config(fs.join(filepath, 'plexify.json'))
    .parse()

  Logger.trace(args)
}

main().catch(console.error)
