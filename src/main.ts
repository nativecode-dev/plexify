import { fs } from '@nofrills/fs'
import { Throttle } from '@nnode/common'
import { MultiBar, Presets } from 'cli-progress'

import { MediaScanner } from './MediaScanner'
import { MediaConverter } from './MediaConverter'
import { StreamProgress } from './StreamProgress'

async function main(cwd: string, processors: number = 2) {
  const bars = new MultiBar(
    {
      format: '{bar} [ {percentage}% ] ETA: {eta_formatted} - {filename}',
      stopOnComplete: true,
    },
    Presets.shades_classic,
  )

  const scanner = new MediaScanner()

  const scanned_results = await scanner.scan(cwd, true)

  await Throttle(
    scanned_results.map((stream_file) => () => {
      const bar = bars.create(100, 0, {})
      const converter = new MediaConverter()
      converter.on('progress', (progress: StreamProgress) =>
        bar.update(progress.percent, { filename: fs.basename(stream_file.filename) }),
      )
      converter.on('stop', () => bars.remove(bar))
      return converter.convert(stream_file, true)
    }),
    processors,
  )
}

main(process.cwd()).catch(console.error)
