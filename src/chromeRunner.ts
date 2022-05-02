import { LaunchedChrome } from "chrome-launcher"
import { killAll, launch } from 'chrome-launcher';
import { Logger } from "tslog";

const log = new Logger({
  minLevel: 'error'
});
export default class ChromeRunner {
  static chromeFlags = ["--disable-gpu"];
  chrome!: LaunchedChrome

  constructor (headless: boolean = true, verbose: boolean = false) {
    if (headless) {
      ChromeRunner.chromeFlags.push("--headless");
    }
    if (verbose) {
      log.setSettings({
        minLevel: 'info',
      })
    }
  }

  async start(): Promise<number> {
    log.info('Starting ChromeRunner')
    this.chrome = await launch({
      chromeFlags: ChromeRunner.chromeFlags
    })
    return this.chrome.port;
  }

  async stop(): Promise<void> {
    log.info('Stopping ChromeRunner')
    await this.chrome.kill();
  }
}