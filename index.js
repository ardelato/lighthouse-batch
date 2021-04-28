'use strict'

import 'shelljs/global.js';
import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';

const JSON_EXT = '_report.json'

export default function execute(options) {
  log = log.bind(log, options.verbose || false)

  let out = options.out || './report/lighthouse/'
  makeReportDirectory(out)

  sitesInfo(options).map((site) => generateReport(site,options,out))

  console.log(`Lighthouse batch run end`)
}

function sitesInfo(options) {
  let sites = []

  if (options.file) {
    try {
      const contents = readFileSync(options.file, 'utf8')
      sites = contents.trim().split('\n')
    } catch (e) {
      console.error(`Failed to read file ${options.file}, aborting.\n`, e)
      log('Exiting with code 1')
      process.exit(1)
    }
  }
  if (options.sites) {
    sites = sites.concat(options.sites)
  }
  return sites.map(createIterableSiteObject);
}



function createIterableSiteObject(url) {
  url = url.trim()

  const name = siteName(url)

  const site = {
    url,
    name
  }

  return site
}

function siteName(url) {
  return url.replace(/(?:^https?:\/\/)(?:www\.)?(?<domain>[a-z0-9\-\.]+)(?:\.[a-z\.]+)(?<path>[\/]?.*)/,'$<domain>$<path>').replace(/[\/\?#:\*\$@\!\.\+]/g, '-')
}

function generateReport(site,options,out){
    const customParams = options.params || ''
    const chromeFlags = customParams.indexOf('--chrome-flags=') === -1 ? `--chrome-flags="--no-sandbox --headless --disable-gpu"` : ''
    const lhScript = lighthouseScript(log)

    let cmd = `"${site.url}" --output json ${chromeFlags} ${customParams}`

    log(`Lighthouse analyzing '${site.name}'...\n`)

    if(options.times){
      for(let i = 0;i < options.times;i++){
        console.log(`Run ${i+1} out of ${options.times}`)
        let fileName = `${site.name}_run${i+1}${JSON_EXT}`
        let filePath = join(out,fileName)

        let outcome = exec(`${lhScript} ${cmd.concat(`--output-path "${filePath}"`)}`)
        outcome.code === -1 ? log(`Lighthouse analysis FAILED for ${site.url}`) : log(`Lighthouse analysis of '${site.name}' complete\n`)
      }
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
