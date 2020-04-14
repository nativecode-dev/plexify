import os from 'os'

export class MediaError extends Error {
  readonly stdout: string[]
  readonly stderr: string[]

  constructor(stdout: string, stderr: string, error: string) {
    super(error)
    this.stdout = stdout.split(os.EOL)
    this.stderr = stderr.split(os.EOL)
  }
}
