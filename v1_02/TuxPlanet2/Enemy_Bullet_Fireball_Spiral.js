let Enemy_Bullet_Fireball_Spiral = ((function () {
    let getEnemy = function (xMibi, yMibi, xInitialMibi, yInitialMibi, angleScaled, radiusInMibipixels, angularSpeedInAngleScaledPerFrame, radiusSpeedInMibipixelsPerFrame, isRotatingClockwise, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            if (isRotatingClockwise) {
                angleScaled -= angularSpeedInAngleScaledPerFrame;
                while (angleScaled < 0)
                    angleScaled += 360 * 128;
            }
            else {
                angleScaled += angularSpeedInAngleScaledPerFrame;
                while (angleScaled >= 360 * 128)
                    angleScaled -= 360 * 128;
            }
            radiusInMibipixels += radiusSpeedInMibipixelsPerFrame;
            xMibi = xInitialMibi + (((radiusInMibipixels >> 2) * DTMath.cosineScaled(angleScaled)) >> 8);
            yMibi = yInitialMibi + (((radiusInMibipixels >> 2) * DTMath.sineScaled(angleScaled)) >> 8);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -1500 || x > GlobalConstants.WINDOW_WIDTH + 1500 || y < -1500 || y > GlobalConstants.WINDOW_HEIGHT + 1500)
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
            frameCounter++;
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
            return getEnemy(xMibi, yMibi, xInitialMibi, yInitialMibi, angleScaled, radiusInMibipixels, angularSpeedInAngleScaledPerFrame, radiusSpeedInMibipixelsPerFrame, isRotatingClockwise, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 12) % 5;
            let displayAngleScaled = isRotatingClockwise
                ? -angleScaled
                : (-angleScaled + 180 * 128);
            displayOutput.drawImageRotatedClockwise(31 /* GameImage.FlameBlue */, 14 * spriteNum, 0, 14, 20, (xMibi >> 10) - 7 * 3, (yMibi >> 10) - 10 * 3, displayAngleScaled, 3 * 128);
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
        getEnemy: function ({ xInitialMibi, yInitialMibi, angleScaled, angularSpeedInAngleScaledPerFrame, radiusSpeedInMibipixelsPerFrame, isRotatingClockwise, enemyId }) {
            angleScaled = DTMath.normalizeDegreesScaled(angleScaled);
            return getEnemy(xInitialMibi, yInitialMibi, xInitialMibi, yInitialMibi, angleScaled, 0, angularSpeedInAngleScaledPerFrame, radiusSpeedInMibipixelsPerFrame, isRotatingClockwise, 0, null, enemyId);
        }
    };
})());
