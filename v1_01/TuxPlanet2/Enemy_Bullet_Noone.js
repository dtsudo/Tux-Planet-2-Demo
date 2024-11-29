let Enemy_Bullet_Noone = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, rotatesClockwise, displayAngleScaled, screenWipeCountdown, gameImage, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, tilemap }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 50 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (tilemap.isSolid(xMibi, yMibi)) {
                let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (rotatesClockwise) {
                displayAngleScaled += 192;
                if (displayAngleScaled >= 360 * 128)
                    displayAngleScaled -= 360 * 128;
            }
            else {
                displayAngleScaled -= 192;
                if (displayAngleScaled < 0)
                    displayAngleScaled += 360 * 128;
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128 * 2, enemyId: nextEnemyId++ });
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
                xMibi: xMibi - 16 * 1024,
                yMibi: yMibi - 16 * 1024,
                widthMibi: 32 * 1024,
                heightMibi: 32 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, rotatesClockwise, displayAngleScaled, screenWipeCountdown, gameImage, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(gameImage, 0, 0, 16, 16, (xMibi >> 10) - 8 * 3, (yMibi >> 10) - 8 * 3, displayAngleScaled, 3 * 128);
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
    Enemy_Bullet_Noone.getEnemy = function ({ xMibi, yMibi, directionScaled, xVelocityOffsetInMibipixelsPerFrame, rotatesClockwise, displayAngleScaled, gameImage, difficulty, enemyId }) {
        displayAngleScaled = DTMath.normalizeDegreesScaled(displayAngleScaled);
        let doubledSpeed;
        switch (difficulty) {
            case 0 /* Difficulty.Easy */:
                doubledSpeed = 3;
                break;
            case 1 /* Difficulty.Normal */:
                doubledSpeed = 4;
                break;
            case 2 /* Difficulty.Hard */:
                doubledSpeed = 5;
                break;
        }
        let xSpeed = Math.floor(DTMath.cosineScaled(directionScaled) * doubledSpeed / 2) + xVelocityOffsetInMibipixelsPerFrame;
        let ySpeed = Math.floor(DTMath.sineScaled(directionScaled) * doubledSpeed / 2);
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, rotatesClockwise, displayAngleScaled, null, gameImage, enemyId);
    };
})());
