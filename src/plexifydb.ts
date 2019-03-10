import { ClientOpts } from 'redis'

import { PlexifyRedis } from './env'
import { DataStore } from './Data/DataStore'

const options: ClientOpts = {
  host: PlexifyRedis,
  port: 6379,
}

export const Storage: DataStore = new DataStore(options)
