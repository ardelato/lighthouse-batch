import { LaunchedChrome } from "chrome-launcher"
import { killAll, launch } from 'chrome-launcher';
import { Logger } from "tslog";

const log = new Logger();
export default class ChromeRunner {
  static chromeFlags = ["--disable-gpu"];
  chrome!: LaunchedChrome

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