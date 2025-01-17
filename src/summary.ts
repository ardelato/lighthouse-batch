import {readdirSync, readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'
import {Logger} from 'tslog'
import {LighthouseReport} from './lighthouse-report-analyzer'
import SiteMetrics, {MappedSiteMetric, SiteMetric} from './site-metrics'

const log = new Logger()

export default function summarizedScores(averageBy: number) {
  log.info('Analyzing Results')
  const reports = getAllReports()
  const scores = getSiteMetrics(reports)

  const rsScores = reduceScores(scores)
  const averagedScores = averageScores(rsScores, averageBy)
  const transformedScores = transformScoresToSiteMetric(averagedScores)

  saveScores(transformedScores)

  log.info('Done Analyzing Results and Saved Scores')
}

export function diffResults(baselineURL, comparisonURL, pathsFile: string | null) {
  const diffs = {}
  if (pathsFile) {
    const paths = readFileSync(pathsFile, 'utf8').trim().split('\n')

    for (const path of paths) {
      const baslineScore = SiteMetrics.getSiteScores(`${baselineURL}${path}`)
      const newScore = SiteMetrics.getSiteScores(`${comparisonURL}${path}`)

      diffs[path] = {
        scores: {
          desktop: diffFormFactorScores(baslineScore.scores.desktop, newScore.scores.desktop),
          mobile: diffFormFactorScores(baslineScore.scores.mobile, newScore.scores.mobile),
        },
        errors: diffErrors(baslineScore.errors, newScore.errors)
      }
    }
  }


  const baslineScore = SiteMetrics.getSiteScores(`${baselineURL}/`)
  const newScore = SiteMetrics.getSiteScores(`${comparisonURL}/`)
  diffs['/'] = {
    scores: {
      desktop: diffFormFactorScores(baslineScore.scores.desktop, newScore.scores.desktop),
      mobile: diffFormFactorScores(baslineScore.scores.mobile, newScore.scores.mobile),
    },
  }

  writeFileSync('./diff.json', JSON.stringify(diffs, null, 2))
}

function diffFormFactorScores(baselineScores: Record<string, number>, newScores: Record<string, number>) {
  const diffedScores = {}
  // eslint-disable-next-line guard-for-in
  for (const key in baselineScores) {
    const diff = baselineScores[key] - newScores[key]
    const sum = baselineScores[key] + newScores[key]
    const percentDiff = key === 'performance' ? -(diff / (sum / 2) * 100) : diff / (sum / 2) * 100

    diffedScores[key] = {
      previousScore: baselineScores[key],
      newScore: newScores[key],
      delta: `${percentDiff.toFixed(2)}%`,
    }
  }

  return diffedScores
}

function diffErrors(baselineErrors: Array<any>, newErrors: Array<any>) {
  const setErrors = newErrors.filter(error => {
    return !baselineErrors.filter(x => x.description === error.description).length
  })
  return setErrors
}

function getAllReports() {
  const files = readdirSync(path.resolve('./reports/'))

  const reports: LighthouseReport[] = files.map(file => {
    log.info(`Analyzing ${file}`)
    return new LighthouseReport(`./reports/${file}`)
  })

  return reports
}

function getSiteMetrics(reports: LighthouseReport[]) {
  return reports.map(report => {
    return {
      url: report.getURL(),
      formFactor: report.getFormFactor(),
      score: report.getSummarizedScores(),
      errors: report.getErrors()
    }
  })
}

function reduceScores(scores): MappedSiteMetric {
  const rs: MappedSiteMetric = new Map()

  for (const score of scores) {
    const siteScore = rs.get(score.url)
    if (siteScore && siteScore[score.formFactor]) {
      aggregatedScores(siteScore[score.formFactor], score.score)
    } else if (siteScore) {
      siteScore[score.formFactor] = new Map<string, number>()
      aggregatedScores(siteScore[score.formFactor], score.score)
    } else {
      const newScore = {}
      newScore[score.formFactor] = new Map<string, number>()
      aggregatedScores(newScore[score.formFactor], score.score)
      newScore["errors"] = score.errors
      rs.set(score.url, newScore)
    }
  }
  return rs
}

function aggregatedScores(previousScore: Map<string, number>, currentScore: Map<string, number>) {
  for (const [audit, score] of currentScore) {
    const previousAuditScore = previousScore.get(audit) || 0
    previousScore.set(audit, score + previousAuditScore)
  }
}

function averageScores(scores: MappedSiteMetric, averageBy: number): MappedSiteMetric {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [url, formFactorScores] of scores) {
    const formFactors = Object.keys(formFactorScores)
    formFactors.pop()
    for (const formFactor of formFactors) {
      averageScoresHelper(formFactorScores[formFactor], averageBy)
    }
  }

  return scores
}

function averageScoresHelper(scores: Map<string, number>, averageBy: number) {
  for (const [audit, score] of scores) {
    const newScore = Number.parseFloat((score / averageBy).toFixed(2))
    scores.set(audit, newScore)
  }
}

function transformScoresToSiteMetric(scores: MappedSiteMetric): SiteMetric[] {
  const transformedScores: SiteMetric[] = []

  for (const [url, score] of scores) {
    const desktopEntries = score.desktop?.entries()
    const mobileEntries = score.mobile?.entries()

    const newSiteMetric = {
      url: url,
      scores: {
        desktop: desktopEntries ? Object.fromEntries(desktopEntries) : {},
        mobile: mobileEntries ? Object.fromEntries(mobileEntries) : {},
      },
      errors: score.errors ?? []
    }

    transformedScores.push(newSiteMetric)
  }

  return transformedScores
}

function saveScores(scores: SiteMetric[]): void {
  for (const score of scores) {
    SiteMetrics.createOrUpdate(score)
  }
}
