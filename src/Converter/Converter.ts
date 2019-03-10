import json_mediainfo from 'json-mediainfo'
import { spawn, HandbrakeOptions } from 'handbrake-js'

import { MediaInfo } from '../MediaInfo/MediaInfo'
import { HandbrakeEvent } from '../Handbrake/HandbrakeEvent'
import { ConverterInfo } from './ConverterInfo'

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
    converted: info.video.some(vid => vid.profile !== 'High@L4'),
    filename,
    media: info,
  }
}

export function GetMediaInfo(source: string): Promise<MediaInfo> {
  return new Promise<MediaInfo>((resolve, reject) => {
    json_mediainfo(source, (error: Error, info: any) => {
      if (error) {
        reject(error)
        return
      }
      resolve(info as MediaInfo)
    })
  })
}

export function EncodeFile(source: string, target: string): Promise<EncodeResults> {
  const options: HandbrakeOptions = {
    input: source,
    output: target,
    preset: 'Fast 1080p30',
  }

  const results: EncodeResults = {
    filename: source,
    output: [],
    success: false,
  }

  return new Promise<EncodeResults>((resolve, reject) => {
    spawn(options)
      .on(HandbrakeEvent.Cancelled, () => {
        console.log(`Encoding ${source} cancelled`)
        results.success = false
        reject(results)
      })
      .on(HandbrakeEvent.Complete, () => {
        console.log(`Encoding ${source} completed`)
        results.success = true
        resolve(results)
      })
      .on(HandbrakeEvent.Error, (error: Error) => {
        console.log(`Encoding ${source} errored: ${error}`)
        reject(error)
      })
      .on(HandbrakeEvent.Output, (buffer: Buffer) => {
        const lines = OutputLines(buffer)
        results.output = results.output.concat(lines)
      })
  })
}
