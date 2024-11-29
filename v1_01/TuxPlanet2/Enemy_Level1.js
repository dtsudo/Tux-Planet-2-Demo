let Enemy_Level1 = {};
((function () {
    let getEnemy = function (frameCount, bossSpawnCounter, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let enemies = [thisObj];
            frameCount++;
            if (frameCount === 10)
                enemies.push(Enemy_Background_Instructions.getEnemy({ enemyId: nextEnemyId++ }));
            let newTilemapEnemies = tilemap.getNewEnemies();
            for (let newTilemapEnemy of newTilemapEnemies) {
                if (newTilemapEnemy.id === 0) {
                    enemies.push(Enemy_Flyamanita.getEnemy({
                        xMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        yAngleScaled: rng.nextInt(360 * 128),
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 1) {
                    enemies.push(Enemy_Smartcap.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        isFacingRight: false,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else if (newTilemapEnemy.id === 2) {
                    enemies.push(Enemy_Snowball.getEnemy({
                        xInitialMibi: newTilemapEnemy.xMibi,
                        yInitialMibi: newTilemapEnemy.yMibi,
                        isFacingRight: false,
                        difficulty: difficulty,
                        enemyId: nextEnemyId++
                    }));
                }
                else {
                    throw new Error("Unrecognized id: " + newTilemapEnemy.id);
                }
            }
            if (bossSpawnCounter !== null)
                bossSpawnCounter++;
            if (bossSpawnCounter === null && tilemap.hasReachedEndOfMap())
                bossSpawnCounter = 0;
            let shouldScreenWipe = false;
            let shouldCreateAutoSavestate = false;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1)
                shouldScreenWipe = true;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 40)
                shouldCreateAutoSavestate = true;
            if (bossSpawnCounter !== null && bossSpawnCounter === 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 80)
                enemies.push(Enemy_Level1BossCutscene.getEnemy({ enemyId: nextEnemyId++ }));
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                shouldScreenWipe,
                shouldCreateAutoSavestate
            };
            if (bossSpawnCounter === null || bossSpawnCounter < 1 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 80)
                returnVal.musicToPlay = 2 /* GameMusic.ForestTop */;
            return returnVal;
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(frameCount, bossSpawnCounter, enemyId);
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
        return getEnemy(0, null, enemyId);
    };
})());
