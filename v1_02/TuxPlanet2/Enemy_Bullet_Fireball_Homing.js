let Enemy_Bullet_Fireball_Homing = ((function () {
    let arcTangentScaled = function (x, y) {
        if (x === 0 && y === 0)
            return 0;
        return DTMath.arcTangentScaled(x, y);
    };
    let getEnemy = function (xMibi, yMibi, targetPixelXMibi, targetPixelYMibi, targetPixelSpeedInMibipixelsPerFrame, targetPixelAngleScaled1, targetPixelAngleScaled2, targetPixelAngleScaled3, targetPixelAngleOffsetScaled3, switchToPhase2Cutoff, switchToPhase3Cutoff, speedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            frameCounter++;
            if (frameCounter < switchToPhase2Cutoff) {
                targetPixelXMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(targetPixelAngleScaled1)) >> 8;
                targetPixelYMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(targetPixelAngleScaled1)) >> 8;
            }
            else if (frameCounter < switchToPhase3Cutoff) {
                targetPixelXMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(targetPixelAngleScaled2)) >> 8;
                targetPixelYMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(targetPixelAngleScaled2)) >> 8;
            }
            else {
                if (targetPixelAngleScaled3 === null)
                    targetPixelAngleScaled3 = arcTangentScaled(playerState.xMibi - targetPixelXMibi, playerState.yMibi - targetPixelYMibi) + targetPixelAngleOffsetScaled3;
                targetPixelXMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(targetPixelAngleScaled3)) >> 8;
                targetPixelYMibi += ((targetPixelSpeedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(targetPixelAngleScaled3)) >> 8;
            }
            let angleScaled = arcTangentScaled(targetPixelXMibi - xMibi, targetPixelYMibi - yMibi);
            xMibi += ((speedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(angleScaled)) >> 8;
            yMibi += ((speedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(angleScaled)) >> 8;
            displayAngleScaled = -angleScaled - 90 * 128;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -100 || x > GlobalConstants.WINDOW_WIDTH + 1000 || y < -1000 || y > GlobalConstants.WINDOW_HEIGHT + 1000)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                    return {
                        enemies: [poof],
                        nextEnemyId: nextEnemyId,
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
                xMibi: xMibi - 5 * 3 * 1024,
                yMibi: yMibi - 5 * 3 * 1024,
                widthMibi: 10 * 3 * 1024,
                heightMibi: 10 * 3 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, targetPixelXMibi, targetPixelYMibi, targetPixelSpeedInMibipixelsPerFrame, targetPixelAngleScaled1, targetPixelAngleScaled2, targetPixelAngleScaled3, targetPixelAngleOffsetScaled3, switchToPhase2Cutoff, switchToPhase3Cutoff, speedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 12) % 5;
            displayOutput.drawImageRotatedClockwise(32 /* GameImage.FlameGreen */, 14 * spriteNum, 0, 14, 20, (xMibi >> 10) - 7 * 3, (yMibi >> 10) - 10 * 3, displayAngleScaled, 3 * 128);
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
    return {
        getEnemy: function ({ xInitialMibi, yInitialMibi, targetPixelSpeedInMibipixelsPerFrame, targetPixelAngleScaled1, targetPixelAngleScaled2, targetPixelAngleOffsetScaled3, switchToPhase2Cutoff, switchToPhase3Cutoff, speedInMibipixelsPerFrame, enemyId }) {
            xInitialMibi += 2 * (((speedInMibipixelsPerFrame >> 2) * DTMath.cosineScaled(targetPixelAngleScaled1)) >> 8);
            yInitialMibi += 2 * (((speedInMibipixelsPerFrame >> 2) * DTMath.sineScaled(targetPixelAngleScaled1)) >> 8);
            return getEnemy(xInitialMibi, yInitialMibi, xInitialMibi, yInitialMibi, targetPixelSpeedInMibipixelsPerFrame, targetPixelAngleScaled1, targetPixelAngleScaled2, null, targetPixelAngleOffsetScaled3, switchToPhase2Cutoff, switchToPhase3Cutoff, speedInMibipixelsPerFrame, -targetPixelAngleScaled1 - 90 * 128, 0, null, enemyId);
        }
    };
})());
