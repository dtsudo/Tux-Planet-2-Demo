let PlayerStateProcessing = {
    processFrame: function (gameState, frameInput, soundOutput) {
        if (gameState.playerState.isDeadFrameCount !== null) {
            gameState.playerState.isDeadFrameCount++;
            if (gameState.playerState.isDeadFrameCount === 1)
                soundOutput.playSound(1 /* GameSound.Cut */, 100);
        }
        if (gameState.playerState.isDeadFrameCount === null) {
            PlayerStateProcessing_Movement.processPlayerMovement(gameState, frameInput, soundOutput);
            if (gameState.playerState.attackCooldown > 0)
                gameState.playerState.attackCooldown--;
            if (gameState.playerState.attackSoundCooldown > 0)
                gameState.playerState.attackSoundCooldown--;
            if (frameInput.shoot && gameState.playerState.attackCooldown <= 0) {
                gameState.playerState.attackCooldown = 2;
                if (gameState.playerState.attackSoundCooldown <= 0) {
                    gameState.playerState.attackSoundCooldown = 8;
                    soundOutput.playSound(2 /* GameSound.PlayerShoot */, 100);
                }
                let rng = DTDeterministicRandomUtil.getRandom(gameState.rngSeed);
                for (let i = 0; i < 3; i++) {
                    let xSpeedInMibipixelsPerFrame = 7500 + rng.nextInt(3500);
                    let ySpeedInMibipixelsPerFrame = rng.nextInt(4000) - 2000;
                    let arctanScaled = DTMath.arcTangentScaled(xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame);
                    arctanScaled = -arctanScaled - 90 * 128;
                    let newPlayerBullet = {
                        xMibi: gameState.playerState.xMibi,
                        yMibi: gameState.playerState.yMibi,
                        xSpeedInMibipixelsPerFrame: xSpeedInMibipixelsPerFrame,
                        ySpeedInMibipixelsPerFrame: ySpeedInMibipixelsPerFrame,
                        displayRotationScaled: arctanScaled,
                        animationOffset: rng.nextInt(1000)
                    };
                    gameState.playerBulletState.playerBullets.push(newPlayerBullet);
                }
                gameState.rngSeed = rng.getSeed();
            }
        }
    }
};
