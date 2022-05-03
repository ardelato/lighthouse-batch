import lighthouse from 'lighthouse'
import {existsSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {exec} from 'node:child_process'
import {Logger} from 'tslog'

const log = new Logger({
  minLevel: 'error',
})

export default class LightHouseRunner {
  private static runID = 0;
  static outputDir: string;
  options = {
    logLevel: 'error',
    output: 'json',
    port: 0,
  };

  configPath: string
  url: string;
  outputFileName: string;
  fullPathOutputFileName: string;

  constructor(outputDir: string, url: string, port: number, formFactor: 'desktop' | 'mobile', verbose = false) {
    if (!LightHouseRunner.outputDir) {
      LightHouseRunner.outputDir = outputDir
    }

    if (!this.reportDirectoryExists()) {
      this.makeReportDirectory()
    }

    if (verbose) {
      this.options.logLevel = 'info'
      log.setSettings({
        minLevel: 'info',
      })
    }

    this.configPath = this.getConfigPath(formFactor)
    this.url = url
    this.options.port = port

    this.outputFileName = this.getSiteName(url)

    LightHouseRunner.runID += 1

    this.fullPathOutputFileName = `${LightHouseRunner.outputDir}/${this.outputFileName}_report_${formFactor}_${LightHouseRunner.runID}.json`
  }

  public async start() {
    try {
      log.info(`Running Lighthouse on ${this.url}`)
      const results = await lighthouse(this.url, this.options, require(this.configPath))

      log.info(`Writing Results to ${this.fullPathOutputFileName}`)
      writeFileSync(this.fullPathOutputFileName, results.report)
    } catch (error) {
      log.error(new Error(`Failed to Run Lighthouse on ${this.url} \n${error}`))
      throw error
    }
  }

  public static resetRunID() {
    LightHouseRunner.runID = 0
  }

  private makeReportDirectory() {
    try {
      exec(`mkdir -p ${LightHouseRunner.outputDir}`)
    } catch (error: any) {
      throw new Error(error)
    }
  }

  private reportDirectoryExists(): boolean {
    return existsSync(LightHouseRunner.outputDir)
  }

  private getSiteName(url: string): string {
    return url.replace(/^ht{2}ps?:\/{2}(?:w{3}\.)?(?<domain>[\d.a-z-]+)\.[.a-z]+(?<path>\/?.*)/, '$<domain>$<path>').replace(/[!#$*+./:?@]/g, '-')
  }

  private getConfigPath(formFactor: 'desktop' | 'mobile'): string {
    return resolve(`./config/lr-${formFactor}-config.js`)
  }
}
