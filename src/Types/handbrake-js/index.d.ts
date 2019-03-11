declare module 'handbrake-js' {
  import { EventEmitter } from 'events'

  export interface HandbrakeOptions {
    'all-audio'?: boolean
    'audio-lang-list'?: string
    input: string
    optimize?: boolean
    output: string
    preset: string
    rotate?: number
    subtitle?: string
  }

  export type HandbrakeExecDone = (...args: any[]) => void

  export function exec(options: HandbrakeOptions, done: HandbrakeExecDone): void

  export function spawn(options: HandbrakeOptions): Handbrake

  export class Handbrake extends EventEmitter {
    constructor()

    cancel(): void
  }
}
