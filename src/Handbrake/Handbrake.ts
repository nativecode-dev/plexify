import deepmerge from 'deepmerge'

import { spawn, HandbrakeOptions } from 'handbrake-js'

import { HandbrakeEvent } from './HandbrakeEvent'

export interface EncodeResults {
  filename: string
  output: string[]
  success: boolean
}

export const DefaultHandbrakeOptions: Partial<HandbrakeOptions> = {
  optimize: true,
  preset: 'Normal',
  subtitle: 'scan',
}

export class Handbrake {
  private readonly options: HandbrakeOptions

  constructor(handbrakeOptions: Partial<HandbrakeOptions> = {}) {
    this.options = deepmerge.all<HandbrakeOptions>([DefaultHandbrakeOptions, handbrakeOptions], { clone: true })
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

      const child = spawn(options)
        .on(HandbrakeEvent.Cancelled, () => {
          results.success = false
          errored = true
          child.emit('SIGINT')
          reject(results)
        })
        .on(HandbrakeEvent.Complete, () => {
          results.success = errored === false
          resolve(results)
        })
        .on(HandbrakeEvent.Error, (error: Error) => {
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
