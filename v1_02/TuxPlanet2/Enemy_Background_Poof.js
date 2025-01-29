let Enemy_Background_Poof = {};
((function () {
    let onCollideFunction = function () { return false; };
    let getEnemy = function (xMibi, yMibi, frameCount, scalingFactorScaled, enemyId) {
        let thisEnemyArray = null;
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            frameCount++;
            if (frameCount >= 24)
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
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, frameCount, scalingFactorScaled, enemyId);
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCount / 6);
            displayOutput.drawImageRotatedClockwise(23 /* GameImage.Poof */, spriteNum * 16, 0, 16, 16, (xMibi >> 10) - Math.floor(8 * scalingFactorScaled / 128), (yMibi >> 10) - Math.floor(8 * scalingFactorScaled / 128), 0, scalingFactorScaled);
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
    Enemy_Background_Poof.getEnemy = function ({ xMibi, yMibi, scalingFactorScaled, enemyId }) {
        return getEnemy(xMibi, yMibi, 0, scalingFactorScaled, enemyId);
    };
})());
