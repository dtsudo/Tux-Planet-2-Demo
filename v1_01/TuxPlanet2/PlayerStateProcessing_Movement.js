let PlayerStateProcessing_Movement = ((function () {
    let collidesWithTilemap = function (xMibi, yMibi, tilemap) {
        return tilemap.isSolid(xMibi + 7 * 3 * 1024, yMibi + 9 * 3 * 1024)
            || tilemap.isSolid(xMibi + 7 * 3 * 1024, yMibi + 0 * 3 * 1024)
            || tilemap.isSolid(xMibi + 7 * 3 * 1024, yMibi - 13 * 3 * 1024)
            || tilemap.isSolid(xMibi - 7 * 3 * 1024, yMibi + 9 * 3 * 1024)
            || tilemap.isSolid(xMibi - 7 * 3 * 1024, yMibi + 0 * 3 * 1024)
            || tilemap.isSolid(xMibi - 7 * 3 * 1024, yMibi - 13 * 3 * 1024);
    };
    let processPlayerMovementHelper = function (gameState, frameInput) {
        let tilemap = gameState.tilemap;
        let collidedWithTilemap = false;
        let playerXMibi = gameState.playerState.xMibi;
        let playerYMibi = gameState.playerState.yMibi;
        let up = frameInput.up;
        let down = frameInput.down;
        let left = frameInput.left;
        let right = frameInput.right;
        let movingDiagonally = up && left || up && right || down && left || down && right;
        let xDelta = 0;
        let yDelta = 0;
        let movement = (movingDiagonally ? 3536 : 5000);
        if (up)
            yDelta += movement;
        else if (down)
            yDelta -= movement;
        if (right)
            xDelta += movement;
        else if (left)
            xDelta -= movement;
        let remainingXDelta = 0;
        if (collidesWithTilemap(playerXMibi + xDelta, playerYMibi, tilemap)) {
            collidedWithTilemap = true;
            while (true) {
                if (xDelta > 0) {
                    xDelta -= 1;
                    remainingXDelta += 1;
                    if (xDelta <= 0) {
                        xDelta = 0;
                        break;
                    }
                }
                else {
                    xDelta += 1;
                    remainingXDelta -= 1;
                    if (xDelta >= 0) {
                        xDelta = 0;
                        break;
                    }
                }
                if (!collidesWithTilemap(playerXMibi + xDelta, playerYMibi, tilemap)) {
                    playerXMibi += xDelta;
                    break;
                }
            }
        }
        else {
            playerXMibi += xDelta;
        }
        if (collidesWithTilemap(playerXMibi, playerYMibi + yDelta, tilemap)) {
            collidedWithTilemap = true;
            while (true) {
                if (yDelta > 0) {
                    yDelta -= 1;
                    if (yDelta <= 0) {
                        yDelta = 0;
                        break;
                    }
                }
                else {
                    yDelta += 1;
                    if (yDelta >= 0) {
                        yDelta = 0;
                        break;
                    }
                }
                if (!collidesWithTilemap(playerXMibi, playerYMibi + yDelta, tilemap)) {
                    playerYMibi += yDelta;
                    break;
                }
            }
        }
        else {
            playerYMibi += yDelta;
        }
        if (collidesWithTilemap(playerXMibi + remainingXDelta, playerYMibi, tilemap)) {
            collidedWithTilemap = true;
            while (true) {
                if (remainingXDelta > 0) {
                    remainingXDelta -= 1;
                    if (remainingXDelta <= 0) {
                        remainingXDelta = 0;
                        break;
                    }
                }
                else {
                    remainingXDelta += 1;
                    if (remainingXDelta >= 0) {
                        remainingXDelta = 0;
                        break;
                    }
                }
                if (!collidesWithTilemap(playerXMibi + remainingXDelta, playerYMibi, tilemap)) {
                    playerXMibi += remainingXDelta;
                    break;
                }
            }
        }
        else {
            playerXMibi += remainingXDelta;
        }
        if (playerXMibi < 32 * 1024)
            playerXMibi = 32 * 1024;
        if (playerXMibi > (GlobalConstants.WINDOW_WIDTH - 24) << 10)
            playerXMibi = (GlobalConstants.WINDOW_WIDTH - 24) << 10;
        if (playerYMibi < 39 * 1024)
            playerYMibi = 39 * 1024;
        if (playerYMibi > (GlobalConstants.WINDOW_HEIGHT - 35) << 10)
            playerYMibi = (GlobalConstants.WINDOW_HEIGHT - 35) << 10;
        return {
            updatedXMibi: playerXMibi,
            updatedYMibi: playerYMibi,
            collidedWithTilemap
        };
    };
    let processPlayerMovement = function (gameState, frameInput, soundOutput) {
        let tilemap = gameState.tilemap;
        if (collidesWithTilemap(gameState.playerState.xMibi, gameState.playerState.yMibi, tilemap)) {
            let tilemapXVelocity = tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            gameState.playerState.xMibi += tilemapXVelocity;
            if (gameState.playerState.xMibi < 32 * 1024) {
                gameState.playerState.xMibi = 32 * 1024;
                let canSurvive = false;
                for (let i = 0; i < 10; i++) {
                    if (!collidesWithTilemap(32 * 1024, gameState.playerState.yMibi + i * 1024, tilemap)) {
                        gameState.playerState.yMibi = gameState.playerState.yMibi + i * 1024;
                        canSurvive = true;
                        break;
                    }
                    if (!collidesWithTilemap(32 * 1024, gameState.playerState.yMibi - i * 1024, tilemap)) {
                        gameState.playerState.yMibi = gameState.playerState.yMibi - i * 1024;
                        canSurvive = true;
                        break;
                    }
                }
                if (!canSurvive) {
                    gameState.playerState.isDeadFrameCount = 0;
                    return;
                }
            }
        }
        let up = frameInput.up;
        let down = frameInput.down;
        let left = frameInput.left;
        let right = frameInput.right;
        let movingDiagonally = up && left || up && right || down && left || down && right;
        let playerMovement = processPlayerMovementHelper(gameState, frameInput);
        if (!movingDiagonally && playerMovement.collidedWithTilemap) {
            let bestPlayerMovement = playerMovement;
            let bestDistance = left || right
                ? Math.abs(bestPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                : Math.abs(bestPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
            if (up || left) {
                let tryFrameInput = {
                    up: true,
                    down: false,
                    left: true,
                    right: false,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
                let tryPlayerMovement = processPlayerMovementHelper(gameState, tryFrameInput);
                let tryDistance = left || right
                    ? Math.abs(tryPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                    : Math.abs(tryPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
                if (tryDistance > bestDistance) {
                    bestPlayerMovement = tryPlayerMovement;
                    bestDistance = tryDistance;
                }
            }
            if (up || right) {
                let tryFrameInput = {
                    up: true,
                    down: false,
                    left: false,
                    right: true,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
                let tryPlayerMovement = processPlayerMovementHelper(gameState, tryFrameInput);
                let tryDistance = left || right
                    ? Math.abs(tryPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                    : Math.abs(tryPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
                if (tryDistance > bestDistance) {
                    bestPlayerMovement = tryPlayerMovement;
                    bestDistance = tryDistance;
                }
            }
            if (down || left) {
                let tryFrameInput = {
                    up: false,
                    down: true,
                    left: true,
                    right: false,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
                let tryPlayerMovement = processPlayerMovementHelper(gameState, tryFrameInput);
                let tryDistance = left || right
                    ? Math.abs(tryPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                    : Math.abs(tryPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
                if (tryDistance > bestDistance) {
                    bestPlayerMovement = tryPlayerMovement;
                    bestDistance = tryDistance;
                }
            }
            if (down || right) {
                let tryFrameInput = {
                    up: false,
                    down: true,
                    left: false,
                    right: true,
                    shoot: false,
                    continueDialogue: false,
                    debug_toggleInvulnerability: false
                };
                let tryPlayerMovement = processPlayerMovementHelper(gameState, tryFrameInput);
                let tryDistance = left || right
                    ? Math.abs(tryPlayerMovement.updatedXMibi - gameState.playerState.xMibi)
                    : Math.abs(tryPlayerMovement.updatedYMibi - gameState.playerState.yMibi);
                if (tryDistance > bestDistance) {
                    bestPlayerMovement = tryPlayerMovement;
                    bestDistance = tryDistance;
                }
            }
            gameState.playerState.xMibi = bestPlayerMovement.updatedXMibi;
            gameState.playerState.yMibi = bestPlayerMovement.updatedYMibi;
        }
        else {
            gameState.playerState.xMibi = playerMovement.updatedXMibi;
            gameState.playerState.yMibi = playerMovement.updatedYMibi;
        }
    };
    return {
        processPlayerMovement
    };
})());
