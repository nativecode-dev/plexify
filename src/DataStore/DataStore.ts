import { createClient, RedisClient } from 'redis'

import { DataStoreOptions } from './DataStoreOptions'

const DefaultOptions: DataStoreOptions = {
  host: 'localhost',
  port: 6379,
}

export class DataStore {
  private readonly options: DataStoreOptions
  private readonly redis: RedisClient

  constructor(private readonly dataStoreOptions?: Partial<DataStoreOptions>) {
    this.options = { ...DefaultOptions, ...dataStoreOptions }
    this.redis = createClient({
      host: this.options.host,
      port: this.options.port,
    })

    this.redis.on('error', () => console.log)
  }

  exists(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.redis.exists(key, (error, count) => {
        if (error) {
          reject(error)
        } else if (count > 0) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  keys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.redis.keys(pattern, (error, values) => {
        if (error) {
          reject(error)
        } else {
          resolve(values)
        }
      })
    })
  }

  getJson<T>(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.redis.get(key, (error, value) => {
        if (error) {
          reject(error)
        } else {
          resolve(JSON.parse(value))
        }
      })
    })
  }

  setJson<T>(key: string, instance: T): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const value = JSON.stringify(instance)
      this.redis.set(key, value, (error, ok) => {
        if (error) {
          reject(error)
        } else if (ok === 'OK') {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }
}
