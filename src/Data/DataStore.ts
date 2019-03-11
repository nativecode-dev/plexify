import { createClient, ClientOpts, RedisClient } from 'redis'

export class DataStore {
  private readonly client: RedisClient

  constructor(options: ClientOpts) {
    this.client = createClient(options)
  }

  delete(key: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const handler = (error: Error | null, value: number) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }
      this.client.expire(key, 0, handler)
    })
  }

  get<T>(key: string): Promise<T | null> {
    return new Promise<T | null>((resolve, reject) => {
      const handler = (error: Error | null, value: string) => {
        if (error) {
          reject(error)
        } else if (value && value !== '') {
          resolve(JSON.parse(value))
        } else {
          resolve(null)
        }
      }
      this.client.get(key, handler)
    })
  }

  set<T>(key: string, value: T): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const handler = (error: Error | null, value: string) => {
        if (error) {
          reject(error)
        }

        resolve(value === 'OK')
      }
      this.client.set(key, JSON.stringify(value), handler)
    })
  }
}
