let OverworldMapUtil = {
    getLevelLocations: function (overworldMap) {
        let returnValue = {};
        for (let i = 0; i < overworldMap.widthInTiles; i++) {
            for (let j = 0; j < overworldMap.heightInTiles; j++) {
                let tile = overworldMap.tiles[i][j];
                if (tile.tileType === 2 /* OverworldMapTileType.Level */) {
                    returnValue[tile.level] = { tileX: i, tileY: j };
                }
            }
        }
        return returnValue;
    },
    getReachableTiles: function (overworldMap, completedLevels) {
        let levelLocations = OverworldMapUtil.getLevelLocations(overworldMap);
        if (completedLevels.length === 0)
            return [levelLocations[0 /* Level.Level1 */]];
        let returnValue = [];
        let processedTiles = {};
        let tilesToProcess = [];
        for (let completedLevel of completedLevels) {
            tilesToProcess.push(levelLocations[completedLevel]);
        }
        while (true) {
            if (tilesToProcess.length === 0)
                break;
            let tileToProcess = tilesToProcess.pop();
            let tileKey = tileToProcess.tileX + "_" + tileToProcess.tileY;
            if (processedTiles[tileKey])
                continue;
            returnValue.push(tileToProcess);
            processedTiles[tileKey] = true;
            let overworldMapTile = overworldMap.tiles[tileToProcess.tileX][tileToProcess.tileY];
            if (overworldMapTile.tileType === 0 /* OverworldMapTileType.Path */ || overworldMapTile.tileType === 2 /* OverworldMapTileType.Level */ && completedLevels.includes(overworldMapTile.level)) {
                if (tileToProcess.tileX > 0 && overworldMap.tiles[tileToProcess.tileX - 1][tileToProcess.tileY].tileType !== 1 /* OverworldMapTileType.NonPath */)
                    tilesToProcess.push({ tileX: tileToProcess.tileX - 1, tileY: tileToProcess.tileY });
                if (tileToProcess.tileX + 1 < overworldMap.widthInTiles && overworldMap.tiles[tileToProcess.tileX + 1][tileToProcess.tileY].tileType !== 1 /* OverworldMapTileType.NonPath */)
                    tilesToProcess.push({ tileX: tileToProcess.tileX + 1, tileY: tileToProcess.tileY });
                if (tileToProcess.tileY > 0 && overworldMap.tiles[tileToProcess.tileX][tileToProcess.tileY - 1].tileType !== 1 /* OverworldMapTileType.NonPath */)
                    tilesToProcess.push({ tileX: tileToProcess.tileX, tileY: tileToProcess.tileY - 1 });
                if (tileToProcess.tileY + 1 < overworldMap.heightInTiles && overworldMap.tiles[tileToProcess.tileX][tileToProcess.tileY + 1].tileType !== 1 /* OverworldMapTileType.NonPath */)
                    tilesToProcess.push({ tileX: tileToProcess.tileX, tileY: tileToProcess.tileY + 1 });
            }
        }
        return returnValue;
    }
};
