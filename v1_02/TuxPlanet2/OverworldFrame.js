let OverworldFrame = ((function () {
    let getFrame = function (globalState, sessionState) {
        let overworldMap = OverworldMapGeneration.generateOverworldMap(sessionState.overworldMapSeed);
        let playerTileX = sessionState.overworldLocation.tileX;
        let playerTileY = sessionState.overworldLocation.tileY;
        let playerXMibi = (playerTileX * 48 + 24) * 1024;
        let playerYMibi = (playerTileY * 48 + 24) * 1024;
        let animationFrameCounter = 0;
        let destinationTile = null;
        let reachableTiles = OverworldMapUtil.getReachableTiles(overworldMap, sessionState.completedLevels);
        let reachableTilesMap = {};
        for (let reachableTile of reachableTiles) {
            reachableTilesMap[reachableTile.tileX + "_" + reachableTile.tileY] = true;
        }
        let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
            musicOutput.playMusic(4 /* GameMusic.OverworldTheme */, 100);
            if (destinationTile === null) {
                animationFrameCounter = 0;
                if (sessionState.overworldLocation.tileX !== playerTileX || sessionState.overworldLocation.tileY !== playerTileY) {
                    sessionState.overworldLocation.tileX = playerTileX;
                    sessionState.overworldLocation.tileY = playerTileY;
                    globalState.saveAndLoadData.saveSessionState(sessionState);
                }
                if (keyboardInput.isPressed(38 /* Key.LeftArrow */) && playerTileX > 0 && reachableTilesMap[(playerTileX - 1) + "_" + playerTileY])
                    destinationTile = { tileX: playerTileX - 1, tileY: playerTileY };
                if (keyboardInput.isPressed(39 /* Key.RightArrow */) && playerTileX + 1 < overworldMap.widthInTiles && reachableTilesMap[(playerTileX + 1) + "_" + playerTileY])
                    destinationTile = { tileX: playerTileX + 1, tileY: playerTileY };
                if (keyboardInput.isPressed(37 /* Key.DownArrow */) && playerTileY > 0 && reachableTilesMap[playerTileX + "_" + (playerTileY - 1)])
                    destinationTile = { tileX: playerTileX, tileY: playerTileY - 1 };
                if (keyboardInput.isPressed(36 /* Key.UpArrow */) && playerTileY + 1 < overworldMap.heightInTiles && reachableTilesMap[playerTileX + "_" + (playerTileY + 1)])
                    destinationTile = { tileX: playerTileX, tileY: playerTileY + 1 };
            }
            else {
                let destinationXMibi = (destinationTile.tileX * 48 + 24) * 1024;
                let destinationYMibi = (destinationTile.tileY * 48 + 24) * 1024;
                let distanceToDestination = Math.abs(destinationXMibi - playerXMibi) + Math.abs(destinationYMibi - playerYMibi);
                if (distanceToDestination <= 4000) {
                    let newDestinationTile = null;
                    if (overworldMap.tiles[destinationTile.tileX][destinationTile.tileY].tileType === 0 /* OverworldMapTileType.Path */) {
                        let possibleNewDestinations = [];
                        if (destinationTile.tileX > 0 && reachableTilesMap[(destinationTile.tileX - 1) + "_" + destinationTile.tileY])
                            possibleNewDestinations.push({ tileX: destinationTile.tileX - 1, tileY: destinationTile.tileY });
                        if (destinationTile.tileX + 1 < overworldMap.widthInTiles && reachableTilesMap[(destinationTile.tileX + 1) + "_" + destinationTile.tileY])
                            possibleNewDestinations.push({ tileX: destinationTile.tileX + 1, tileY: destinationTile.tileY });
                        if (destinationTile.tileY > 0 && reachableTilesMap[destinationTile.tileX + "_" + (destinationTile.tileY - 1)])
                            possibleNewDestinations.push({ tileX: destinationTile.tileX, tileY: destinationTile.tileY - 1 });
                        if (destinationTile.tileY + 1 < overworldMap.heightInTiles && reachableTilesMap[destinationTile.tileX + "_" + (destinationTile.tileY + 1)])
                            possibleNewDestinations.push({ tileX: destinationTile.tileX, tileY: destinationTile.tileY + 1 });
                        if (possibleNewDestinations.length === 2) {
                            for (let possibleNewDestination of possibleNewDestinations) {
                                if (possibleNewDestination.tileX !== playerTileX || possibleNewDestination.tileY !== playerTileY) {
                                    newDestinationTile = possibleNewDestination;
                                }
                            }
                        }
                    }
                    playerTileX = destinationTile.tileX;
                    playerTileY = destinationTile.tileY;
                    playerXMibi = destinationXMibi;
                    playerYMibi = destinationYMibi;
                    destinationTile = newDestinationTile;
                }
                else {
                    if (destinationXMibi > playerXMibi)
                        playerXMibi += 4000;
                    else if (destinationXMibi < playerXMibi)
                        playerXMibi -= 4000;
                    else if (destinationYMibi > playerYMibi)
                        playerYMibi += 4000;
                    else if (destinationYMibi < playerYMibi)
                        playerYMibi -= 4000;
                    else
                        throw new Error("Unreachable");
                }
            }
            if (keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)
                || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
                || keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)) {
                let playerTile = overworldMap.tiles[playerTileX][playerTileY];
                if (destinationTile === null && playerTile.tileType === 2 /* OverworldMapTileType.Level */) {
                    soundOutput.playSound(0 /* GameSound.Click */, 100);
                    return LevelStartFrame.getFrame(globalState, sessionState, playerTile.level, thisFrame);
                }
            }
            if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)) {
                soundOutput.playSound(0 /* GameSound.Click */, 100);
                return OverworldPauseMenuFrame.getFrame(globalState, sessionState, thisFrame);
            }
            animationFrameCounter++;
            return thisFrame;
        };
        let render = function (displayOutput) {
            let isMoving = destinationTile !== null;
            OverworldMapRenderer.render(playerXMibi, playerYMibi, isMoving, animationFrameCounter, overworldMap, [...sessionState.completedLevels], displayOutput);
        };
        return {
            getNextFrame,
            render,
            getClickUrl: function () { return null; },
            getCompletedAchievements: function () { return null; }
        };
    };
    return {
        getFrame
    };
})());
