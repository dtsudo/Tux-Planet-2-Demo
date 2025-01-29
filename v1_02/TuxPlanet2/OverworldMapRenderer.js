let OverworldMapRenderer = ((function () {
    let render = function (playerXMibi, playerYMibi, isMoving, animationFrameCounter, overworldMap, completedLevels, displayOutput) {
        let cameraX = (playerXMibi >> 10) - Math.floor(GlobalConstants.WINDOW_WIDTH / 2);
        let cameraY = (playerYMibi >> 10) - Math.floor(GlobalConstants.WINDOW_HEIGHT / 2);
        let maxCameraX = overworldMap.widthInTiles * 48 - GlobalConstants.WINDOW_WIDTH;
        let maxCameraY = overworldMap.heightInTiles * 48 - GlobalConstants.WINDOW_HEIGHT;
        if (cameraX < 0)
            cameraX = 0;
        if (cameraX > maxCameraX)
            cameraX = maxCameraX;
        if (cameraY < 0)
            cameraY = 0;
        if (cameraY > maxCameraY)
            cameraY = maxCameraY;
        let minJ = 0;
        let maxJ = overworldMap.heightInTiles - 1;
        for (let i = 0; i < overworldMap.widthInTiles; i++) {
            if (i * 48 - cameraX + 48 < 0)
                continue;
            if (i * 48 - cameraX > GlobalConstants.WINDOW_WIDTH)
                break;
            for (let j = minJ; j <= maxJ; j++) {
                if (j * 48 - cameraY + 48 < 0) {
                    minJ = j + 1;
                    continue;
                }
                if (j * 48 - cameraY > GlobalConstants.WINDOW_HEIGHT) {
                    maxJ = j - 1;
                    break;
                }
                let tile = overworldMap.tiles[i][j];
                if (tile.backgroundTile !== null)
                    displayOutput.drawImageRotatedClockwise(tile.backgroundTile.gameImage, tile.backgroundTile.imageX, tile.backgroundTile.imageY, 16, 16, i * 48 - cameraX, j * 48 - cameraY, 0, 128 * 3);
                if (tile.foregroundTile !== null)
                    displayOutput.drawImageRotatedClockwise(tile.foregroundTile.gameImage, tile.foregroundTile.imageX, tile.foregroundTile.imageY, 16, 16, i * 48 - cameraX, j * 48 - cameraY, 0, 128 * 3);
                if (tile.tileType === 2 /* OverworldMapTileType.Level */ && tile.shouldShowLevelIcon === true) {
                    let hasCompletedLevel = completedLevels.includes(tile.level);
                    displayOutput.drawImageRotatedClockwise(26 /* GameImage.LevelIcons */, hasCompletedLevel ? 16 : 0, 0, 16, 16, i * 48 - cameraX, j * 48 - cameraY, 0, 128 * 3);
                }
            }
        }
        let konqiImageX;
        if (isMoving)
            konqiImageX = (Math.floor(animationFrameCounter / 15) % 4) * 14;
        else
            konqiImageX = 0;
        displayOutput.drawImageRotatedClockwise(27 /* GameImage.KonqiO */, konqiImageX, 0, 14, 20, (playerXMibi >> 10) - 7 * 3 - cameraX, (playerYMibi >> 10) - 2 * 3 - cameraY, 0, 128 * 3);
    };
    return {
        render
    };
})());
