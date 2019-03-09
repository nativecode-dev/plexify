declare module 'handbrake-js' {
  import { EventEmitter } from 'events'

  export interface HandbrakeOptions {
    input: string
    output: string
    preset: string
    rotate?: number
  }

  export type HandbrakeExecDone = (...args: any[]) => void

  export function exec(options: HandbrakeOptions, done: HandbrakeExecDone): void

  export function spawn(options: HandbrakeOptions): Handbrake

  export class Handbrake extends EventEmitter {
    constructor()

    cancel(): void
  }
}
