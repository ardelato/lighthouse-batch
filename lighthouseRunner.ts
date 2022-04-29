import lighthouse from "lighthouse";
import { existsSync, fsyncSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';
import { Logger } from "tslog";

const log = new Logger({});

export default class LightHouseRunner {
  static outputDir: string;
  options = {
    logLevel: 'error',
    output: 'json',
  };
  configPath: string
  url: string;
  outputFileName: string;

  constructor (outputDir: string, url: string, port: number, formFactor: 'desktop' | 'mobile') {
    if (!LightHouseRunner.outputDir) {
      LightHouseRunner.outputDir = outputDir
    }
    if(!this.reportDirectoryExists() ) {
      this.makeReportDirectory();
    }
    this.configPath = this.getConfigPath(formFactor);
    this.url = url
    this.outputFileName = this.getSiteName(url);
    this.options["port"] = port;
  }

  public async start() {
    try {
      const results = await lighthouse(this.url, this.options, require(this.configPath))
      writeFileSync(`${LightHouseRunner.outputDir}/${this.outputFileName}_report.json`, results.report);
    } catch (e) {
      log.error(`Failed to Run Lighthouse on ${this.url} \n${e}`)
    }
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