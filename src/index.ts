import yargs from 'yargs'

import { Logger } from './Logger'
import { DefaultCommand } from './Commands/DefaultCommand'

const args = yargs.scriptName('plexify').command(new DefaultCommand()).config('~/.config/plexify.json').parse()

Logger.trace(args)
