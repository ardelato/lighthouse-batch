import LightHouseRunner from "./lighthouseRunner";
import ChromeRunner from "./chromeRunner";
import { Logger } from "tslog";
import Sites, { Site } from "./siteTracker";
import PromisePool from "@supercharge/promise-pool/dist";
import cliProgress from "cli-progress"
const multibar = new cliProgress.MultiBar({
    format: 'Progress | {bar} | {percentage}% | ETA: {eta_formatted} | {value}/{total} {action}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    clearOnComplete: false,
    stopOnComplete: true,
    hideCursor: true
}, cliProgress.Presets.shades_grey);

const log = new Logger({
  minLevel: 'error'
});

export default class BatchController {
  sitesToProcess: Site[];
  outputDir: string;
  verbose: boolean;
  numberOfRuns: number;

  constructor (options) {
    this.outputDir = options.output
    this.verbose = options.verbose
    this.numberOfRuns = options.times

    if (this.verbose) {
      log.setSettings({
        minLevel: 'info',
      })
    }

    const retrievedSites = Sites.getStillUnprocessed()

    if (retrievedSites instanceof Array) {
      this.sitesToProcess = retrievedSites
    } else {
      this.sitesToProcess = [retrievedSites]
    }
  }

  public async processSites() {
    const sitesBar = multibar.create(this.sitesToProcess.length,0, {action: 'Total Sites'})

    await PromisePool.for(this.sitesToProcess).withConcurrency(1).process(async (site) => {
      await this.launchChromeAndRunLighthouse(site.url, site.formFactor);

      sitesBar.increment()
    })

    multibar.stop()
  }

  public async launchChromeAndRunLighthouse(url: string, formFactor: 'desktop' | 'mobile') {
    log.info(`Auditing ${url}`)
    const bar = multibar.create(this.numberOfRuns, 0, { action: 'URL Runs' })
    const chrome = new ChromeRunner(true, this.verbose);
    const port = await chrome.start();
    for (let run = 0; run < this.numberOfRuns; run++) {
      log.info(`Run #${run+1} of ${this.numberOfRuns}`)
      await this.runLightHouse(url, port, formFactor);
      bar.increment()
    }
    multibar.remove(bar)
    LightHouseRunner.resetRunID()
    await chrome.stop();
  }

  private async runLightHouse(url: string, port: number, formFactor: 'desktop' | 'mobile') {
      const lh = new LightHouseRunner(this.outputDir, url, port, formFactor, this.verbose)

    try {
      await lh.start();
      Sites.updateSiteAsFinished(url,formFactor);
    } catch (e) {
      log.error(`Failed to Audit ${url}`)
      Sites.updateSiteAsErrorOccurred(url,formFactor)
    }
  }
}