// REVIEW ME
let Enemy_Bullet_Homing = {};
((function () {
    let getEnemy = function (xMibi, yMibi, displayAngleScaled, xMibi2, yMibi2, initialAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function (thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput) {
            let angleScaled = DTMath.arcTangentScaled(xMibi2 - xMibi, yMibi2 - yMibi);
            let speed = 35;
            if (difficulty === 1 /* Difficulty.Normal */)
                speed = 25;
            if (difficulty === 0 /* Difficulty.Easy */)
                speed = 12;
            let xSpeed = DTMath.cosineScaled(angleScaled) * speed;
            let ySpeed = DTMath.sineScaled(angleScaled) * speed;
            xMibi += xSpeed;
            yMibi += ySpeed;
            displayAngleScaled = -angleScaled;
            if (frameCounter === 5) {
                let targetX = playerState.xMibi;
                let targetY = playerState.yMibi;
                let deltaX = xMibi - targetX;
                let deltaY = yMibi - targetY;
                targetX -= deltaX >> 1;
                targetY -= deltaY >> 1;
                initialAngleScaled = DTMath.arcTangentScaled(targetX - xMibi2, targetY - yMibi2);
            }
            let xSpeed2 = DTMath.cosineScaled(initialAngleScaled) * 95;
            let ySpeed2 = DTMath.sineScaled(initialAngleScaled) * 95;
            xMibi2 += xSpeed2;
            yMibi2 += ySpeed2;
            frameCounter++;
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
                    let poof = Enemy_Background_Poof.getEnemy(xMibi, yMibi, 3 * 128 * 2, nextEnemyId++);
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
                xMibi: xMibi - 30 * 1024,
                yMibi: yMibi - 30 * 1024,
                widthMibi: 60 * 1024,
                heightMibi: 60 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, displayAngleScaled, xMibi2, yMibi2, initialAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 10) % 2;
            displayOutput.drawImageRotatedClockwise(11 /* GameImage.Freezewave */, spriteNum * 28, 0, 28, 24, (xMibi >> 10) - 14 * 3, (yMibi >> 10) - 12 * 3, displayAngleScaled, 3 * 128);
            /*displayOutput.drawRectangle(
                (xMibi2 >> 10) - 3,
                (yMibi2 >> 10) - 3,
                7,
                7,
                white,
                true);*/
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
    Enemy_Bullet_Homing.getEnemy = function (xMibi, yMibi, initialAngleScaled, enemyId) {
        return getEnemy(xMibi, yMibi, 0, xMibi, yMibi, initialAngleScaled, 0, null, enemyId);
    };
})());
