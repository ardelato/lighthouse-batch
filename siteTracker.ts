import SimplDB from 'simpl.db'

const db = new SimplDB.Database({
  collectionsFolder: './tmp/',
  collectionTimestamps: true,
  tabSize: 2
});

export type Site = {
  url: string,
  finished: boolean,
  errors: boolean
}

export default class Sites {
  private sitesDB = db.createCollection<Site>('sites')

  public createOrUpdate(site: Site) {
    if (this.entryExists(site)) {
      this.update(site);
    } else {
      this.create(site);
    }
  }

  public create(site: Site) {
    this.sitesDB.create({ ...site })
  }

  public update(site: Site) {
    this.sitesDB.update(
      s => s = { ...site },
      s => s.url === site.url
    )
  }

  private entryExists(site: Site) {
    return this.sitesDB.has(s => s.url === site.url)
  }
}