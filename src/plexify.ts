import * as Throttle from 'promise-parallel-throttle'

import { fs } from '@nofrills/fs'
import { scheduleJob, RecurrenceRule } from 'node-schedule'

import { CacheData } from './Cache/CacheData'
import { GetFileEncodeInfo, EncodeFile } from './Converter/Converter'
import { ConverterQueueItem } from './Converter/ConverterQueueItem'
import { LoadCache, SaveCache } from './Cache/CacheFunctions'

const AllowConversion: boolean = false
const MediaFileExtensions: string[] = ['avi', 'mkv', 'mp4']
const MediaFileGlobs: string[] = MediaFileExtensions.map(extension => `**/*.${extension}`)

export enum JobState {
  Idle = 'idle',
  Running = 'running',
}

async function ConvertFile(sourcefile: string, targetfile: string): Promise<void> {
  console.log(`[CONVERT] ${sourcefile}`)
  const success = await EncodeFile(sourcefile, targetfile)

  if (success) {
    const tempfile = `${sourcefile}.processing.tmp`
    await fs.rename(sourcefile, tempfile)
    await fs.rename(targetfile, sourcefile)
    await fs.delete(tempfile)
  }
}

async function ConvertFiles(directory: string, cache: CacheData): Promise<void> {
  console.log(`[SCANNING] ${directory}`)
  const globs = await fs.globs(MediaFileGlobs, directory)

  console.log(`[PROCESSING] ${directory}`)
  const converters = globs.map(sourcefile => async () => {
    const targetfile = `${sourcefile}.processing`

    try {
      if (await fs.exists(targetfile)) {
        return null
      }

      if (cache.converted.some(converted => converted === sourcefile)) {
        return null
      }

      const file = await GetFileEncodeInfo(sourcefile)

      if (file.converted === false && AllowConversion) {
        await ConvertFile(sourcefile, targetfile)
      }
    } catch {
      if (await fs.exists(targetfile)) {
        await fs.delete(targetfile)
      }
    }
  })

  const options: Throttle.Options<ConverterQueueItem> = {
    maxInProgress: 5,
  }

  await Throttle.all(converters, options)
}

async function Main(directory: string): Promise<void> {
  const rule: RecurrenceRule = new RecurrenceRule(null, null, null, 0, 0, null, null)

  let state: JobState = JobState.Idle

  // It's a promise that never resolves...
  return new Promise<void>(() => {
    console.log(rule.nextInvocationDate(new Date()))

    const job = scheduleJob('process-conversions', rule, async () => {
      if (state === JobState.Running) {
        console.log(`${job.name} already running`)
        return
      }

      console.log(`Running ${job.name}`)
      const cache = await LoadCache()

      state = JobState.Running
      await ConvertFiles(directory, cache)
      state = JobState.Idle

      SaveCache(cache)

      console.log(`Next run: ${rule.nextInvocationDate(new Date())}`)
    })
  })
}

Main('/mnt/other').catch(console.log)
