import LightHouseRunner from "./lighthouseRunner";
import ChromeRunner from "./chromeRunner";
import { Logger } from "tslog";
import { readFileSync } from "fs";
import Sites, { Site } from "./siteTracker";

const log = new Logger({});

export default class BatchController {
  sitesToProcess!: Site | Site[];

  constructor (sites: string[] | null, file: string | null) {
    if (sites) {
      this.parseSitesArrayAndQueueDB(sites)
    }

    if (file) {
      this.parseSitesFileAndQueueDB(file)
    }

    this.sitesToProcess = Sites.getStillUnprocessed()
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

  public async launchChromeAndRunLighthouse(url: string) {
    log.info('Starting ChromeRunner')
    const chrome = new ChromeRunner();
    const port = await chrome.start();

    const lh = new LightHouseRunner('./report/', url, port, 'desktop')

    log.info('Starting Lighthouse')
    await lh.start();
    log.info('Finished Lighthouse, killing ChromeRunner')
    await chrome.stop();
  }
}