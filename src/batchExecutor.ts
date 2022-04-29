import {killAll} from "chrome-launcher"
import { readFileSync } from "fs";
import { Logger } from "tslog";
import BatchController from "./batchController";
import Sites, { Site } from "./siteTracker";

const log = new Logger();

process.on('SIGINT', () => {
  killAll();
});

export async function executeABBatch(options) {
  if (options.clean) {
    Sites.clean();
  }

  if (options.formFactor === 'both' && options.pathsFile) {
    parsePathsFileAndQueueDB(options.pathsFile, options.baselineURL, options.comparisonURL, 'desktop')
    parsePathsFileAndQueueDB(options.pathsFile, options.baselineURL, options.comparisonURL, 'mobile')
  } else if(options.pathsFile){
    parsePathsFileAndQueueDB(options.pathsFile, options.baselineURL, options.comparisonURL, options.formFactor);
  }

  if (options.formFactor === 'both') {
    addHomePagesToQueueDB(options.baselineURL, options.comparisonURL, 'desktop');
    addHomePagesToQueueDB(options.baselineURL, options.comparisonURL, 'mobile');
  } else {
    addHomePagesToQueueDB(options.baselineURL, options.comparisonURL, options.formFactor);
  }

  const batcher = new BatchController(options);
  await batcher.processSites()
}

export async function executeBatch(options) {
  if (options.clean) {
    Sites.clean();
  }
  if (options.sites) {
    parseSitesArrayAndQueueDB(options.sites, options.formFactor);
  }
  if (options.file) {
    parseSitesFileAndQueueDB(options.file, options.formFactor);
  }

  const batcher = new BatchController(options);
  await batcher.processSites()
}

function parseSitesFileAndQueueDB(file: string, formFactor: 'desktop' | 'mobile') {
  const sites = readFileSync(file, 'utf8').trim().split('\n');

  sites.forEach((site) => {
    const s: Site = {
      url: site,
      finished: false,
      errors: false,
      formFactor: formFactor
    }
    Sites.createOrUpdate(s)
  })
}

function parseSitesArrayAndQueueDB(sites: string[], formFactor: 'desktop' | 'mobile') {
  sites.forEach((site) => {
    const s: Site = {
      url: site,
      finished: false,
      errors: false,
      formFactor: formFactor
    }
    Sites.createOrUpdate(s)
  })
}

function parsePathsFileAndQueueDB(file: string, baselineURL: string, comparisonURL: string, formFactor: 'desktop' | 'mobile') {
  const paths = readFileSync(file, 'utf8').trim().split('\n');


  paths.forEach((path) => {
    const baseSite: Site = {
      url: `${baselineURL}${path}`,
      finished: false,
      errors: false,
      formFactor: formFactor
    }

    const cmpSite: Site = {
      url: `${comparisonURL}${path}`,
      finished: false,
      errors: false,
      formFactor: formFactor
    }
    Sites.createOrUpdate(baseSite)
    Sites.createOrUpdate(cmpSite)
  })
}

function addHomePagesToQueueDB(baselineURL: string, comparisonURL: string, formFactor: 'desktop' | 'mobile') {
    const baseSite: Site = {
      url: `${baselineURL}`,
      finished: false,
      errors: false,
      formFactor: formFactor
    }

    const cmpSite: Site = {
      url: `${comparisonURL}`,
      finished: false,
      errors: false,
      formFactor: formFactor
    }

    Sites.createOrUpdate(baseSite)
    Sites.createOrUpdate(cmpSite)
}