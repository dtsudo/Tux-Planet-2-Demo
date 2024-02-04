// REVIEW ME
let Enemy_Bullet_Iceball = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, frameCounter, screenWipeCountdown, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function (thisObj, enemyMapping, rngSeed, nextEnemyId, playerState, soundOutput) {
            xMibi += xSpeed;
            yMibi += ySpeed;
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
                    let poof = Enemy_Background_Poof.getEnemy(xMibi, yMibi, 3 * 128, nextEnemyId++);
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
                newRngSeed: rngSeed,
                shouldEndLevel: false
            };
        };
        let getHitboxes = function () {
            let hitbox = {
                xMibi: xMibi - 6 * 1024,
                yMibi: yMibi - 6 * 1024,
                widthMibi: 13 * 1024,
                heightMibi: 13 * 1024
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
            displayOutput.drawImageRotatedClockwise(16 /* GameImage.Iceball */, 0, 0, 6, 6, (xMibi >> 10) - 3 * 3, (yMibi >> 10) - 3 * 3, displayAngleScaled, 3 * 128);
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
    Enemy_Bullet_Iceball.getEnemy = function (xMibi, yMibi, angleScaled, difficulty, enemyId, speedOverride) {
        let xSpeed;
        let ySpeed;
        if (speedOverride === undefined) {
            let speed;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    speed = 3;
                    break;
                case 1 /* Difficulty.Normal */:
                    speed = 4;
                    break;
                case 2 /* Difficulty.Hard */:
                    speed = 6;
                    break;
            }
            xSpeed = speed * DTMath.cosineScaled(angleScaled);
            ySpeed = speed * DTMath.sineScaled(angleScaled);
        }
        else {
            xSpeed = (speedOverride * DTMath.cosineScaled(angleScaled)) >> 10;
            ySpeed = (speedOverride * DTMath.sineScaled(angleScaled)) >> 10;
        }
        // 0 => -90
        // 30 => -120
        let displayAngleScaled = -angleScaled - 90 * 128;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, displayAngleScaled, 0, null, enemyId);
    };
})());
