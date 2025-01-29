let Enemy_Bullet_Fireball_Gravity = ((function () {
    let computeDisplayAngleScaled = function (xSpeed, ySpeed) {
        if (xSpeed === 0 && ySpeed === 0)
            return 0;
        return -DTMath.arcTangentScaled(xSpeed, ySpeed) - 90 * 128;
    };
    let getEnemy = function (xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
            ySpeedInMibipixelsPerFrame -= 180;
            xMibi += xSpeedInMibipixelsPerFrame;
            yMibi += ySpeedInMibipixelsPerFrame;
            displayAngleScaled = computeDisplayAngleScaled(xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -100 || x > GlobalConstants.WINDOW_WIDTH + 100 || y < -100 || y > GlobalConstants.WINDOW_HEIGHT + 3000)
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
            return getEnemy(xMibi, yMibi, xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 12) % 5;
            displayOutput.drawImageRotatedClockwise(30 /* GameImage.Flame */, 14 * spriteNum, 0, 14, 20, (xMibi >> 10) - 7 * 3, (yMibi >> 10) - 10 * 3, displayAngleScaled, 3 * 128);
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
        getEnemy: function ({ xInitialMibi, yInitialMibi, xSpeedInMibipixelsPerFrame, yInitialSpeedInMibipixelsPerFrame, enemyId }) {
            xInitialMibi += 4 * xSpeedInMibipixelsPerFrame;
            yInitialMibi += 4 * yInitialSpeedInMibipixelsPerFrame;
            let displayAngleScaled = computeDisplayAngleScaled(xSpeedInMibipixelsPerFrame, yInitialSpeedInMibipixelsPerFrame);
            return getEnemy(xInitialMibi, yInitialMibi, xSpeedInMibipixelsPerFrame, yInitialSpeedInMibipixelsPerFrame, displayAngleScaled, 0, null, enemyId);
        }
    };
})());
