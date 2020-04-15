import os from 'os'

import { fs } from '@nofrills/fs'
import { Throttle } from '@nnode/common'
import { MultiBar, Presets } from 'cli-progress'
import { CommandModule, Arguments, CommandBuilder } from 'yargs'

import { StreamFile } from '../StreamFile'
import { MediaScanner } from '../MediaScanner'
import { MediaConverter } from '../MediaConverter'
import { StreamProgress } from '../StreamProgress'
import { ConvertOptions } from '../Options/ConvertOptions'

export class ConvertCommand implements CommandModule<{}, ConvertOptions> {
  aliases = ['convert']
  command = 'convert <path> [filenames..]'

  builder: CommandBuilder<{}, ConvertOptions> = {
    dryrun: {
      alias: 'd',
      default: false,
      type: 'boolean',
    },
    minutes: {
      alias: 'a',
      default: 120,
      type: 'number',
    },
    rename: {
      alias: 'm',
      default: true,
      type: 'boolean',
    },
    reverse: {
      alias: 'r',
      default: false,
      type: 'boolean',
    },
    processors: {
      alias: 'p',
      default: os.cpus().length,
      type: 'number',
    },
  }

  handler = async (args: Arguments<ConvertOptions>) => {
    const bars = new MultiBar(
      {
        format: '[{bar} {percentage}%] ETA: {eta_formatted} - {filename}',
        stopOnComplete: true,
      },
      Presets.shades_classic,
    )

    const scanner = new MediaScanner()
    const scanned_results = await scanner.scan(args.path, args.minutes, args.reverse)

    const filter = (results: StreamFile[]) => {
      return results.filter((scanned) =>
        args.filenames.reduce((result, current) => {
          if (scanned.filename.endsWith(current)) {
            return true
          }

          return result
        }, false),
      )
    }

    const files = args.filenames.length > 0 ? filter(scanned_results) : scanned_results

    let current = 0

    const payload = { filename: args.path }
    const filebar = bars.create(files.length, current, payload)

    filebar.start(files.length, current, payload)

    await Throttle(
      files.map((stream_file) => async () => {
        const conversion = bars.create(100, 0, { filename: fs.basename(stream_file.filename) })
        const converter = new MediaConverter()

        const handle_progress = (progress: StreamProgress) => {
          conversion.update(progress.percent, { filename: fs.basename(stream_file.filename) })
          filebar.update(current)
        }

        const handle_start = () => conversion.start(100, 0, { filename: stream_file.filename })

        const handle_stop = () => {
          current++
          bars.remove(conversion)
        }

        converter.on('start', handle_start)
        converter.on('stop', handle_stop)
        converter.on('progress', handle_progress)

        try {
          await converter.convert(stream_file, args.rename, args.dryrun)
        } catch (error) {
          throw error
        } finally {
          converter.off('progress', handle_progress)
          converter.off('stop', handle_stop)
          converter.off('start', handle_start)
        }

        filebar.increment(1)
      }),
      args.processors,
    )

    filebar.stop()
  }
}
