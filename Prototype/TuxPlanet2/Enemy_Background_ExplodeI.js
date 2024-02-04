// REVIEW ME
let Enemy_Background_ExplodeI = {};
((function () {
    let onCollideFunction = function () { return false; };
    let getEnemy = function (xMibi, yMibi, frameCount, scalingFactorScaled, displayAngleScaled, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function (thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput) {
            if (frameCount === 0)
                soundOutput.playSound(3 /* GameSound.StandardDeath */, 100);
            frameCount++;
            if (frameCount >= 15)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed,
                    shouldEndLevel: false
                };
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
            return null;
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, frameCount, scalingFactorScaled, displayAngleScaled, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCount / 3);
            displayOutput.drawImageRotatedClockwise(19 /* GameImage.ExplodeI */, spriteNum * 30, 0, 30, 30, (xMibi >> 10) - Math.floor(15 * scalingFactorScaled / 128), (yMibi >> 10) - Math.floor(15 * scalingFactorScaled / 128), displayAngleScaled, scalingFactorScaled);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: onCollideFunction,
            onCollideWithPlayerBullet: onCollideFunction,
            onScreenWipe: function () { },
            render
        };
    };
    Enemy_Background_ExplodeI.getEnemy = function (xMibi, yMibi, scalingFactorScaled, displayAngleScaled, enemyId) {
        return getEnemy(xMibi, yMibi, 0, scalingFactorScaled, displayAngleScaled, enemyId);
    };
})());
