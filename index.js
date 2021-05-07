'use strict'

import 'shelljs/global.js';
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { join, resolve, dirname } from 'path';

const JSON_EXT = '_report.json'

export default function execute(options) {
  log = log.bind(log, options.verbose || false)

  options.out = options.out ?? './report/lighthouse/'
  makeReportDirectory(options.out)

  sitesInfo(options).map((site) => generateReport(site,options))

  log('Lighthouse batch run ended')
}

function sitesInfo(options) {
  let toBeProcessedSites = []
  let processedSites = []
  let filePath = join(options.out,'processedSites.txt')

  try {
    if(existsSync(filePath)){
      processedSites = readFileSync(filePath,'utf8').split('\n')
    }
    else{
      touch(filePath)
    }
  } catch (err) {
    console.error(`Failed to check for existing processed sites file, aborting.\n`, e)
    log('Exiting with code 1')
    process.exit(1)
  }

  if (options.file) {
    try {
      let sites = readFileSync(options.file, 'utf8').trim().split('\n')
      toBeProcessedSites = sites.filter(site => processedSites.indexOf(site) === -1);
    } catch (e) {
      console.error(`Failed to read file ${options.file}, aborting.\n`, e)
      log('Exiting with code 1')
      process.exit(1)
    }
  }
  if (options.sites) {
    toBeProcessedSites = toBeProcessedSites.concat(options.sites)
  }
  return toBeProcessedSites.map(createIterableSiteObject);
}

function createIterableSiteObject(url) {
  return {
    url: url.trim(),
    name: siteName(url)
  }
}

function siteName(url) {
  return url.replace(/(?:^https?:\/\/)(?:www\.)?(?<domain>[a-z0-9\-\.]+)(?:\.[a-z\.]+)(?<path>[\/]?.*)/,'$<domain>$<path>').replace(/[\/\?#:\*\$@\!\.\+]/g, '-')
}

function generateReport(site,options){
    const customParams = options.params ?? ''
    const chromeFlags = customParams.indexOf('--chrome-flags=') === -1 ? `--chrome-flags="--no-sandbox --headless --disable-gpu"` : ''
    const lhScript = lighthouseScript(log)

    let cmd = `"${site.url}" --output json --preset=desktop ${chromeFlags} ${customParams}`

    log(`Lighthouse analyzing '${site.name}' ...\n`)

    let outcome

    for(let i = 0;i < options.times;i++){
      log(`Run ${i+1}/${options.times} for '${site.name}'`)
      let fileName = `${site.name}_run${i+1}${JSON_EXT}`
      let filePath = join(options.out,fileName)

      outcome = exec(`${lhScript} ${cmd.concat(`--output-path "${filePath}"`)}`)
    
      if(outcome.code !== 0){
        log(`\tLighthouse analysis FAILED...\nNow stopping Lighthouse analysis for '${site.name}'\n\n`)
        let failedSitesFilePath = join(options.out,'failedSites.txt')
        appendFileSync(failedSitesFilePath,`${site.url}\n`)
        break;
      }
      log(`\tLighthouse analysis complete...\n`)
    }
    if(outcome.code === 0){
      let processedSitesFilePath = join(options.out,'processedSites.txt')
      appendFileSync(processedSitesFilePath,`${site.url}\n`)
    }
}

function lighthouseScript(log) {
  const __dirname = dirname('.');
  let cliPath = resolve(`${__dirname}/node_modules/lighthouse/lighthouse-cli/index.js`)
  if (!existsSync(cliPath)) {
    cliPath = resolve(`${__dirname}/../lighthouse/lighthouse-cli/index.js`)
    if (!existsSync(cliPath)) {
      console.error(`Failed to find Lighthouse CLI, aborting.`)
      process.exit(1)
    }
  }
  log(`Targeting local Lighthouse cli at '${cliPath}'`)
  return `node ${cliPath}`
}

function makeReportDirectory(out){
  try {
    if(!existsSync(out)){
      mkdir('-p', out)
    }
  } catch(e) {
    throw new Error(e);
  }
}

function log(v, msg) {
  if (v) console.log(msg)
}
