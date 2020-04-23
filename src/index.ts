import yargs from 'yargs'

import { Logger } from './Logger'
import { DefaultCommand } from './Commands/DefaultCommand'
import { DefaultOptions } from './Options/DefaultOptions'

const args = yargs
  .scriptName('plexify')
  .command<DefaultOptions>(new DefaultCommand())
  .config('~/.config/plexify.json')
  .parse()

Logger.trace(args)
