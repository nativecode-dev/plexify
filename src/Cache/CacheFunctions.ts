import { fs } from '@nofrills/fs'

import { CacheData } from './CacheData'

const CacheDataFile = '~/plexify.cache.db'

export async function LoadCache(): Promise<CacheData> {
  const hasCache = await fs.exists(CacheDataFile)

  if (hasCache) {
    return fs.json<CacheData>(CacheDataFile)
  }

  return { converted: [] }
}

export async function SaveCache(cache: CacheData): Promise<void> {
  await fs.save(CacheDataFile, cache)
}
