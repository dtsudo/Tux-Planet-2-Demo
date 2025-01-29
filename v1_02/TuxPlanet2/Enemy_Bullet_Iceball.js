let Enemy_Bullet_Iceball = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, collisionWithTilemapCountdown, gameImage, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput, tilemap }) {
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
            if (hasCollisionWithTilemap && collisionWithTilemapCountdown === null && tilemap.isSolid(xMibi, yMibi)) {
                collisionWithTilemapCountdown = 5;
            }
            if (collisionWithTilemapCountdown !== null)
                collisionWithTilemapCountdown--;
            if (collisionWithTilemapCountdown === 0 || collisionWithTilemapCountdown !== null && !tilemap.isSolid(xMibi, yMibi)) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
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
                xMibi: xMibi - 8 * 1024,
                yMibi: yMibi - 8 * 1024,
                widthMibi: 17 * 1024,
                heightMibi: 17 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, screenWipeCountdown, hasCollisionWithTilemap, collisionWithTilemapCountdown, gameImage, enemyId);
        };
        let render = function (displayOutput) {
            displayOutput.drawImageRotatedClockwise(gameImage, 0, 0, 6, 6, (xMibi >> 10) - 3 * 3, (yMibi >> 10) - 3 * 3, displayAngleScaled, 3 * 128);
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
    Enemy_Bullet_Iceball.getEnemy = function ({ xMibi, yMibi, speed, angleScaled, xVelocityOffsetInMibipixelsPerFrame, hasCollisionWithTilemap, gameImage, enemyId }) {
        let xSpeed = ((speed * DTMath.cosineScaled(angleScaled)) >> 10) + xVelocityOffsetInMibipixelsPerFrame;
        let ySpeed = (speed * DTMath.sineScaled(angleScaled)) >> 10;
        let displayAngleScaled = -angleScaled - 90 * 128;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, null, hasCollisionWithTilemap, null, gameImage, enemyId);
    };
})());
