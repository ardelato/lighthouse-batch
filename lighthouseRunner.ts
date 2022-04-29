import lighthouse from "lighthouse";
import { existsSync } from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';

export default class LightHouseRunner {
  static outputDir: string;
  options = {
    logLevel: 'info',
    output: 'json',
  };
  configPath: string
  url: string;

  constructor (outputDir: string, url: string, port: number, formFactor: 'desktop' | 'mobile') {
    if (!LightHouseRunner.outputDir) {
      LightHouseRunner.outputDir = outputDir
    }
    if(!this.reportDirectoryExists() ) {
      this.makeReportDirectory();
    }
    this.configPath = this.getConfigPath(formFactor);
    this.url = url
    this.options['port'] = port;
  }

  public async start() {
    const results = await lighthouse(this.url, this.options, require(this.configPath))
    console.log(JSON.stringify(results,null,2))
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

  private getSiteName(): string{
    return this.url.replace(/(?:^https?:\/\/)(?:www\.)?(?<domain>[a-z0-9\-\.]+)(?:\.[a-z\.]+)(?<path>[\/]?.*)/,'$<domain>$<path>').replace(/[\/\?#:\*\$@\!\.\+]/g, '-')
  }

  private getConfigPath(formFactor: 'desktop' | 'mobile'): string {
    return resolve(`./config/lr-${formFactor}-config.js`)
  };
}