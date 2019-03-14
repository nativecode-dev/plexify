import mediainfo from 'mediainfo-parser'
import { spawn, HandbrakeOptions } from 'handbrake-js'

import { Logger } from '../logging'
import { ConverterInfo } from './ConverterInfo'
import { MediaInfo } from '../MediaInfo/MediaInfo'
import { HandbrakeEvent } from '../Handbrake/HandbrakeEvent'

export interface EncodeResults {
  filename: string
  output: string[]
  success: boolean
}

export function OutputLines(buffer: Buffer): string[] {
  return buffer
    .toString()
    .replace('\r', '')
    .split('\n')
}

export async function GetFileEncodeInfo(filename: string): Promise<ConverterInfo> {
  const info = await GetMediaInfo(filename)

  return {
    converted: info.file.track.some(x => x._type === 'video' && x.formatProfile !== 'High@L4'),
    filename,
    media: info,
  }
}

export function GetMediaInfo(source: string): Promise<MediaInfo> {
  return new Promise<MediaInfo>((resolve, reject) => {
    try {
      mediainfo(source, (error: Error, info: any) => {
        if (error) {
          Logger.error(`[ERROR-MEDIAINFO] ${source}`, error, info)
          reject(error)
        } else {
          resolve(info as MediaInfo)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

export function EncodeFile(source: string, target: string): Promise<EncodeResults> {
  const options: HandbrakeOptions = {
    'all-audio': true,
    'audio-lang-list': 'und',
    input: source,
    optimize: true,
    output: target,
    preset: 'Fast 1080p30',
    subtitle: 'scan',
  }

  const results: EncodeResults = {
    filename: source,
    output: [],
    success: false,
  }

  return new Promise<EncodeResults>((resolve, reject) => {
    let errored = false
    spawn(options)
      .on(HandbrakeEvent.Cancelled, () => {
        Logger.info(`Encoding ${source} cancelled`)
        results.success = false
        errored = true
        reject(results)
      })
      .on(HandbrakeEvent.Complete, () => {
        Logger.info(`Encoding ${source} completed`)
        results.success = errored
        resolve(results)
      })
      .on(HandbrakeEvent.Error, (error: Error) => {
        Logger.info(`Encoding ${source} errored: ${error}`)
        results.success = false
        errored = true
        reject(error)
      })
      .on(HandbrakeEvent.Output, (buffer: Buffer) => {
        const lines = OutputLines(buffer)
        results.output = results.output.concat(...lines)
      })
  })
}
