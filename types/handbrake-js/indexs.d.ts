declare module 'handbrake-js' {
  import { EventEmitter } from 'events'

  export enum HandbrakeRotation {
    None = 0,
    '90degrees' = 90,
    '180degrees' = 180,
    '270degrees' = 270,
  }

  export interface HandbrakeOptions {
    'all-audio'?: boolean
    'audio-lang-list'?: string
    input: string
    optimize?: boolean
    output: string
    preset: string
    rotate?: HandbrakeRotation
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
