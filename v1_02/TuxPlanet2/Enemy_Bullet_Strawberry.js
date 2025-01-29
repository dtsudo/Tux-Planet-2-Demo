let Enemy_Bullet_Strawberry = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, tilemap, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput }) {
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
            if (hasCollisionWithTilemap && tilemap.isSolid(xMibi, yMibi)) {
                let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
                return {
                    enemies: [poof],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            if (screenWipeCountdown !== null) {
                screenWipeCountdown--;
                if (screenWipeCountdown <= 0) {
                    let poof = Enemy_Background_Poof.getEnemy({ xMibi: xMibi, yMibi: yMibi, scalingFactorScaled: 3 * 128, enemyId: nextEnemyId++ });
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
                xMibi: xMibi - 10 * 1024,
                yMibi: yMibi - 10 * 1024,
                widthMibi: 20 * 1024,
                heightMibi: 20 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(21 /* GameImage.Strawberry */, 0, 0, 10, 12, (xMibi >> 10) - 5 * 3, (yMibi >> 10) - 6 * 3, displayAngleScaled, 3 * 128);
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
    Enemy_Bullet_Strawberry.getEnemy = function ({ xMibi, yMibi, angleScaled, xVelocityOffsetInMibipixelsPerFrame, hasCollisionWithTilemap, enemyId }) {
        let speed = 2;
        let xSpeed = speed * DTMath.cosineScaled(angleScaled) + xVelocityOffsetInMibipixelsPerFrame;
        let ySpeed = speed * DTMath.sineScaled(angleScaled);
        let displayAngleScaled = -angleScaled - 90 * 128;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, null, hasCollisionWithTilemap, enemyId);
    };
})());
