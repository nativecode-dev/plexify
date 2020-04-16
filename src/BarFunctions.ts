import { MultiBar, SingleBar } from 'cli-progress'

export function createBar(format: string = '[{bar} {percentage}%] ETA: {eta_formatted} - {message}') {
  return new SingleBar({ format })
}

export function createChildBar(bars: MultiBar, total: number = 100, start: number = 0, payload: any = {}) {
  return bars.create(total, start, payload)
}
