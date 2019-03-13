import { ClientOpts } from 'redis'

import { PlexifyRedisHost, PlexifyRedisPort } from './env'
import { DataStore } from './Data/DataStore'

const options: ClientOpts = {
  host: PlexifyRedisHost,
  port: PlexifyRedisPort,
}

export const Storage: DataStore = new DataStore(options)
