let TilemapUtil = ((function () {
    let getTilemap = function (tilemapLevelInfo, xOffsetInMibipixels, bossFrameCounter, widthInTiles, heightInTiles, solidLayer, foregroundLayer, backgroundLayer, remainingEnemyTiles) {
        let getSnapshot = function (thisObj) {
            let remainingEnemyTilesSnapshot = remainingEnemyTiles.map(x => ({ x: x.x, y: x.y, id: x.id }));
            return getTilemap(tilemapLevelInfo, xOffsetInMibipixels, bossFrameCounter, widthInTiles, heightInTiles, solidLayer, foregroundLayer, backgroundLayer, remainingEnemyTilesSnapshot);
        };
        let startBoss = function () {
            bossFrameCounter = 0;
        };
        let getXVelocityForEnemiesInMibipixelsPerFrame = function () {
            return tilemapLevelInfo.getXVelocityForEnemiesInMibipixelsPerFrame();
        };
        let hasReachedEndOfMap = function () {
            return tilemapLevelInfo.hasReachedEndOfMap(xOffsetInMibipixels, widthInTiles);
        };
        let isSolid = function (xMibi, yMibi) {
            return SolidLayerUtil.isSolid(xMibi, yMibi, xOffsetInMibipixels, widthInTiles, heightInTiles, solidLayer);
        };
        let isDeadly = function (xMibi, yMibi) {
            return false;
        };
        let getNewEnemies = function () {
            let returnValue = [];
            let newRemainingEnemyTiles = [];
            for (let enemyTile of remainingEnemyTiles) {
                let rightEdgeOfScreen = GlobalConstants.WINDOW_WIDTH * 1024 - xOffsetInMibipixels;
                let relevantX = Math.floor(rightEdgeOfScreen / (48 * 1024)) + 1;
                if (enemyTile.x <= relevantX) {
                    returnValue.push({
                        xMibi: (enemyTile.x * 48 + 24) * 1024 + xOffsetInMibipixels,
                        yMibi: (enemyTile.y * 48 + 24) * 1024,
                        id: enemyTile.id
                    });
                }
                else {
                    newRemainingEnemyTiles.push(enemyTile);
                }
            }
            remainingEnemyTiles = newRemainingEnemyTiles;
            return returnValue;
        };
        let processFrame = function () {
            if (bossFrameCounter !== null)
                bossFrameCounter++;
            xOffsetInMibipixels = tilemapLevelInfo.getNewXOffsetInMibipixels(xOffsetInMibipixels, widthInTiles, bossFrameCounter);
        };
        let renderForeground = function (displayOutput) {
            TilemapRendering.renderForeground(xOffsetInMibipixels, foregroundLayer, displayOutput);
        };
        let renderBackground = function (displayOutput) {
            TilemapRendering.renderBackground(xOffsetInMibipixels, backgroundLayer, bossFrameCounter, tilemapLevelInfo, displayOutput);
        };
        return {
            getSnapshot,
            getXVelocityForEnemiesInMibipixelsPerFrame,
            hasReachedEndOfMap,
            isSolid,
            isDeadly,
            startBoss,
            getNewEnemies,
            processFrame,
            renderForeground,
            renderBackground
        };
    };
    return {
        getTilemap: function (mapData, tilemapLevelInfo, display) {
            let foregroundLayer = MapDataLevelUtil.getForegroundLayer(mapData, display);
            let backgroundLayer = MapDataLevelUtil.getBackgroundLayer(mapData, display);
            let solidLayer = MapDataLevelUtil.getSolidLayer(mapData);
            let enemyTiles = MapDataLevelUtil.getEnemyTiles(mapData);
            if (!SolidLayerUtil.isValidSolidLayer(solidLayer))
                throw new Error("Invalid solid layer");
            return getTilemap(tilemapLevelInfo, 0, null, mapData.width, mapData.height, solidLayer, foregroundLayer, backgroundLayer, enemyTiles);
        }
    };
})());
