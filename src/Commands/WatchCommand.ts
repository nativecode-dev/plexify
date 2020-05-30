import { fs } from '@nofrills/fs'
import { Arguments, CommandBuilder } from 'yargs'
import { watch, WatchOptions as FileWatcherOptions } from 'chokidar'

import { BaseCommand } from './BaseCommand'
import { MediaScanner } from '../MediaScanner'
import { WatchOptions } from '../Options/WatchOptions'

function exit(cleanup: boolean, exit: boolean = false, exitCode: number = 0) {
  if (cleanup) {
    console.log('terminated')
  }

  if (exitCode !== 0) {
    process.exit(exitCode)
  }

  if (exit) {
    process.exit()
  }
}

export class WatchCommand extends BaseCommand<WatchOptions> {
  aliases = ['watch']
  command = 'watch [cwd] [extensions..]'

  builder: CommandBuilder<{}, WatchOptions> = {
    extensions: {
      default: MediaScanner.extensions.map((ext) => `.${ext}`),
      string: true,
      type: 'array',
    },
  }

  handler = (args: Arguments<WatchOptions>) => {
    const options: FileWatcherOptions = {
      atomic: true,
      cwd: args.cwd,
      followSymlinks: false,
      persistent: true,
    }

    const watcher = watch('.', options)
    console.log(`watching "${args.cwd}"`)

    watcher.on('ready', () => {
      console.log(`watching for file changes: ${args.extensions.join(', ')}...`)

      watcher.on('add', (path) => this.added(args, path))
      watcher.on('addDir', (path) => this.addedDir(args, path))
      watcher.on('change', (path) => this.changed(args, path))
      watcher.on('unlink', (path) => this.removed(args, path))
      watcher.on('unlinkDir', (path) => this.removedDir(args, path))
    })

    process.on('SIGINT', () => {
      console.log('')
      console.log('terminating...')
      exit(true, true, process.exitCode)
    })
  }

  private added(args: WatchOptions, path: string): Promise<void> {
    if (args.extensions.includes(fs.ext(path))) {
      this.log.debug('[added]', path)
    }
    return Promise.resolve()
  }

  private addedDir(args: WatchOptions, path: string): Promise<void> {
    this.log.debug('[addedDir]', path)
    return Promise.resolve()
  }

  private changed(args: WatchOptions, path: string): Promise<void> {
    if (args.extensions.includes(fs.ext(path))) {
      this.log.debug('[changed]', path)
    }
    return Promise.resolve()
  }

  private removed(args: WatchOptions, path: string): Promise<void> {
    if (args.extensions.includes(fs.ext(path))) {
      this.log.debug('[removed]', path)
    }
    return Promise.resolve()
  }

  private removedDir(args: WatchOptions, path: string): Promise<void> {
    this.log.debug('[removedDir]', path)
    return Promise.resolve()
  }
}
