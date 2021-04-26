'use strict'

import 'shelljs/global.js';
import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';


const JSON_EXT = '.report.json'

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

function createIterableSiteObject(siteURL) {
  siteURL = siteURL.trim()

  const name = siteName(siteURL)

  const site = {
    siteURL,
    name,
    jsonFile: `${name}${JSON_EXT}`
  }

  return site
}

function generateReport(site,options,out){

    const filePath = join(out, site.jsonFile)
    const customParams = options.params || ''

    const chromeFlags = customParams.indexOf('--chrome-flags=') === -1 ? `--chrome-flags="--no-sandbox --headless --disable-gpu"` : ''
  
    const outputPath = filePath

    const cmd = `"${site.siteURL}" --output json --output-path "${outputPath}" ${chromeFlags} ${customParams}`

    log(`Lighthouse analyzing '${site.siteURL}'`)
    log(cmd)

    const lhScript = lighthouseScript(log)
    const outcome = exec(`${lhScript} ${cmd}`)

    outcome.code === -1 ? log(`Lighthouse analysis FAILED for ${site.siteURL}`) : log(`Lighthouse analysis of '${site.siteURL}' complete`)
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

function siteName(siteURL) {
  return siteURL.replace(/^https?:\/\//, '').replace(/[\/\?#:\*\$@\!\.]/g, '_')
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

/**
 * A callback wrapper function for console.log 
 * @callback consoleLogCB
 * @param {boolean} v
 * @param {string} msg
 */
function log(v, msg) {
  if (v) console.log(msg)
}
