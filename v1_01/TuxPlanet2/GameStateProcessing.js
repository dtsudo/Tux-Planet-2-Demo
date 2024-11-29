let GameStateProcessing = {
    SCREEN_WIPE_MAX_COUNTDOWN: 60,
    processFrame: function (gameState, frameInput, soundOutput, musicOutput) {
        // The tilemap should be processed before the player or enemies.
        // (Otherwise, the player or enemy may end up being stuck inside solids
        // if the player/enemy is adjacent to a solid and the tilemap moves.)
        gameState.tilemap.processFrame();
        let enemyMapping = {};
        for (let enemy of gameState.enemies)
            enemyMapping[enemy.enemyId] = enemy;
        let shouldCreateAutoSavestate = false;
        if (gameState.cutscene !== null) {
            let cutsceneResult = gameState.cutscene.processFrame({ gameState, enemyMapping, frameInput, musicOutput });
            frameInput = cutsceneResult.updatedFrameInput;
            if (cutsceneResult.shouldCreateAutoSavestate)
                shouldCreateAutoSavestate = true;
        }
        if (frameInput.debug_toggleInvulnerability)
            gameState.debug_isInvulnerable = !gameState.debug_isInvulnerable;
        PlayerStateProcessing.processFrame(gameState, frameInput, soundOutput);
        PlayerBulletStateProcessing.processFrame(gameState);
        let enemyProcessingResult = EnemyProcessing.processFrame(gameState, enemyMapping, frameInput, soundOutput, musicOutput);
        let shouldScreenWipe = enemyProcessingResult.shouldScreenWipe;
        if (enemyProcessingResult.shouldCreateAutoSavestate)
            shouldCreateAutoSavestate = true;
        let shouldEndLevel = enemyProcessingResult.shouldEndLevel;
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
                let screenWipeCountdown = rng.nextInt(GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN);
                enemy.onScreenWipe(screenWipeCountdown);
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
            rng.nextInt(2);
        }
        if (frameInput.left) {
            rng.addSeed(gameState.frameCount + 2);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
        }
        if (frameInput.right) {
            rng.addSeed(gameState.frameCount + 3);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
        }
        if (frameInput.shoot) {
            rng.addSeed(gameState.frameCount + 4);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
            rng.nextInt(2);
        }
        gameState.rngSeed = rng.getSeed();
        gameState.background.processFrame();
        gameState.frameCount++;
        return {
            shouldCreateAutoSavestate: shouldCreateAutoSavestate && gameState.playerState.isDeadFrameCount === null,
            shouldEndLevel: shouldEndLevel && gameState.playerState.isDeadFrameCount === null
        };
    }
};
