import * as Throttle from 'promise-parallel-throttle'

import { fs } from '@nofrills/fs'
import { scheduleJob, RecurrenceRule, Job } from 'node-schedule'
import { Stack } from 'stack-typescript'

import { CacheData } from './Data/CacheData'
import { GetFileEncodeInfo, EncodeFile } from './Converter/Converter'
import { LoadCache as RestoreCache, SaveCache } from './Data/CacheFunctions'
import { PlexifyOptions } from './Options/PlexifyOptions'

const MediaFileExtensions: string[] = ['avi', 'mkv', 'mp4']
const MediaFileGlobs: string[] = MediaFileExtensions.map(extension => `**/*.${extension}`)

const PlexifyEtcdHosts: string[] = process.env.PLEXIFY_ETCD_HOSTS
  ? process.env.PLEXIFY_ETCD_HOSTS.split(',')
  : ['localhost']

const PlexifyMountPoint: string = process.env.PLEXIFY_MOUNT_POINT || '/mnt/media'
const PlexifyPreset: string = process.env.PLEXIFY_PRESET || 'Fast 1080p30'
const PlexifyDryRun: boolean = process.env.PLEXIFY_DRY_RUN ? Boolean(process.env.PLEXIFY_DRY_RUN) : true

const DefaultPliexifyOptions: PlexifyOptions = {
  etcdHosts: PlexifyEtcdHosts,
  dryrun: PlexifyDryRun,
  mount: PlexifyMountPoint,
  preset: PlexifyPreset,
}

async function ConvertFile(options: PlexifyOptions, sourcefile: string, cache: CacheData): Promise<string> {
  const cachekey = Buffer.from(`/plexify/${sourcefile.replace('/', '_')}`).toString('base64')
  const targetfile = `${sourcefile}.processing`
  const tempfile = `${targetfile}.tmp`

  try {
    if (await fs.exists(targetfile)) {
      return
    }

    if (cache.processed.some(x => x.filename === sourcefile && x.converted)) {
      return
    }

    const file = await GetFileEncodeInfo(sourcefile)
    cache.processed.push(file)

    if (file.converted === false && options.dryrun === false) {
      console.log(`[CONVERT] ${sourcefile}`)
      const results = await EncodeFile(sourcefile, targetfile)

      if (results.success) {
        await fs.rename(sourcefile, tempfile)
        await fs.rename(targetfile, sourcefile)
        await fs.delete(tempfile)
      }
    } else if (file.converted === false && options.dryrun) {
      console.log(`[CONVERT-DRYRUN] ${sourcefile}`)
    }

    return sourcefile
  } catch {
    if (await fs.exists(targetfile)) {
      await fs.delete(targetfile)
    }

    if (await fs.exists(tempfile)) {
      await fs.delete(tempfile)
    }
  }
}

async function ConvertFiles(options: PlexifyOptions, directory: string, cache: CacheData): Promise<void> {
  console.log(`[SCANNING] ${directory}`)
  const globs = await fs.globs(MediaFileGlobs, directory)

  console.log(`[PROCESSING] ${globs.length.toLocaleString()} files from ${directory}`)
  const converters = globs.map(sourcefile => () => ConvertFile(options, sourcefile, cache))

  const ThrottleOptions: Throttle.Options<string> = {
    maxInProgress: 5,
    progressCallback: async result => {
      if (result.amountDone % 100 === 0) {
        await SaveCache(cache)
      }
    },
  }

  await Throttle.all(converters, ThrottleOptions)
}

async function Main(options: PlexifyOptions, directory: string): Promise<Job> {
  console.log(JSON.stringify(options, null, 2))

  const displayNextInvocation = (rule: RecurrenceRule, date?: Date): Date => {
    const now = date || new Date()
    const next = rule.nextInvocationDate(now)
    console.log(`[NEXT] ${next.toLocaleString()}`)
    return next
  }

  const rule: RecurrenceRule = new RecurrenceRule()
  const state: Stack<CacheData> = new Stack<CacheData>()

  return new Promise<Job>(resolve => {
    displayNextInvocation(rule)

    const job = scheduleJob('process-conversions', rule, async () => {
      if (state.size !== 0) {
        return
      }

      const cache = await RestoreCache()
      state.push(cache)
      console.log(`[RUNNING] ${job.name}`)

      try {
        await ConvertFiles(options, directory, cache)
        await SaveCache(cache)
        displayNextInvocation(rule)
      } finally {
        state.pop()
      }
    })

    process.on('SIGTERM', () => {
      console.log('[SIGTERM]')
      job.cancel(false)
      resolve(job)
    })
  })
}

Main(DefaultPliexifyOptions, '/mnt/media').catch(console.log)
