import { createClient, ClientOpts, RedisClient } from 'redis'

import { Logger } from '../logging'

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
          Logger.debug(`[REDIS:DELETE] ${key} ${value}`)
          resolve()
        }
      }
      this.client.expire(key, 0, handler)
    })
  }

  get<T>(key: string): Promise<T | null> {
    return new Promise<T | null>((resolve, reject) => {
      this.client.get(key, (error: Error | null, value: string) => {
        if (error) {
          reject(error)
        } else if (value && value !== '') {
          Logger.debug(`[REDIS:GET] ${key} ${value}`)
          try {
            Logger.debug(value)
            resolve(JSON.parse(value))
          } catch (e) {
            reject(e)
          }
        } else {
          resolve(null)
        }
      })
    })
  }

  set<T>(key: string, value: T): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.client.set(key, JSON.stringify(value), (error: Error | null, value: string) => {
        if (error) {
          reject(error)
        } else {
          Logger.debug(`[REDIS:SET] ${key} ${value}`)
          resolve(value === 'OK')
        }
      })
    })
  }
}
