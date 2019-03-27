import { spawn, HandbrakeOptions } from 'handbrake-js'
import { HandbrakeEvent } from './HandbrakeEvent'
import { Logger } from '../Logging'

export interface EncodeResults {
  filename: string
  output: string[]
  success: boolean
}

const DefaultOptions: Partial<HandbrakeOptions> = {
  'all-audio': true,
  'audio-lang-list': 'und',
  optimize: true,
  preset: 'Fast 1080p30',
  subtitle: 'scan',
}

export class Handbrake {
  private readonly options: HandbrakeOptions

  constructor(handbrakeOptions?: Partial<HandbrakeOptions>) {
    this.options = { ...DefaultOptions, ...handbrakeOptions } as HandbrakeOptions
  }

  encode(source: string, target: string): Promise<EncodeResults> {
    const results: EncodeResults = {
      filename: source,
      output: [],
      success: false,
    }

    const options: HandbrakeOptions = {
      ...this.options,
      ...{ input: source, output: target },
    }

    return new Promise((resolve, reject) => {
      let errored = false
      spawn(options)
        .on(HandbrakeEvent.Cancelled, () => {
          Logger.info(`Encoding ${source} cancelled`)
          results.success = false
          errored = true
          reject(results)
        })
        .on(HandbrakeEvent.Complete, () => {
          Logger.info(`Encoding ${source} completed`)
          results.success = errored
          resolve(results)
        })
        .on(HandbrakeEvent.Error, (error: Error) => {
          Logger.info(`Encoding ${source} errored: ${error}`)
          results.success = false
          errored = true
          reject(error)
        })
        .on(HandbrakeEvent.Output, (buffer: Buffer) => {
          const lines = this.split(buffer)
          results.output = results.output.concat(...lines)
        })
    })
  }

  private split(buffer: Buffer): string[] {
    return buffer
      .toString()
      .replace('\r', '')
      .split('\n')
  }
}
