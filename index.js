'use strict'

import 'shelljs/global.js';
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import runPublisher from './sitePublisher.js';


const JSON_EXT = '_report.json'

export default function execute(options) {
  log = log.bind(log, options.verbose || false)

  //Going to push urls to RabbitMQ
  if(options.role === 'publisher'){
    runPublisher();
  }
  //Going to pull urls from RabbitMQ
  else if (options.role === 'consumer'){

  }
  else {
    options.out = options.out ?? './report/lighthouse/'
    makeReportDirectory(options.out)

    sitesInfo(options).map((site) => generateReport(site,options))

    log('Lighthouse batch run ended')
  }
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

    const desktopCmd = `"${site.url}" --output json ${chromeFlags} --preset=desktop --skip-audits="full-page-screenshot" `
    const mobileCmd = `"${site.url}" --output json ${chromeFlags} --form-factor=mobile --skip-audits="full-page-screenshot" `

    log(`Lighthouse analyzing '${site.name}' ...\n`)

    for(let i = 0;i < options.times;i++){
      

      const desktopOutcome = runCMD(site,options,i,desktopCmd,"desktop")
      const mobileOutcome = runCMD(site,options,i,mobileCmd,"mobile")
    
      if(desktopOutcome.code !== 0 || mobileOutcome.code !== 0){
        log(`\tLighthouse analysis FAILED...\nNow stopping Lighthouse analysis for '${site.name}'\n\n`)
        let failedSitesFilePath = join(options.out,'failedSites.txt')
        appendFileSync(failedSitesFilePath,`${site.url}\n`)
        return
      }
      log(`\tLighthouse analysis complete...\n`)
    }

    
    let processedSitesFilePath = join(options.out,'processedSites.txt')
    appendFileSync(processedSitesFilePath,`${site.url}\n`)
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

function runCMD(site,options,runid,cmd,preset) {
  const lhScript = lighthouseScript(log)
  log(`Run ${runid+1}/${options.times} for '${site.name}'`)
  let fileName = `${site.name}_run${runid+1}_${preset}${JSON_EXT}`
  let filePath = join(options.out,fileName)
  return exec(`${lhScript} ${cmd.concat(`--output-path "${filePath}"`)}`)
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
