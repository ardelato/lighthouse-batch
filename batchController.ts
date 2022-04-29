import LightHouseRunner from "./lighthouseRunner";
import ChromeRunner from "./chromeRunner";
import { Logger } from "tslog";
import { readFileSync } from "fs";

const log = new Logger({});

export default class BatchController {

  public parseAndqueueUpSites(file: string) {
    const sites = readFileSync(file, 'utf8').trim().split('\n');
    log.info(sites)
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