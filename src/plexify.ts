import * as Throttle from 'promise-parallel-throttle'

import { fs } from '@nofrills/fs'
import { scheduleJob, RecurrenceRule, Job } from 'node-schedule'

import { GetFileEncodeInfo, EncodeFile } from './Converter/Converter'
import { PlexifyOptions } from './Options/PlexifyOptions'
import { Storage } from './plexifydb'
import { PlexifyDryRun, PlexifyMountPoint, PlexifyPreset, PlexifyRedis } from './env'
import { ConverterInfo } from './Converter/ConverterInfo'

const MediaFileExtensions: string[] = ['avi', 'mkv', 'mp4', 'wmv']
const MediaFileGlobs: string[] = MediaFileExtensions.map(ext => `**/*.${ext}`)

const DefaultPliexifyOptions: PlexifyOptions = {
  dryrun: PlexifyDryRun,
  mount: PlexifyMountPoint,
  preset: PlexifyPreset,
  redis: PlexifyRedis,
}

async function ConvertFile(options: PlexifyOptions, sourcefile: string): Promise<string> {
  const targetfile = `${sourcefile}.processing`
  const tempfile = `${targetfile}.tmp`
  const lock = `lock-${sourcefile}`

  const lockfile = await Storage.get<boolean>(lock)

  if (lockfile !== null) {
    return sourcefile
  }

  await Storage.set<boolean>(lock, true)

  let info = await Storage.get<ConverterInfo>(sourcefile)

  if (info === null) {
    info = await GetFileEncodeInfo(sourcefile)
    await Storage.set<ConverterInfo>(sourcefile, info)
  }

  if (await fs.exists(targetfile)) {
    await fs.delete(targetfile)
  }

  try {
    if (info.converted === false && options.dryrun === false) {
      console.log(`[CONVERT] ${sourcefile} [${options.preset}]`)
      const result = await EncodeFile(sourcefile, targetfile)

      if (result.success) {
        if ((await fs.rename(sourcefile, tempfile)) === false) {
          throw Error(`failed to rename ${sourcefile} to ${tempfile}`)
        }

        if ((await fs.rename(targetfile, sourcefile)) === false) {
          throw Error(`failed to rename ${targetfile} to ${sourcefile}`)
        }

        if ((await fs.delete(tempfile)) === false) {
          throw Error(`failed to delete ${tempfile}`)
        }

        info.converted = true
        await Storage.set<ConverterInfo>(sourcefile, info)
      }
    } else if (info.converted === false && options.dryrun) {
      console.log(`[CONVERT-DRYRUN] ${sourcefile}`)
    }
  } finally {
    if (await fs.exists(tempfile)) {
      await fs.delete(tempfile)
    }

    await Storage.delete(lock)
    return sourcefile
  }
}

async function ConvertFiles(options: PlexifyOptions): Promise<void> {
  console.log(`[SCANNING] ${options.mount}`)
  const globs = await fs.globs(MediaFileGlobs, options.mount)

  console.log(`[PROCESSING] ${globs.length.toLocaleString()} files from ${options.mount}`)
  const converters = globs.map(sourcefile => () => ConvertFile(options, sourcefile))

  const ThrottleOptions: Throttle.Options<string> = {
    maxInProgress: 5,
  }

  await Throttle.all(converters, ThrottleOptions)
}

async function Main(options: PlexifyOptions): Promise<Job> {
  console.log(JSON.stringify(options, null, 2))

  const displayNextInvocation = (rule: RecurrenceRule, date?: Date): Date => {
    const now = date || new Date()
    const next = rule.nextInvocationDate(now)
    console.log(`[NEXT] ${next.toLocaleString()}`)
    return next
  }

  const rule: RecurrenceRule = new RecurrenceRule()
  let running = false

  return new Promise<Job>(resolve => {
    displayNextInvocation(rule)

    const job = scheduleJob('process-conversions', rule, async () => {
      if (running) {
        return
      }

      running = true

      try {
        console.log(`[RUNNING] ${job.name}`)
        await ConvertFiles(options)
        displayNextInvocation(rule)
      } finally {
        running = false
      }
    })

    process.on('SIGTERM', () => {
      console.log('[SIGTERM]')
      job.cancel(false)
      resolve(job)
    })
  })
}

Main(DefaultPliexifyOptions).catch(console.log)
