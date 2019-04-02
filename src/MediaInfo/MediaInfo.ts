import { exec, ExecOptions } from 'child_process'

import { Logger } from '../Logging'
import { MediaInfoOptions } from './MediaInfoOptions'

export const DefaultMediaInfoOptions: MediaInfoOptions = {
  bom: true,
  exe: '/usr/bin/mediainfo',
  full: false,
  maxBufferSize: 1024 * 1024 * 10,
}

export class MediaInfo {
  private readonly log = Logger.extend('medainfo')
  private readonly options: MediaInfoOptions

  constructor(private readonly mediaInfoOptions?: MediaInfoOptions) {
    this.options = { ...DefaultMediaInfoOptions, ...mediaInfoOptions }
  }

  async videoFormat(filename: string): Promise<string> {
    const output = await this.exec(filename, '--Inform="Video;%Format%"')
    return output.join('')
  }

  async videoProfileFormat(filename: string): Promise<string> {
    const output = await this.exec(filename, '--Inform="Video;%Format_Profile%"')
    return output.join('')
  }

  protected exec(filename: string, ...args: string[]): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const argopts = [...args]
      this.configureOptions(args, argopts)

      const command = [this.options.exe, ...argopts, `"${filename}"`].join(' ')
      this.log.debug(command)

      const options: ExecOptions = {
        maxBuffer: this.options.maxBufferSize,
        windowsHide: true,
      }

      exec(command, options, (error, stdout) => {
        if (error) {
          this.log.error(error)
          resolve([])
        } else {
          resolve(this.split(stdout))
        }
      })
    })
  }

  private configureOptions(args: string[], opts: string[]): void {
    const pushBOM = args.every(opt => opt.toUpperCase() !== '--BOM')
    const pushDetails = args.every(opt => opt.toUpperCase().startsWith('--DETAILS=') === false)
    const pushFull = args.every(opt => opt.toUpperCase() !== '--FULL')
    const pushInform = args.every(opt => opt.toUpperCase().startsWith('--INFORM') === false)
    const pushLanguage = args.every(opt => opt.toUpperCase().startsWith('--LANGUAGE=') === false)
    const pushOutput = args.every(opt => opt.toUpperCase().startsWith('--OUTPUT=') === false)
    const hasVersion = args.some(opt => opt === '--Version')

    // if (this.options.bom && pushBOM && hasVersion === false) {
    //   opts.push('--BOM')
    // }

    if (this.options.full && pushFull && hasVersion === false) {
      opts.push('--Full')
    }

    if (this.options.inform && pushInform) {
      opts.push(`--Inform=${this.options.inform}`)
    }

    if (this.options.details && pushDetails && hasVersion === false) {
      opts.push(`--Details=${this.options.details}`)
    }

    if (this.options.language && pushLanguage && hasVersion === false) {
      opts.push(`--Language=${this.options.language}`)
    }

    if (this.options.output && pushOutput && hasVersion === false) {
      opts.push(`--Output=${this.options.output}`)
    }
  }

  private split(text: string): string[] {
    return text
      .replace('\r\n', '\n')
      .split('\n')
      .map(x => x.trim())
      .filter(x => x !== '')
  }
}
