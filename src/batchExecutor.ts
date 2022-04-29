import {killAll} from "chrome-launcher"
import { readFileSync } from "fs";
import { Logger } from "tslog";
import BatchController from "./batchController";
import Sites, { Site } from "./siteTracker";

const log = new Logger();

process.on('SIGINT', () => {
  killAll();
});

process.on('beforeExit', () => {
  log.info('Finished')
})

export async function executeABBatch(options) {
  if (options.clean) {
    Sites.clean();
  }

}

export default async function executeBatch(options) {
  if (options.clean) {
    Sites.clean();
  }
  if (options.sites) {
    parseSitesArrayAndQueueDB(options.sites);
  }
  if (options.file) {
    parseSitesFileAndQueueDB(options.file);
  }

  const batcher = new BatchController(options);
  await batcher.processSites()
}

function parseSitesFileAndQueueDB(file: string) {
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

function parseSitesArrayAndQueueDB(sites: string[]) {
  sites.forEach((site) => {
    const s: Site = {
      url: site,
      finished: false,
      errors: false
    }
    Sites.createOrUpdate(s)
  })
}