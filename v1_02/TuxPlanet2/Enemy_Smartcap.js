let Enemy_Smartcap = {};
((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 260;
            case 1 /* Difficulty.Normal */: return 155;
            case 2 /* Difficulty.Hard */: return 100;
        }
    };
    let getEnemy = function (xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 250 || y < -50 || y > GlobalConstants.WINDOW_HEIGHT + 50)
                return {
                    enemies: [],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
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
            yMibi += ySpeedInMibipixelsPerFrame;
            while (true) {
                if (tilemap.isSolid(xMibi - 1024 * 7 * 3, yMibi - 1024 * 8 * 3) || tilemap.isSolid(xMibi + 1024 * 7 * 3, yMibi - 1024 * 8 * 3)) {
                    ySpeedInMibipixelsPerFrame = 0;
                    yMibi += 1024;
                }
                else {
                    break;
                }
            }
            ySpeedInMibipixelsPerFrame -= 180;
            let enemies = [thisObj];
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
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
                        increment = 45 * 128;
                        break;
                }
                for (let i = rng.nextInt(increment); i < 360 * 128; i += increment) {
                    enemies.push(Enemy_Bullet_Noone.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        directionScaled: i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        rotatesClockwise: rng.nextBool(),
                        displayAngleScaled: rng.nextInt(360 * 128),
                        gameImage: 18 /* GameImage.Noone */,
                        difficulty: difficulty,
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
            let spriteNum = Math.floor(frameCounter / 16) % 4;
            displayOutput.drawImageRotatedClockwise(isFacingRight ? 11 /* GameImage.Smartcap */ : 12 /* GameImage.Smartcap_Mirrored */, spriteNum * 16, 0, 16, 18, (xMibi >> 10) - 3 * 8, (yMibi >> 10) - 3 * 9, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId);
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
    Enemy_Smartcap.getEnemy = function ({ xInitialMibi, yInitialMibi, isFacingRight, difficulty, enemyId }) {
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
        let attackCooldown = getAttackCooldown(difficulty);
        return getEnemy(xInitialMibi, yInitialMibi, isFacingRight, ySpeedInMibipixelsPerFrame, hp, attackCooldown, 0, null, enemyId);
    };
})());
