import { readdirSync, readFileSync, appendFileSync } from 'fs';
import path from 'path';

const TIMES_RAN = process.argv[2];

function parseReports(files, dir){
     const defaultsiteScore = {
        "performance": 0,
        "firstContentfulPaint": 0,
        "firstMeaningfulPaint": 0,
        "largestContentfulPaint": 0,
        "firstCPUIdle": 0,
        "interactive": 0,
        "speedIndex": 0,
        "estimatedInputLatency": 0,
        "totalBlockingTime": 0,
        "cumulativeLayoutShift": 0,
    }
    const sites = {};
    const filteredFiles = files.filter(file => file && !file.match(/processedSites.txt/g) && !file.match(/failedSites.txt/g));

    for( const fileName of filteredFiles ){
        console.log(fileName)
        const file = readFileSync(path.join(dir,fileName));
        const json = JSON.parse(file);

        const formFactor = json.configSettings.formFactor
        const metrics = json.audits.metrics.details.items[0]
        const url = json.finalUrl

        const siteScore = {
            "performance": json.categories.performance.score,
            "firstContentfulPaint": metrics.firstContentfulPaint,
            "firstMeaningfulPaint": metrics.firstMeaningfulPaint,
            "largestContentfulPaint": metrics.largestContentfulPaint,
            "firstCPUIdle": metrics.firstCPUIdle,
            "interactive": metrics.interactive,
            "speedIndex": metrics.speedIndex,
            "estimatedInputLatency": metrics.estimatedInputLatency,
            "totalBlockingTime": metrics.totalBlockingTime,
            "cumulativeLayoutShift": metrics.cumulativeLayoutShift,
        }

        if(sites[url]){
            sites[url][formFactor] = reduceScores(sites[url][formFactor],siteScore)
        }
        else{
            sites[url] = {
                desktop: formFactor === 'desktop' ? siteScore : defaultsiteScore,
                mobile: formFactor === 'mobile' ? siteScore : defaultsiteScore
            }
        }
    }
    return sites
}

function reduceScores(accumulator, current){
    for( var audit of Object.keys(accumulator)){
        accumulator[audit] += current[audit]
    }
    return accumulator
}

function averageScores(sites){
    for( var site of Object.keys(sites)){
        for( var formFactor of Object.keys(sites[site])){
            for( var audit of Object.keys(sites[site][formFactor])){
                sites[site][formFactor][audit] /= TIMES_RAN
            }
        }
    }
    return sites
}

function generateScoreSummary(branch){
    const fileDir = './report/lighthouse';
    const dir = path.join(fileDir, branch);
    const branchFiles = readdirSync(dir);
    const sumSiteScores = parseReports(branchFiles,dir);
    const averageSiteScores = averageScores(sumSiteScores);
    const summaryFile = path.join('.',`${branch}_scores.json`);
    appendFileSync(summaryFile,JSON.stringify(averageSiteScores,null,2));
}

generateScoreSummary('master');
generateScoreSummary('new');
