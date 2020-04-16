import { MultiBar, SingleBar, Presets } from 'cli-progress'

import { PlexifyOptions } from './Options/PlexifyOptions'

export class BarManager {
  private readonly bars: Map<string, SingleBar> = new Map()

  private multibar: MultiBar

  constructor(
    private readonly options: PlexifyOptions,
    private readonly format: string = '[{bar} {percentage}%] ETA: {eta_formatted} - {message}',
  ) {
    this.initialize()
  }

  initialize() {
    if (this.options.disableBars) {
      return
    }

    this.multibar = new MultiBar(
      {
        format: this.format,
        stopOnComplete: true,
      },
      Presets.shades_classic,
    )
  }

  createBar(name: string) {
    if (this.options.disableBars) {
      return
    }

    const bar = this.multibar.create(100, 0, {})
    this.bars.set(name, bar)
  }

  incrementBar(name: string, value: number = 1) {
    if (this.options.disableBars) {
      return
    }

    const bar = this.bars.get(name)

    if (bar) {
      bar.increment(value)
    }
  }

  removeBar(name: string) {
    if (this.options.disableBars) {
      return
    }

    const bar = this.bars.get(name)

    if (bar) {
      this.multibar.remove(bar)
    }

    this.bars.delete(name)
  }

  startBar(name: string, total: number, payload: any = {}) {
    if (this.options.disableBars) {
      return
    }

    const bar = this.bars.get(name)

    if (bar) {
      bar.start(total, 0, payload)
    }
  }

  stopBar(name: string) {
    if (this.options.disableBars) {
      return
    }

    const bar = this.bars.get(name)

    if (bar) {
      bar.stop()
    }
  }

  updateBar(name: string, value: number, payload: any = {}) {
    if (this.options.disableBars) {
      return
    }

    const bar = this.bars.get(name)

    if (bar) {
      bar.update(value, payload)
    }
  }
}
