import { readdirSync } from 'fs';
import * as util from 'util';
import path from 'path';
import {Logger} from "tslog"
import { LighthouseAnalyzer } from './lighthouseReportAnalyzer';
import SiteMetrics, { MappedSiteMetric, SiteMetric } from './siteMetrics';

const log = new Logger();

function getAllReports() {
    const files = readdirSync(path.resolve('./reports/'))

    const reports: LighthouseAnalyzer[] = files.map(file => {
        log.info(`Analyzing ${file}`)
        return new LighthouseAnalyzer(`./reports/${file}`)
    })

    return reports
}

function getSiteMetrics(reports: LighthouseAnalyzer[]){
    return reports.map(report => {
        return {
            url: report.getURL(),
            formFactor: report.getFormFactor(),
            score: report.getSummarizedScores(),
        }
    })
}

function rs(scores): MappedSiteMetric {
    const reducedScores: MappedSiteMetric = new Map();

    scores.forEach(score => {
        const siteScore = reducedScores.get(score.url)
        if (siteScore && siteScore[score.formFactor]) {
            aggregatedScores(siteScore[score.formFactor], score.score)
        } else if (siteScore) {
            siteScore[score.formFactor] = new Map<string, number>()

            aggregatedScores(siteScore[score.formFactor], score.score)
        } else {
            const newScore = {}
            newScore[score.formFactor] = new Map<string, number>()

            aggregatedScores(newScore[score.formFactor],score.score)
            reducedScores.set(score.url, newScore)
        }
    })

    return reducedScores
}

function aggregatedScores(previousScore: Map<string, number>, currentScore: Map<string, number>){
    for (let [audit, score] of currentScore) {
        const previousAuditScore = previousScore.get(audit) || 0
        previousScore.set(audit, score + previousAuditScore)
    }
}

function averageScores(scores: MappedSiteMetric, averageBy: number): MappedSiteMetric {
    for (let [url, formFactorScores] of scores) {
        const formFactors = Object.keys(formFactorScores)
        formFactors.forEach(formFactor => {
            averageScoresHelper(formFactorScores[formFactor],averageBy)
        })
    }

    return scores
}

function averageScoresHelper(scores: Map<string, number>,averageBy: number) {
    for (let [audit, score] of scores) {
        const newScore = parseFloat((score / averageBy).toFixed(2))
        scores.set(audit, newScore)
    }
}

function transformScoresToSiteMetric(scores: MappedSiteMetric): SiteMetric[] {
    const transformedScores: SiteMetric[] = []

    for (let [url, formFactorScores] of scores) {
        const desktopEntries = formFactorScores['desktop']?.entries()
        const mobileEntries = formFactorScores['mobile']?.entries()

        const newSiteMetric = {
            url: url,
            scores: {
                'desktop': desktopEntries ? Object.fromEntries(desktopEntries) : {},
                'mobile': mobileEntries ? Object.fromEntries(mobileEntries) : {}
            }
        }

        transformedScores.push(newSiteMetric)
    }

    return transformedScores
}

function saveScores(scores) {
    scores.forEach(score => {
        SiteMetrics.createOrUpdate(score)
    })
}
function printScores(scores) {
    log.info(util.inspect(scores, false, 3))
}
const reports = getAllReports()
const scores = getSiteMetrics(reports)
const rsScores = rs(scores)
const averagedScores = averageScores(rsScores, 1)
const transformedScores = transformScoresToSiteMetric(averagedScores)
printScores(transformedScores)

saveScores(transformedScores)