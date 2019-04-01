import { createClient, RedisClient } from 'redis'

import { Logger } from '../Logging'
import { DataStoreOptions } from './DataStoreOptions'

export const DefaultDataStoreOptions: DataStoreOptions = {
  host: 'localhost',
  port: 6379,
}

export class DataStore {
  private readonly log = Logger.extend('datastore')
  private readonly options: DataStoreOptions
  private readonly redis: RedisClient

  constructor(private readonly dataStoreOptions?: Partial<DataStoreOptions>) {
    this.options = { ...DefaultDataStoreOptions, ...dataStoreOptions }
    this.redis = createClient({
      host: this.options.host,
      port: this.options.port,
    })

    this.redis.on('error', () => console.log)
    process.on('exit', () => this.redis.end(true))
  }

  exists(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.redis.exists(key, (error, count) => {
        if (error) {
          this.log.error(error)
          reject(error)
        } else if (count > 0) {
          this.log.debug(key, count)
          resolve(true)
        } else {
          this.log.debug(key, count)
          resolve(false)
        }
      })
    })
  }

  keys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.redis.keys(pattern, (error, values) => {
        if (error) {
          this.log.error(error)
          reject(error)
        } else {
          this.log.debug('keys', ...values)
          resolve(values)
        }
      })
    })
  }

  getJson<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.redis.get(key, (error, value) => {
        if (error) {
          this.log.error(error)
          reject(error)
        } else {
          const json = JSON.parse(value)
          this.log.debug(key, json)
          resolve(json)
        }
      })
    })
  }

  setJson<T>(key: string, instance: T): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const value = JSON.stringify(instance)
      this.redis.set(key, value, (error, ok) => {
        if (error) {
          this.log.error(error)
          reject(error)
        } else if (ok === 'OK') {
          this.log.debug(key, ok)
          resolve(true)
        } else {
          this.log.debug(key, ok)
          resolve(false)
        }
      })
    })
  }
}
