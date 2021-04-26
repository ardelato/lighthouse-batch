'use strict'

import 'shelljs/global.js';
import { readdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';


const REPORT_SUMMARY = 'summary.json'
const JSON_EXT = '.report.json'

export const OUT = './report/lighthouse'

export default function execute(options) {
  log = log.bind(log, options.verbose || false)

  const out = options.out || OUT
  const lhScript = lighthouseScript(log)
  const summaryPath = join(out, REPORT_SUMMARY)

  try {
    if(!existsSync(out)){
      mkdir('-p', out)
    }
  } catch(e) {
    throw new Error(e);
  }

  const reports = sitesInfo(options).map((site, i) => {
  
    const prefix = `${i + 1}/${count}: `

    const filePath = join(out, site.file)
    const customParams = options.params || ''

    const chromeFlags = customParams.indexOf('--chrome-flags=') === -1 ? `--chrome-flags="--no-sandbox --headless --disable-gpu"` : ''
    // if gen'ing (html|csv)+json reports, ext '.report.json' is added by lighthouse cli automatically,
    // so here we try and keep the file names consistent by stripping to avoid duplication
    const outputPath = (options.html || options.csv) ? filePath.slice(0, -JSON_EXT.length) : filePath

    // Creating the lighthouse cli options string
    const cmd = `"${site.url}" --output json${htmlOut+csvOut} --output-path "${outputPath}" ${chromeFlags} ${customParams}`

    log(`${prefix}Lighthouse analyzing '${site.url}'`)
    log(cmd)

    // Now executing lighthouse cli
    const outcome = exec(`${lhScript} ${cmd}`)

    // Once the report is done, add it to the summary json
    const summary = updateSummary(filePath, site, outcome, options)

    if (summary.error) console.warn(`${prefix}Lighthouse analysis FAILED for ${summary.url}`)
    else log(`${prefix}Lighthouse analysis of '${summary.url}' complete with score ${summary.score}`)

    // Remove JSON report if --no-report flag was set
    if (options.report === false) {
      log(`Removing generated report file '${filePath}'`)
      rm(filePath)
    }

    const errors = checkBudgets(summary, options)
    if (errors) {
      const other = summary.errors
      summary.errors = {
        budget: errors
      }
      if (other) {
        summary.errors.other = other
      }
      budgetErrors = budgetErrors.concat(errors)
    }

    return summary
  })
  .filter(summary => !!summary)

  console.log(`Lighthouse batch run end`)
  console.log(`Writing reports summary to ${summaryPath}`)

  writeFileSync(summaryPath, JSON.stringify(reports), 'utf8')
  if (options.print) {
    console.log(`Printing reports summary`)
    console.log(JSON.stringify(reports, null, 2))
  }
}

/**
 * Object for a processed url
 * 
 * @typedef {Object} siteInfo
 * @property {string} url - The url of the site
 * @property {string} name - The file ready name of the url site
 * @property {string} file - The file name for the json report
 * @property {(string | undefined)} html - The file name for the html report if the html flag was passed
 * @property {(string | undefined)} csv - The file name for the csv report if the csv flag was passed
 */


/**
 * Will return an array of urls that have been formatted with http prefixes
 *
 * @param {LighthouseCommand} options
 * @return {siteInfo[]}
 */
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

  const existingNames = {}

  return sites.map(url => {
    url = url.trim()

    if (!url.match(/^https?:/)) {
      if (!url.startsWith('//')) url = `//${url}`
      url = `https:${url}`
    }


    const origName = siteName(url)
    let name = origName


    let j = 1
    while (existingNames[name]) {
      name = `${origName}_${j}`
      j++
    }
    existingNames[name] = true

    const info = {
      url,
      name,
      file: `${name}${JSON_EXT}`
    }

    return info
  })
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

/**
 * Will remove the protocol from the url and will format the url address for proper file name formatting.
 * 
 * Meaning it will replace characters like '/' or '?' from url that may cause issues reading the file name
 *
 * @param {string} site
 * @return {string} file ready site name
 */
function siteName(site) {
  return site.replace(/^https?:\/\//, '').replace(/[\/\?#:\*\$@\!\.]/g, '_')
}


/**
 * @todo remove unused options parameter
 * @todo probably should create a flag for running this function
 */
/**
 * Will update the siteInfo Object by appending a score and error message propert if it fails or returning the ongoing JSON object of siteInfo scores
 *
 * @param {string} filePath
 * @param {siteInfo} summary - current site object
 * @param {{code: number,stdout:Object, stderr: Object}} outcome
 * @param {LighthouseCommand} options
 * @return { {summary: siteInfo, score: number, detail: Object } }
 */
function updateSummary(filePath, summary, outcome, options) {

  // If lighthouse cli exits with non-zero exit code then it failed to audit the page
  if (outcome.code !== 0) {
    summary.score = 0
    summary.error = outcome.stderr
    return summary
  }

  // Parse the JSON Report file
  const report = JSON.parse(readFileSync(filePath))
  
  return {
    ...summary,
    ...getAverageScore(report)
  }
}

/**
 * @todo update getAverageScore to get average score for each category for n times ran
 */
/**
 *
 *
 * @param {Object} report
 * @return {{score: number, detail: Object}} returns a JSON object that has average score of the category scores while have a detail JSON object for each category score
 */
function getAverageScore(report) {
  /**
   * @todo remove reportCategories
   */
  let categories = report.reportCategories // lighthouse v1,2
  if (report.categories) { // lighthouse v3
    categories = Object.values(report.categories)
  }
  let total = 0
  const detail = categories.reduce((acc, cat) => {
    if (cat.id) acc[cat.id] = cat.score
    total += cat.score
    return acc
  }, {})
  return {
    score: Number((total / categories.length).toFixed(2)),
    detail
  }
}

/**
 *
 *
 * @param {{summary: siteInfo, score: number, detail: Object }} summary
 * @param {LighthouseCommand} options
 * @return {*} 
 */
function checkBudgets(summary, options) {
  const errors = []
  if (options.score > 0) {
    const score = toScore(summary.score)
    if (score < options.score) {
      errors.push(`average score ${score} < ${options.score} for ${summary.url}`)
    }
  }

  if (options.accessibility > 0) {
    const score = toScore(summary.detail.accessibility)
    if (score < options.accessibility) {
      errors.push(`accessibility score ${score} < ${options.accessibility} for ${summary.url}`)
    }
  }

  if (options.performance > 0) {
    const score = toScore(summary.detail.performance)
    if (score < options.performance) {
      errors.push(`performance score ${score} < ${options.performance} for ${summary.url}`)
    }
  }

  if (options.bestPractices > 0) {
    const score = toScore(summary.detail['best-practices'])
    if (score < options.bestPractices) {
      errors.push(`best practices score ${score} < ${options.bestPractices} for ${summary.url}`)
    }
  }

  if (options.seo > 0) {
    const score = toScore(summary.detail.seo)
    if (score < options.seo) {
      errors.push(`seo score ${score} < ${options.seo} for site ${summary.url}`)
    }
  }

  if (options.pwa > 0) {
    const score = toScore(summary.detail.pwa)
    if (score < options.pwa) {
      errors.push(`pwa score ${score} < ${options.pwa} for site ${summary.url}`)
    }
  }

  return errors.length ? errors : undefined
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


/**
 * @todo should rename this function to represent more what it is doing
 */
/**
 * Will return a whole integer instead of a float
 *
 * @param {number} score
 * @return {number} 
 */
function toScore(score) {
  return Number(score) * 100
}
