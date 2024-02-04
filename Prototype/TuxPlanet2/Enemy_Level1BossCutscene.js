// REVIEW ME
let Enemy_Level1BossCutscene = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, frameCounter, hasStartedCutscene, transformToBoss, enemyId) {
        let getXMibi = function () { return xMibi; };
        let getYMibi = function () { return yMibi; };
        let transformToLevel1Boss = function () {
            transformToBoss = true;
        };
        let processFrame = function (thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput) {
            if (transformToBoss) {
                let boss = Enemy_Level1Boss_Phase1.getEnemy(xMibi, yMibi, frameCounter, nextEnemyId++);
                return {
                    enemies: [boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rngSeed
                };
            }
            xMibi -= xSpeed;
            xSpeed -= 40;
            if (xSpeed <= 0)
                xSpeed = 0;
            frameCounter++;
            let cutscene = null;
            if (xSpeed <= 0 && !hasStartedCutscene) {
                hasStartedCutscene = true;
                cutscene = Cutscene_Level1Boss.getCutscene(enemyId);
            }
            let returnVal = {
                enemies: [thisObj],
                nextEnemyId: nextEnemyId,
                newRngSeed: rngSeed
            };
            if (cutscene !== null)
                returnVal.cutscene = cutscene;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 48 * 1024,
                yMibi: yMibi - 48 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 32 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 10) % 4;
            displayOutput.drawImageRotatedClockwise(13 /* GameImage.OwlBrown */, 32 + spriteNum * 32, 0, 32, 32, (xMibi >> 10) - 48, (yMibi >> 10) - 48, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, frameCounter, hasStartedCutscene, transformToBoss, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            return true;
        };
        let onScreenWipe = function (countdown) {
        };
        return {
            getXMibi,
            getYMibi,
            transformToLevel1Boss,
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe,
            render: render
        };
    };
    Enemy_Level1BossCutscene.getEnemy = function (enemyId) {
        return getEnemy((GlobalConstants.WINDOW_WIDTH + 100) << 10, 350 * 1024, 5000, 0, false, false, enemyId);
    };
})());
