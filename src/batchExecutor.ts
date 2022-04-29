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

  addHomePagesToQueueDB(options.baselineURL, options.comparisonURL)

  if (options.pathsFile) {
    parsePathsFileAndQueueDB(options.pathsFile, options.baselineURL, options.comparisonURL)
  }

  const batcher = new BatchController(options);
  await batcher.processSites()
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

function parsePathsFileAndQueueDB(file: string, baselineURL: string, comparisonURL: string) {
  const paths = readFileSync(file, 'utf8').trim().split('\n');


  paths.forEach((path) => {
    const baseSite: Site = {
      url: `${baselineURL}${path}`,
      finished: false,
      errors: false
    }

    const cmpSite: Site = {
      url: `${comparisonURL}${path}`,
      finished: false,
      errors: false
    }
    Sites.createOrUpdate(baseSite)
    Sites.createOrUpdate(cmpSite)
  })
}

function addHomePagesToQueueDB(baselineURL: string, comparisonURL) {
  const baseSite: Site = {
      url: `${baselineURL}`,
      finished: false,
      errors: false
    }

    const cmpSite: Site = {
      url: `${comparisonURL}`,
      finished: false,
      errors: false
    }

    Sites.createOrUpdate(baseSite)
    Sites.createOrUpdate(cmpSite)
}