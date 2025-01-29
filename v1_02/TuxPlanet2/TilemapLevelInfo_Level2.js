let TilemapLevelInfo_Level2 = {
    getLevel2TilemapLevelInfo: function () {
        let xVelocity = -900;
        let getXVelocityForEnemiesInMibipixelsPerFrame = function () {
            return xVelocity;
        };
        let hasReachedEndOfMap = function (xOffsetInMibipixels, widthInTiles) {
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            return xOffsetInMibipixels <= (finalXOffset + 48 * 1024 * 21);
        };
        let getNewXOffsetInMibipixels = function (currentXOffsetInMibipixels, widthInTiles, bossFrameCounter) {
            let newXOffset = currentXOffsetInMibipixels + xVelocity;
            if (bossFrameCounter !== null) {
                newXOffset -= 1024;
                if (bossFrameCounter > 10)
                    newXOffset -= 1024;
                if (bossFrameCounter > 20)
                    newXOffset -= 1024;
                if (bossFrameCounter > 30)
                    newXOffset -= 1024;
                if (bossFrameCounter > 40)
                    newXOffset -= 1024;
                if (bossFrameCounter > 50)
                    newXOffset -= 1024;
                if (bossFrameCounter > 60)
                    newXOffset -= 1024;
                if (bossFrameCounter > 70)
                    newXOffset -= 1024;
                if (bossFrameCounter > 80)
                    newXOffset -= 1024;
                if (bossFrameCounter > 90)
                    newXOffset -= 1024;
                if (bossFrameCounter > 100)
                    newXOffset -= 1024;
                if (bossFrameCounter > 110)
                    newXOffset -= 1024;
                if (bossFrameCounter > 120)
                    newXOffset -= 1024;
                if (bossFrameCounter > 130)
                    newXOffset -= 1024;
                if (bossFrameCounter > 140)
                    newXOffset -= 1024;
                if (bossFrameCounter > 150)
                    newXOffset -= 1024;
                if (bossFrameCounter > 160)
                    newXOffset -= 1024;
                if (bossFrameCounter > 170)
                    newXOffset -= 1024;
                if (bossFrameCounter > 180)
                    newXOffset -= 1024;
            }
            let finalXOffset = -1024 * (widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH);
            while (newXOffset <= finalXOffset) {
                newXOffset += 48 * 1024 * 25;
            }
            return newXOffset;
        };
        let getDarkenBackgroundAlpha = function (bossFrameCounter) {
            let alpha = Math.floor(bossFrameCounter * 5 / 2);
            if (alpha > 215)
                alpha = 215;
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
