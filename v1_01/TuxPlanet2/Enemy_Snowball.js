let Enemy_Snowball = {};
((function () {
    let getEnemy = function (xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, frameCounter, screenWipeCountdown, enemyId) {
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
            let movementSpeed = 1000;
            if (isFacingRight) {
                let testX = xMibi + movementSpeed + 1024 * 8 * 3;
                let testY1 = yMibi + 1024 * 8 * 3;
                let testY2 = yMibi - 1024 * 5 * 3;
                if (tilemap.isSolid(testX, testY1) || tilemap.isSolid(testX, testY2)) {
                    isFacingRight = false;
                }
                else {
                    xMibi += movementSpeed;
                }
            }
            else {
                let testX = xMibi - movementSpeed - 1024 * 8 * 3;
                let testY1 = yMibi + 1024 * 8 * 3;
                let testY2 = yMibi - 1024 * 5 * 3;
                if (tilemap.isSolid(testX, testY1) || tilemap.isSolid(testX, testY2)) {
                    isFacingRight = true;
                }
                else {
                    xMibi -= movementSpeed;
                }
            }
            let shouldAttack = false;
            yMibi += ySpeedInMibipixelsPerFrame;
            while (true) {
                if (tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) || tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                    ySpeedInMibipixelsPerFrame = 8000;
                    yMibi += 1024;
                    shouldAttack = true;
                }
                else {
                    break;
                }
            }
            if (!tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) && !tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                ySpeedInMibipixelsPerFrame -= 180;
            }
            let enemies = [thisObj];
            if (shouldAttack && screenWipeCountdown === null) {
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 120 * 128;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 60 * 128;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 15 * 128;
                        break;
                }
                for (let i = rng.nextInt(increment); i < 360 * 128; i += increment) {
                    enemies.push(Enemy_Bullet_Iceball.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speed: 3000,
                        angleScaled: i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
                        gameImage: 23 /* GameImage.Iceball */,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            frameCounter++;
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
            let spriteNum = Math.floor(frameCounter / 16) % 8;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 27 /* GameImage.BouncySnow */ : 28 /* GameImage.BouncySnow_Mirrored */, spriteNum * 16, 0, 16, 16, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 8, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, frameCounter, screenWipeCountdown, enemyId);
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
    Enemy_Snowball.getEnemy = function ({ xInitialMibi, yInitialMibi, isFacingRight, difficulty, enemyId }) {
        let hp;
        switch (difficulty) {
            case 0 /* Difficulty.Easy */:
                hp = 36;
                break;
            case 1 /* Difficulty.Normal */:
                hp = 46;
                break;
            case 2 /* Difficulty.Hard */:
                hp = 50;
                break;
        }
        let ySpeedInMibipixelsPerFrame = 0;
        return getEnemy(xInitialMibi, yInitialMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, 0, null, enemyId);
    };
})());
