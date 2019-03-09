import json_mediainfo from 'json-mediainfo'
import { spawn, HandbrakeOptions } from 'handbrake-js'

import { MediaInfo } from '../MediaInfo/MediaInfo'
import { HandbrakeProgress } from '../Handbrake/HandbrakeProgress'
import { HandbrakeEvent } from '../Handbrake/HandbrakeEvent'
import { ConverterQueueItem } from './ConverterQueueItem'

export function ConsoleOutput(buffer: Buffer): void {
  const lines = buffer.toString().split('\n')
  lines.forEach(line => console.log(line))
}

export function ConsoleProgress(filename: string, progress: HandbrakeProgress): void {
  console.log(`Task: ${progress.task} ${filename}: ${progress.percentComplete.toFixed(2)}%`)
}

export async function GetFileEncodeInfo(filename: string): Promise<ConverterQueueItem> {
  try {
    const info = await GetMediaInfo(filename)

    return {
      converted: info.video.some(vid => vid.profile !== 'High@L4'),
      filename,
    }
  } catch {
    return {
      converted: true,
      filename,
    }
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

export function EncodeFile(source: string, target: string): Promise<boolean> {
  const options: HandbrakeOptions = {
    input: 'src/data/brettrossi.17.01.21.brett.rossi.interview.turns.naughty.mp4',
    output: 'src/data/brettrossi.17.01.21.brett.rossi.interview.turns.naughty.mp4~',
    preset: 'Fast 1080p30',
  }

  return new Promise<boolean>((resolve, reject) => {
    spawn(options)
      .on(HandbrakeEvent.Cancelled, () => reject(false))
      .on(HandbrakeEvent.Complete, () => resolve(true))
      .on(HandbrakeEvent.Error, () => reject(false))
      .on(HandbrakeEvent.Progress, (progress: HandbrakeProgress) => ConsoleProgress(target, progress))
  })
}
