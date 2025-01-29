let TilemapLevelInfo_Level1 = {
    getLevel1TilemapLevelInfo: function () {
        let xVelocity = -900;
        let getXVelocityForEnemiesInMibipixelsPerFrame = function () {
            return xVelocity;
        };
        let hasReachedEndOfMap = function (xOffsetInMibipixels, widthInTiles) {
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            return xOffsetInMibipixels <= (finalXOffset + 48 * 1024);
        };
        let getNewXOffsetInMibipixels = function (currentXOffsetInMibipixels, widthInTiles, bossFrameCounter) {
            let newXOffset = currentXOffsetInMibipixels + xVelocity;
            if (bossFrameCounter !== null) {
                newXOffset -= 1024;
                if (bossFrameCounter > 40)
                    newXOffset -= 1024;
                if (bossFrameCounter > 80)
                    newXOffset -= 1024;
                if (bossFrameCounter > 120)
                    newXOffset -= 1024;
                if (bossFrameCounter > 160)
                    newXOffset -= 1024;
            }
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            while (newXOffset <= finalXOffset) {
                newXOffset += 48 * 1024;
            }
            return newXOffset;
        };
        let getDarkenBackgroundAlpha = function (bossFrameCounter) {
            let alpha = Math.floor(bossFrameCounter * 5 / 4);
            if (alpha > 100)
                alpha = 100;
            return alpha;
        };
        return {
            getXVelocityForEnemiesInMibipixelsPerFrame,
            hasReachedEndOfMap,
            getNewXOffsetInMibipixels,
            getDarkenBackgroundAlpha
        };
    }
};
