// REVIEW ME
let EnemyProcessing = {
    processFrame: function (gameState, enemyMapping, frameInput, soundOutput, musicOutput) {
        let enemiesToBeProcessed = gameState.enemies;
        let newEnemies = [];
        let newEnemyMapping = {};
        let shouldScreenWipe = false;
        let shouldCreateAutoSavestate = false;
        let cutscene = null;
        let bossHealthDisplayValue = null;
        let shouldEndLevel = false;
        while (true) {
            if (enemiesToBeProcessed.length === 0)
                break;
            let newlyCreatedEnemies = [];
            for (let enemy of enemiesToBeProcessed) {
                let result = enemy.processFrame(enemy, enemyMapping, gameState.rngSeed, gameState.nextEnemyId, gameState.difficulty, gameState.playerState, soundOutput);
                gameState.nextEnemyId = result.nextEnemyId;
                gameState.rngSeed = result.newRngSeed;
                if (result.shouldEndLevel)
                    shouldEndLevel = true;
                if (result.musicToPlay)
                    musicOutput.playMusic(result.musicToPlay, 100);
                if (result.shouldScreenWipe)
                    shouldScreenWipe = true;
                if (result.shouldCreateAutoSavestate)
                    shouldCreateAutoSavestate = true;
                if (result.bossHealthDisplayValue !== undefined && result.bossHealthDisplayValue !== null)
                    bossHealthDisplayValue = result.bossHealthDisplayValue;
                if (result.cutscene)
                    cutscene = result.cutscene;
                for (let resultEnemy of result.enemies) {
                    if (resultEnemy.enemyId === enemy.enemyId) {
                        newEnemies.push(resultEnemy);
                        newEnemyMapping[resultEnemy.enemyId] = resultEnemy;
                    }
                    else {
                        newlyCreatedEnemies.push(resultEnemy);
                        enemyMapping[resultEnemy.enemyId] = resultEnemy;
                    }
                }
            }
            enemiesToBeProcessed = newlyCreatedEnemies;
        }
        gameState.enemies = newEnemies;
        enemyMapping = newEnemyMapping;
        return {
            shouldScreenWipe,
            shouldCreateAutoSavestate,
            cutscene,
            bossHealthDisplayValue,
            enemyMapping,
            shouldEndLevel
        };
    }
};
