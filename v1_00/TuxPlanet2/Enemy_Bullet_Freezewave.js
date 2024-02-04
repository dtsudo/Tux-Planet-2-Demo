let Enemy_Bullet_Freezewave = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput }) {
            xMibi += xSpeed;
            yMibi += ySpeed;
            frameCounter++;
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -100 || x > GlobalConstants.WINDOW_WIDTH + 100 || y < -100 || y > GlobalConstants.WINDOW_HEIGHT + 100)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
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
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 10) % 2;
            displayOutput.drawImageRotatedClockwise(16 /* GameImage.Freezewave */, spriteNum * 28, 0, 28, 24, (xMibi >> 10) - 14 * 3, (yMibi >> 10) - 12 * 3, displayAngleScaled, 3 * 128);
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
    Enemy_Bullet_Freezewave.getEnemy = function ({ xMibi, yMibi, playerState, difficulty, enemyId }) {
        let speed;
        switch (difficulty) {
            case 0 /* Difficulty.Easy */:
                speed = 10;
                break;
            case 1 /* Difficulty.Normal */:
                speed = 20;
                break;
            case 2 /* Difficulty.Hard */:
                speed = 30;
                break;
        }
        let x = playerState.xMibi - xMibi;
        let y = playerState.yMibi - yMibi;
        if (x === 0 && y === 0)
            x = 1;
        let angleScaled = DTMath.arcTangentScaled(x, y);
        let xSpeed = speed * DTMath.cosineScaled(angleScaled);
        let ySpeed = speed * DTMath.sineScaled(angleScaled);
        let displayAngleScaled = -angleScaled;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, 0, null, enemyId);
    };
})());
