// REVIEW ME
let Enemy_Level1Boss_Dead = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, deadFrameCount, enemyId) {
        let processFrame = function (thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (ySpeed > -30 && ySpeed < 30)
                ySpeed = 0;
            if (ySpeed < 0)
                ySpeed += 30;
            if (ySpeed > 0)
                ySpeed -= 30;
            let enemies = [thisObj];
            frameCounter++;
            deadFrameCount++;
            if (deadFrameCount % 4 === 0) {
                let explodeXMibi = xMibi;
                let explodeYMibi = yMibi;
                explodeXMibi += (rng.nextInt(100) - 50) << 10;
                explodeYMibi += (rng.nextInt(100) - 50) << 10;
                enemies.push(Enemy_Background_Explode.getEnemy(explodeXMibi, explodeYMibi, 128 * 3, rng.nextInt(128 * 360), nextEnemyId++, true));
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: 1 /* GameMusic.ChiptuneLevel3 */,
                bossHealthDisplayValue: 0
            };
            if (deadFrameCount === 1)
                returnVal.shouldScreenWipe = true;
            if (deadFrameCount > 120)
                returnVal.shouldEndLevel = true;
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
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, deadFrameCount, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            return true;
        };
        let onScreenWipe = function (countdown) {
        };
        return {
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
    Enemy_Level1Boss_Dead.getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, enemyId);
    };
})());
