let Enemy_Background_Explode = {};
((function () {
    let onCollideFunction = function () { return false; };
    let getEnemy = function (xMibi, yMibi, displayAngleScaled, scalingFactorScaled, frameCount, renderOnTop, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            if (frameCount === 0)
                soundOutput.playSound(3 /* GameSound.StandardDeath */, 100);
            frameCount++;
            if (frameCount >= 30)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            if (thisEnemyArray === null)
                thisEnemyArray = [thisObj];
            return {
                enemies: thisEnemyArray,
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, displayAngleScaled, scalingFactorScaled, frameCount, renderOnTop, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCount / 6);
            displayOutput.drawImageRotatedClockwise(16 /* GameImage.ExplodeF */, spriteNum * 24, 0, 24, 24, (xMibi >> 10) - Math.floor(12 * scalingFactorScaled / 128), (yMibi >> 10) - Math.floor(12 * scalingFactorScaled / 128), displayAngleScaled, scalingFactorScaled);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: renderOnTop ? true : false,
            isBackground: renderOnTop ? false : true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: onCollideFunction,
            onCollideWithPlayerBullet: onCollideFunction,
            onScreenWipe: function () { },
            render
        };
    };
    Enemy_Background_Explode.getEnemy = function ({ xMibi, yMibi, displayAngleScaled, scalingFactorScaled, renderOnTop, enemyId }) {
        return getEnemy(xMibi, yMibi, displayAngleScaled, scalingFactorScaled, 0, renderOnTop, enemyId);
    };
})());
