// REVIEW ME
let GameStateProcessing = {
    processFrame: function (gameState, frameInput, soundOutput, musicOutput) {
        let enemyMapping = {};
        for (let enemy of gameState.enemies)
            enemyMapping[enemy.enemyId] = enemy;
        if (gameState.cutscene !== null) {
            let cutsceneResult = gameState.cutscene.processFrame(gameState, enemyMapping, frameInput, musicOutput);
            frameInput = cutsceneResult.updatedFrameInput;
        }
        PlayerStateProcessing.processFrame(gameState, frameInput, soundOutput);
        PlayerBulletStateProcessing.processFrame(gameState, frameInput);
        let enemyProcessingResult = EnemyProcessing.processFrame(gameState, enemyMapping, frameInput, soundOutput, musicOutput);
        let shouldScreenWipe = enemyProcessingResult.shouldScreenWipe;
        let shouldCreateAutoSavestate = enemyProcessingResult.shouldCreateAutoSavestate;
        let shouldEndLevel = enemyProcessingResult.shouldEndLevel && gameState.playerState.isDeadFrameCount === null;
        if (enemyProcessingResult.cutscene !== null)
            gameState.cutscene = enemyProcessingResult.cutscene;
        gameState.bossHealthDisplay.setHealthPercentage(enemyProcessingResult.bossHealthDisplayValue);
        enemyMapping = enemyProcessingResult.enemyMapping;
        gameState.bossHealthDisplay.processFrame();
        EnemyCollision.processCollisionBetweenPlayerAndEnemies(gameState);
        EnemyCollision.processCollisionBetweenPlayerBulletsAndEnemies(gameState);
        if (shouldScreenWipe) {
            let rng = DTDeterministicRandomUtil.getRandom(gameState.rngSeed);
            for (let enemy of gameState.enemies) {
                let screenWipeCountdown = rng.nextInt(30);
                enemy.onScreenWipe(screenWipeCountdown, gameState);
            }
            gameState.rngSeed = rng.getSeed();
        }
        let rng = DTDeterministicRandomUtil.getRandom(gameState.rngSeed);
        if (frameInput.up) {
            rng.addSeed(gameState.frameCount);
            rng.nextInt(2);
        }
        if (frameInput.down) {
            rng.addSeed(gameState.frameCount + 1);
            rng.nextInt(2);
        }
        if (frameInput.left) {
            rng.addSeed(gameState.frameCount + 2);
            rng.nextInt(2);
        }
        if (frameInput.right) {
            rng.addSeed(gameState.frameCount + 3);
            rng.nextInt(2);
        }
        gameState.rngSeed = rng.getSeed();
        gameState.background.processFrame();
        gameState.frameCount++;
        return {
            shouldCreateAutoSavestate,
            shouldEndLevel
        };
    }
};
