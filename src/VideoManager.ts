import { fs } from '@nofrills/fs'

export class VideoManager {
  constructor(private readonly paths: string[]) {}

  async lock(filename: string, owner: string): Promise<[string, boolean]> {
    if ((await fs.exists(filename)) === false) {
      return Promise.reject(`${filename} was not found`)
    }

    return Promise.resolve([owner, true])
  }

  async unlock(filename: string, owner: string): Promise<boolean> {
    if ((await fs.exists(filename)) === false) {
      return Promise.reject(`${filename} was not found`)
    }

    return Promise.resolve(true)
  }
}
