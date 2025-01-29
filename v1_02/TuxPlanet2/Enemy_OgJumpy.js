let Enemy_OgJumpy = ((function () {
    let getEnemy = function (xMibi, yMibi, ySpeedInMibipixelsPerFrame, hp, animationFrameCounter, screenWipeCountdown, enemyId) {
        let arcTangentScaled = function (x, y) {
            if (x === 0 && y === 0)
                return 0;
            return DTMath.arcTangentScaled(x, y);
        };
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 250 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50) {
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            if (hp <= 0 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(4) * (90 * 128),
                    scalingFactorScaled: 128 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            xMibi += tilemap.getXVelocityForEnemiesInMibipixelsPerFrame();
            yMibi += ySpeedInMibipixelsPerFrame;
            while (true) {
                if (tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) || tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                    ySpeedInMibipixelsPerFrame = 8000;
                    yMibi += 1024;
                    animationFrameCounter = 0;
                }
                else {
                    break;
                }
            }
            let oldYSpeed = ySpeedInMibipixelsPerFrame;
            ySpeedInMibipixelsPerFrame -= 180;
            let shouldAttack = oldYSpeed >= 1800 && ySpeedInMibipixelsPerFrame < 1800;
            let enemies = [thisObj];
            if (shouldAttack && screenWipeCountdown === null) {
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let attackAngleScaled = arcTangentScaled(playerState.xMibi - xMibi, playerState.yMibi - yMibi);
                let angleArray;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        angleArray = [-1, 1];
                        break;
                    case 1 /* Difficulty.Normal */:
                        angleArray = [-1, 0, 1];
                        break;
                    case 2 /* Difficulty.Hard */:
                        angleArray = [-2, -1, 0, 1, 2];
                        break;
                }
                for (let i of angleArray) {
                    enemies.push(Enemy_Bullet_Iceball.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speed: 3000,
                        angleScaled: attackAngleScaled + i * (128 * 15),
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
                        gameImage: 35 /* GameImage.Iceball */,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            animationFrameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed()
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 7 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 14 * 1024
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 3 * 8 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 16 * 1024,
                    heightMibi: 3 * 16 * 1024
                }];
        };
        let render = function (displayOutput) {
            let spriteNum;
            if (animationFrameCounter < 16)
                spriteNum = 2;
            else if (animationFrameCounter < 32)
                spriteNum = 1;
            else
                spriteNum = 0;
            displayOutput.drawImageRotatedClockwise(16 /* GameImage.OgJumpy_Mirrored */, spriteNum * 16, 0, 16, 25, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 12, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, ySpeedInMibipixelsPerFrame, hp, animationFrameCounter, screenWipeCountdown, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot,
            enemyId,
            isBullet: false,
            isBackground: false,
            processFrame,
            getHitboxes,
            getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe,
            render
        };
    };
    return {
        getEnemy: function ({ xInitialMibi, yInitialMibi, difficulty, enemyId }) {
            let hp;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    hp = 42;
                    break;
                case 1 /* Difficulty.Normal */:
                    hp = 46;
                    break;
                case 2 /* Difficulty.Hard */:
                    hp = 50;
                    break;
            }
            let ySpeedInMibipixelsPerFrame = 0;
            return getEnemy(xInitialMibi, yInitialMibi, ySpeedInMibipixelsPerFrame, hp, 100, null, enemyId);
        }
    };
})());
