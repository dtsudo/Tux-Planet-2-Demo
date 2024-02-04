let PlayerStateProcessing = {
    processFrame: function (gameState, frameInput, soundOutput) {
        let rng = DTDeterministicRandomUtil.getRandom(gameState.rngSeed);
        if (gameState.playerState.isDeadFrameCount !== null) {
            gameState.playerState.isDeadFrameCount++;
            if (gameState.playerState.isDeadFrameCount === 1)
                soundOutput.playSound(1 /* GameSound.Cut */, 100);
        }
        if (gameState.playerState.isDeadFrameCount === null) {
            let playerXMibi = gameState.playerState.xMibi;
            let playerYMibi = gameState.playerState.yMibi;
            let up = frameInput.up;
            let down = frameInput.down;
            let left = frameInput.left;
            let right = frameInput.right;
            let movingDiagonally = up && left || up && right || down && left || down && right;
            let xDelta = 0;
            let yDelta = 0;
            let movement = (movingDiagonally ? 7071 : 10000);
            if (up)
                yDelta += movement;
            else if (down)
                yDelta -= movement;
            if (right)
                xDelta += movement;
            else if (left)
                xDelta -= movement;
            playerXMibi += xDelta;
            playerYMibi += yDelta;
            if (playerXMibi < 48 * 1024)
                playerXMibi = 48 * 1024;
            if (playerXMibi > (GlobalConstants.WINDOW_WIDTH - 48) << 10)
                playerXMibi = (GlobalConstants.WINDOW_WIDTH - 48) << 10;
            if (playerYMibi < 48 * 1024)
                playerYMibi = 48 * 1024;
            if (playerYMibi > (GlobalConstants.WINDOW_HEIGHT - 48) << 10)
                playerYMibi = (GlobalConstants.WINDOW_HEIGHT - 48) << 10;
            gameState.playerState.xMibi = playerXMibi;
            gameState.playerState.yMibi = playerYMibi;
            if (gameState.playerState.attackCooldown > 0)
                gameState.playerState.attackCooldown--;
            if (gameState.playerState.attackSoundCooldown > 0)
                gameState.playerState.attackSoundCooldown--;
            if (frameInput.shoot && gameState.playerState.attackCooldown <= 0) {
                gameState.playerState.attackCooldown = 1;
                if (gameState.playerState.attackSoundCooldown <= 0) {
                    gameState.playerState.attackSoundCooldown = 4;
                    soundOutput.playSound(2 /* GameSound.PlayerShoot */, 100);
                }
                for (let i = 0; i < 3; i++) {
                    let xSpeedInMibipixelsPerFrame = 15000 + rng.nextInt(7000);
                    let ySpeedInMibipixelsPerFrame = rng.nextInt(8000) - 4000;
                    let arctanScaled = DTMath.arcTangentScaled(xSpeedInMibipixelsPerFrame, ySpeedInMibipixelsPerFrame);
                    arctanScaled = -arctanScaled - 90 * 128;
                    let newPlayerBullet = {
                        xMibi: playerXMibi,
                        yMibi: playerYMibi,
                        xSpeedInMibipixelsPerFrame: xSpeedInMibipixelsPerFrame,
                        ySpeedInMibipixelsPerFrame: ySpeedInMibipixelsPerFrame,
                        displayRotationScaled: arctanScaled,
                        animationOffset: rng.nextInt(1000)
                    };
                    gameState.playerBulletState.playerBullets.push(newPlayerBullet);
                }
            }
        }
        gameState.rngSeed = rng.getSeed();
    }
};
