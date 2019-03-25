import { spawn, HandbrakeOptions } from 'handbrake-js'

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
}
