const compileQuery = require('assetgraph/lib/compileQuery');

interface PopulateGraphOptions {
  concurrency?: number;
  stopAssets?: any[];
  from?: any[];
  followRelations?: any;
  startAssets?: any[];
  /**
   * Limit relations to follow.
   * If not set or 0, there's
   * assumed to be no limit
   */
  limit?: number;
}

export default function populateWithLimit({
  concurrency = 100,
  stopAssets,
  followRelations,
  from,
  startAssets,
  limit = 0,
}: PopulateGraphOptions = {}) {
  let stopAssetsMatcher = (d: any) => false;

  if (stopAssets) {
    stopAssetsMatcher = compileQuery(stopAssets);
  }
  return async function populate(assetGraph: any) {
    let followedRelations = 0;
    const followRelationsMatcher = compileQuery(
      followRelations || assetGraph.followRelations,
    );
    const assetQueue = assetGraph.findAssets({
      isInline: false,
      isLoaded: true,
      ...(startAssets || from),
    });
    const seenAssets = new Set();

    async function processAsset(asset: any) {
      followedRelations += 1;
      // console.log('followedRelations', followedRelations);
      if (seenAssets.has(asset)) {
        return;
      }
      seenAssets.add(asset);
      try {
        await asset.load();
      } catch (err) {
        if (
          asset.incomingRelations.length > 0 &&
          asset.incomingRelations.every((relation: any) =>
            /SourceMappingUrl$/.test(relation.type),
          )
        ) {
          assetGraph.info(err);
        } else {
          assetGraph.warn(err);
        }
        return;
      }
      for (const relation of asset.externalRelations) {
        if (relation.to && followRelationsMatcher(relation, assetGraph)) {
          if (!stopAssetsMatcher(relation.to)) {
            assetQueue.push(relation.to);
          }
        }
      }
    }

    while (
      assetQueue.length > 0 &&
      limit &&
      limit > 0 &&
      followedRelations <= limit
    ) {
      await Promise.all(assetQueue.splice(0, concurrency).map(processAsset));
      console.log({ followedRelations, limit });
    }
  };
}
