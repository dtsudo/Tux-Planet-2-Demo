let Enemy_Level1 = {};
((function () {
    let getEnemy = function (frameCount, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let enemies = [thisObj];
            frameCount++;
            if (frameCount === 5)
                enemies.push(Enemy_Background_Instructions.getEnemy({ enemyId: nextEnemyId++ }));
            if (frameCount % 120 === 0 && frameCount >= 400 && frameCount <= 1700) {
                enemies.push(Enemy_Flyamanita.getEnemy({
                    yInitialMibi: (100 + rng.nextInt(500)) << 10,
                    yAngleScaled: rng.nextInt(360 * 128),
                    enemyId: nextEnemyId++
                }));
            }
            if (frameCount === 1000) {
                enemies.push(Enemy_FlyamanitaBig.getEnemy({
                    yMibi: 350 * 1024,
                    enemyId: nextEnemyId++
                }));
            }
            if (frameCount === 1500) {
                enemies.push(Enemy_FlyamanitaBig.getEnemy({
                    yMibi: 200 * 1024,
                    enemyId: nextEnemyId++
                }));
                enemies.push(Enemy_FlyamanitaBig.getEnemy({
                    yMibi: 500 * 1024,
                    enemyId: nextEnemyId++
                }));
            }
            let shouldScreenWipe = false;
            let shouldCreateAutoSavestate = false;
            if (frameCount === 2000)
                shouldScreenWipe = true;
            if (frameCount === 2000 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 20)
                shouldCreateAutoSavestate = true;
            if (frameCount === 2000 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 40)
                enemies.push(Enemy_Level1BossCutscene.getEnemy({ enemyId: nextEnemyId++ }));
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                shouldScreenWipe,
                shouldCreateAutoSavestate
            };
            if (frameCount < 2000 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 40)
                returnVal.musicToPlay = 2 /* GameMusic.ForestTop */;
            return returnVal;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(frameCount, enemyId);
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: true,
            processFrame,
            getHitboxes: function () { return null; },
            getDamageboxes: function () { return null; },
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe: function () { },
            render: function (displayOutput) { }
        };
    };
    Enemy_Level1.getEnemy = function ({ enemyId }) {
        return getEnemy(0, enemyId);
    };
})());
