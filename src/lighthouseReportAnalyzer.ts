import { readFileSync } from "fs";
import Result from "lighthouse/types/lhr"
import { resolve } from "path";

export type AuditScore = {
  score: number,
  scoreType: string,
  weight: number
}

export type LighthouseMetrics = {
    performance: number,
    audits: Map<string, AuditScore>
}

const audits = [
  'cumulative-layout-shift',
  'first-contentful-paint',
  'interactive',
  'largest-contentful-paint',
  'speed-index',
  'total-blocking-time',
]

export class LighthouseReport {
  results: Result;
  score: LighthouseMetrics

  constructor (file: string) {
    const filePath = resolve(file)
    const content = readFileSync(filePath, 'utf8')
    this.results = JSON.parse(content)
    this.score = this.getScores()
  }


  getURL(): string {
    return this.results.requestedUrl
  }

  getFormFactor(): 'mobile' | 'desktop' {
    return this.results.configSettings.formFactor
  }

  getScore(): LighthouseMetrics {
    return { ...this.score }
  }

  private getScores(): LighthouseMetrics {
    return {
      performance: this.getPerformanceScore(),
      audits: this.getAllAuditScores()
    }
  }

  getPerformanceScore(): number {
    return this.results.categories.performance.score ?? 0
  }

  getSummarizedScores(): Map<string, number> {
    const summarizedScores = new Map<string, number>()
    summarizedScores.set('performance', this.score.performance)

    for (let [audit, auditScore] of this.score.audits) {
      summarizedScores.set(audit, auditScore.score)
    }

    return summarizedScores
  }

  private getAllAuditScores() {

    const auditScores = new Map<string, AuditScore>()

    audits.forEach(audit => {
      auditScores.set(audit, {
        score: this.getAuditScore(audit),
        scoreType: this.getAuditScoreType(audit),
        weight: this.getAuditWeight(audit),
      })
    })

    return auditScores
  }

  private getAuditWeight(auditRef: string): number {
    const audit = this.results.categories.performance.auditRefs.find(audit => audit.id === auditRef)
    return audit?.weight ?? 0
  }

  private getAuditScore(audit: string): number {
      const score = this.getAudit(audit).numericValue ?? 0
      return Math.floor(score)
  }

  private getAuditScoreType(audit: string): string {
    return this.getAudit(audit).numericUnit ?? 'unitless'
  }

  private getAudit(audit: string) {
    return this.results.audits[audit]
  }
}