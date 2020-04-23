import { fs } from '@nofrills/fs'

import { ConfigurationOptions } from './Options/ConfigurationOptions'

const DefaultConfigurationOptions: ConfigurationOptions = {
  couchdb: {
    adapter: process.env.COUCHDB_ADAPTER || 'http',
    auth: {
      login: process.env.COUCHDB_LOGIN || 'admin',
      password: process.env.COUCHDB_PASSWORD || '',
    },
    url: process.env.COUCHDB_HOST || 'http://localhost',
  },
}

export class Configuration<T extends ConfigurationOptions> {
  private readonly configpath: string

  constructor(path: string = process.cwd(), name: string) {
    this.configpath = fs.join(path, name)
  }

  async load(): Promise<ConfigurationOptions> {
    if (await fs.exists(this.configpath)) {
      return fs.json<ConfigurationOptions>(this.configpath)
    }

    return DefaultConfigurationOptions
  }

  async save(configuration: ConfigurationOptions): Promise<void> {
    await fs.save(this.configpath, configuration)
  }
}
