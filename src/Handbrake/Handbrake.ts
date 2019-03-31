import { spawn, HandbrakeOptions } from 'handbrake-js'

import { Logger } from '../Logging'
import { HandbrakeEvent } from './HandbrakeEvent'

export interface EncodeResults {
  filename: string
  output: string[]
  success: boolean
}

export const DefaultHandbrakeOptions: HandbrakeOptions = {
  'all-audio': true,
  'audio-lang-list': 'und',
  optimize: true,
  input: '',
  output: '',
  preset: 'Fast 1080p30',
  subtitle: 'scan',
}

export class Handbrake {
  private readonly log = Logger.extend('handbrake')
  private readonly options: HandbrakeOptions

  constructor(handbrakeOptions?: Partial<HandbrakeOptions>) {
    this.options = { ...DefaultHandbrakeOptions, ...handbrakeOptions } as HandbrakeOptions
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
      this.log.debug(options)
      spawn(options)
        .on(HandbrakeEvent.Cancelled, () => {
          this.log.info(`Encoding ${source} cancelled`)
          results.success = false
          errored = true
          reject(results)
        })
        .on(HandbrakeEvent.Complete, () => {
          this.log.info(`Encoding ${source} completed`)
          results.success = errored
          resolve(results)
        })
        .on(HandbrakeEvent.Error, (error: Error) => {
          this.log.info(`Encoding ${source} errored: ${error}`)
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
