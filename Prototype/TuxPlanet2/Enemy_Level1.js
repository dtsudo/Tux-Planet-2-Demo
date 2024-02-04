// REVIEW ME
let Enemy_Level1 = {};
((function () {
    let getEnemy = function (frameCount, enemyId) {
        let thisEnemy;
        let processFrame = function (thisObj, enemyMapping, rngSeed, nextEnemyId) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let enemies = [thisEnemy];
            let shouldCreateAutoSavestate = false;
            if (frameCount === 1)
                enemies.push(Enemy_Background_Instructions.getEnemy(nextEnemyId++));
            if (frameCount % 120 === 0 && frameCount >= 400 && frameCount <= 1950) {
                enemies.push(Enemy_Flyamanita.getEnemy((GlobalConstants.WINDOW_WIDTH + 50) << 10, (100 + rng.nextInt(500)) * 1024, rng.nextInt(360 * 128), nextEnemyId));
                nextEnemyId++;
            }
            //if (frameCount % 120 === 0 && frameCount >= 2100 && frameCount <= 2500) {
            //	enemies.push(Enemy_Flyamanita.getEnemy((GlobalConstants.WINDOW_WIDTH + 50) << 10, (100 + rng.nextInt(500)) * 1024, rng.nextInt(360 * 128), nextEnemyId));
            //	nextEnemyId++;
            //}
            if (frameCount === 1000) {
                let enemy = Enemy_FlyamanitaBig.getEnemy(350 * 1024, nextEnemyId, rng);
                nextEnemyId++;
                enemies.push(enemy);
            }
            if (frameCount === 1500) {
                let enemy = Enemy_FlyamanitaBig.getEnemy(200 * 1024, nextEnemyId, rng);
                nextEnemyId++;
                enemies.push(enemy);
                enemy = Enemy_FlyamanitaBig.getEnemy(500 * 1024, nextEnemyId, rng);
                nextEnemyId++;
                enemies.push(enemy);
            }
            let shouldScreenWipe = false;
            if (frameCount === 2000) {
                shouldScreenWipe = true;
            }
            else if (frameCount === 2050)
                shouldCreateAutoSavestate = true;
            if (frameCount === 2070) {
                enemies.push(Enemy_Level1BossCutscene.getEnemy(nextEnemyId++));
            }
            frameCount++;
            /* */ //if (frameCount < 1999) frameCount = 1999;
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                shouldEndLevel: false,
                shouldScreenWipe,
                shouldCreateAutoSavestate
            };
            if (frameCount < 2070) {
                returnVal.musicToPlay = 2 /* GameMusic.ForestTop */;
            }
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            return null;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(frameCount, enemyId);
        };
        thisEnemy = {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: true,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: function () { return false; },
            onScreenWipe: function () { },
            render: function (displayOutput) { }
        };
        return thisEnemy;
    };
    Enemy_Level1.getEnemy = function (enemyId) {
        return getEnemy(0, enemyId);
    };
})());
