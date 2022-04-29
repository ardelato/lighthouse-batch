import lighthouse from "lighthouse";
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';
import { Logger } from "tslog";

const log = new Logger({});

export default class LightHouseRunner {
  private static runID: number = 0;
  static outputDir: string;
  options = {
    logLevel: 'error',
    output: 'json',
  };
  configPath: string
  url: string;
  outputFileName: string;
  fullPathOutputFileName: string;

  constructor (outputDir: string, url: string, port: number, formFactor: 'desktop' | 'mobile', verbose = false) {
    if (!LightHouseRunner.outputDir) {
      LightHouseRunner.outputDir = outputDir
    }
    if(!this.reportDirectoryExists() ) {
      this.makeReportDirectory();
    }
    if (verbose) {
      this.options.logLevel = 'info'
    }
    this.configPath = this.getConfigPath(formFactor);
    this.url = url
    this.options["port"] = port;

    this.outputFileName = this.getSiteName(url);

    LightHouseRunner.runID += 1

    this.fullPathOutputFileName = `${LightHouseRunner.outputDir}/${this.outputFileName}_report_${formFactor}_${LightHouseRunner.runID}.json`
  }

  public async start() {
    try {
      log.info(`Running Lighthouse on ${this.url}`)
      const results = await lighthouse(this.url, this.options, require(this.configPath))

      log.info(`Writing Results to ${this.fullPathOutputFileName}`)
      writeFileSync(this.fullPathOutputFileName, results.report);
    } catch (e) {
      log.error(new Error(`Failed to Run Lighthouse on ${this.url} \n${e}`))
      throw e
    }
  }

  public static resetRunID() {
    LightHouseRunner.runID = 0
  }

  private makeReportDirectory() {
    try {
        exec(`mkdir -p ${LightHouseRunner.outputDir}`)
    } catch(e: any) {
      throw new Error(e);
    }
  }

  private reportDirectoryExists(): boolean {
    return existsSync(LightHouseRunner.outputDir)
  }

  private getSiteName(url: string): string{
    return url.replace(/(?:^https?:\/\/)(?:www\.)?(?<domain>[a-z0-9\-\.]+)(?:\.[a-z\.]+)(?<path>[\/]?.*)/,'$<domain>$<path>').replace(/[\/\?#:\*\$@\!\.\+]/g, '-')
  }

  private getConfigPath(formFactor: 'desktop' | 'mobile'): string {
    return resolve(`./config/lr-${formFactor}-config.js`)
  };
}