import { fs } from '@nofrills/fs'

import { VideoManagerOptions } from './VideoManagerOptions'

export class VideoManager {
  constructor(private readonly options: VideoManagerOptions) {}

  async find(): Promise<string[]> {
    const patterns = this.options.paths.reduce((results, path) => {
      const patterns = this.options.extensions.map(extension => fs.join(path, `*.${extension}`))
      return [...results, ...patterns]
    }, [])

    return fs.globs(patterns)
  }
}
