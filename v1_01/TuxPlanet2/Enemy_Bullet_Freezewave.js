let Enemy_Bullet_Freezewave = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, frameCounter, screenWipeCountdown, scalingFactorScaled, hasCollisionWithTilemap, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            frameCounter++;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            let boundaryBuffer = (34 * scalingFactorScaled) >> 7;
            if (x < -boundaryBuffer || x > GlobalConstants.WINDOW_WIDTH + boundaryBuffer || y < -boundaryBuffer || y > GlobalConstants.WINDOW_HEIGHT + boundaryBuffer)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (hasCollisionWithTilemap && tilemap.isSolid(xMibi, yMibi)) {
                let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: scalingFactorScaled * 2, enemyId: nextEnemyId++ });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: scalingFactorScaled * 2, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId,
                        newRngSeed: rngSeed
                    };
                }
            }
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - ((10 * scalingFactorScaled) >> 7) * 1024,
                yMibi: yMibi - ((10 * scalingFactorScaled) >> 7) * 1024,
                widthMibi: ((20 * scalingFactorScaled) >> 7) * 1024,
                heightMibi: ((20 * scalingFactorScaled) >> 7) * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, frameCounter, screenWipeCountdown, scalingFactorScaled, hasCollisionWithTilemap, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 2;
            displayOutput.drawImageRotatedClockwise(18 /* GameImage.Freezewave */, spriteNum * 28, 0, 28, 24, (xMibi >> 10) - ((14 * scalingFactorScaled) >> 7), (yMibi >> 10) - ((12 * scalingFactorScaled) >> 7), displayAngleScaled, scalingFactorScaled);
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: true,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe,
            render
        };
    };
    Enemy_Bullet_Freezewave.getEnemy = function ({ xMibi, yMibi, playerState, speed, scalingFactorScaled, hasCollisionWithTilemap, enemyId }) {
        let x = playerState.xMibi - xMibi;
        let y = playerState.yMibi - yMibi;
        if (x === 0 && y === 0)
            x = 1;
        let angleScaled = DTMath.arcTangentScaled(x, y);
        let xSpeed = speed * DTMath.cosineScaled(angleScaled);
        let ySpeed = speed * DTMath.sineScaled(angleScaled);
        let displayAngleScaled = -angleScaled;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, 0, null, scalingFactorScaled, hasCollisionWithTilemap, enemyId);
    };
})());
