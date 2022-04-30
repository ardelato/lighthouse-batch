import SimplDB from 'simpl.db'
import { LighthouseMetrics } from './lighthouseReportAnalyzer';

const db = new SimplDB.Database({
  collectionsFolder: './tmp/',
  collectionTimestamps: true,
  dataFile: '/tmp/backup.json',
  tabSize: 2
});

export type SiteMetric = {
  url: string,
  formFactor: 'desktop' | 'mobile',
  score: LighthouseMetrics
}

export default class SiteMetrics {
  private static sitesDB = db.createCollection<SiteMetric>('metrics')

  public static createOrUpdate(site: SiteMetric) {
    if (SiteMetrics.entryExists(site)) {
      this.update(site);
    } else {
      this.create(site);
    }
  }

  public static create(site: SiteMetric) {
    this.sitesDB.create({ ...site })
  }

  public static update(site: SiteMetric) {
    this.sitesDB.update(
      s => s = site,
      s => s.url === site.url && s.formFactor === site.formFactor
    )
  }

  public static clean() {
    this.sitesDB.remove()
  }

  private static entryExists(site: SiteMetric) {
    return this.sitesDB.has(s => s.url === site.url && s.formFactor === site.formFactor)
  }
}