import LightHouseRunner from "./lighthouseRunner";
import ChromeRunner from "./chromeRunner";
import { Logger } from "tslog";
import { readFileSync } from "fs";
import Sites, { Site } from "./siteTracker";
import PromisePool from "@supercharge/promise-pool/dist";

const log = new Logger();

export default class BatchController {
  sitesToProcess: Site[];
  outputDir: string;
  verbose: boolean;
  numberOfRuns: number;

  constructor (options) {
    if (options.sites) {
      this.parseSitesArrayAndQueueDB(options.sites)
    }

    if (options.file) {
      this.parseSitesFileAndQueueDB(options.file)
    }

    this.outputDir = options.output
    this.verbose = options.verbose
    this.numberOfRuns = options.times

    const retrievedSites = Sites.getStillUnprocessed()

    if (retrievedSites instanceof Array) {
      this.sitesToProcess = retrievedSites
    } else {
      this.sitesToProcess = [retrievedSites]
    }
  }

  private parseSitesFileAndQueueDB(file: string) {
    const sites = readFileSync(file, 'utf8').trim().split('\n');

    sites.forEach((site) => {
      const s: Site = {
        url: site,
        finished: false,
        errors: false
      }
      Sites.createOrUpdate(s)
    })
  }

  private parseSitesArrayAndQueueDB(sites: string[]) {
    sites.forEach((site) => {
      const s: Site = {
        url: site,
        finished: false,
        errors: false
      }
      Sites.createOrUpdate(s)
    })
  }

  public async processSites() {
    await PromisePool.for(this.sitesToProcess).withConcurrency(1).process(async (site) => {
      await this.launchChromeAndRunLighthouse(site.url);
    })
  }

  public async launchChromeAndRunLighthouse(url: string) {
    log.info(`Auditing ${url}`)
    const chrome = new ChromeRunner();
    const port = await chrome.start();
    for (let run = 0; run < this.numberOfRuns; run++) {
      log.info(`Run #${run+1} of ${this.numberOfRuns}`)
      await this.runLightHouse(url,port,'desktop');
    }
    LightHouseRunner.resetRunID()
    await chrome.stop();
  }

  private async runLightHouse(url: string, port: number, formFactor: 'desktop' | 'mobile') {
      const lh = new LightHouseRunner(this.outputDir, url, port, formFactor,this.verbose)

    try {
      await lh.start();
      Sites.updateSiteAsFinished(url);
    } catch (e) {
      log.error(`Failed to Audit ${url}`)
      Sites.updateSiteAsErrorOccurred(url)
    }
  }
}