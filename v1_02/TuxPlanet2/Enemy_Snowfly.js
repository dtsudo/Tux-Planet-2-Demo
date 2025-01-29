let Enemy_Snowfly = ((function () {
    let getAttackCooldown = function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 70;
            case 1 /* Difficulty.Normal */: return 48;
            case 2 /* Difficulty.Hard */: return 20;
        }
    };
    let getEnemy = function (xMibi, yMibi, yInitialMibi, yAngleScaled, hp, attackCooldown, attackAngle1, attackAngle2, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, tilemap, soundOutput }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            let x = xMibi >> 10;
            let y = yMibi >> 10;
            if (x < -50 || x > GlobalConstants.WINDOW_WIDTH + 250 || y < -250 || y > GlobalConstants.WINDOW_HEIGHT + 250)
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
            yAngleScaled += 48;
            if (yAngleScaled >= 360 * 128)
                yAngleScaled -= 360 * 128;
            yMibi = yInitialMibi + 90 * DTMath.sineScaled(yAngleScaled);
            let enemies = [thisObj];
            if (attackCooldown === null)
                attackCooldown = rng.nextInt(getAttackCooldown(difficulty));
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = getAttackCooldown(difficulty);
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                let numBullets;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 700;
                        numBullets = 3;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 600;
                        numBullets = 3;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 1500;
                        numBullets = 3;
                        break;
                }
                attackAngle1 += increment;
                if (attackAngle1 >= 360 * 128)
                    attackAngle1 -= 360 * 128;
                let delta = Math.floor(360 * 128 / numBullets);
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Strawberry.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        angleScaled: attackAngle1 + delta * i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
                        enemyId: nextEnemyId++
                    }));
                }
                attackAngle2 -= increment;
                if (attackAngle2 < 0)
                    attackAngle2 += 360 * 128;
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Strawberry.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        angleScaled: attackAngle2 + delta * i,
                        xVelocityOffsetInMibipixelsPerFrame: tilemap.getXVelocityForEnemiesInMibipixelsPerFrame(),
                        hasCollisionWithTilemap: true,
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
                    xMibi: xMibi - 3 * 7 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 14 * 1024,
                    heightMibi: 3 * 16 * 1024
                }];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(14 /* GameImage.Snowfly_Mirrored */, spriteNum * 15, 0, 15, 18, (xMibi >> 10) - 3 * 7, (yMibi >> 10) - 3 * 9, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, yInitialMibi, yAngleScaled, hp, attackCooldown, attackAngle1, attackAngle2, frameCounter, screenWipeCountdown, enemyId);
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
        getEnemy: function ({ xMibi, yInitialMibi, yAngleScaled, attackAngle1, attackAngle2, difficulty, enemyId }) {
            yAngleScaled = DTMath.normalizeDegreesScaled(yAngleScaled);
            attackAngle1 = DTMath.normalizeDegreesScaled(attackAngle1);
            attackAngle2 = DTMath.normalizeDegreesScaled(attackAngle2);
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
            let yMibi = yInitialMibi + 90 * DTMath.sineScaled(yAngleScaled);
            return getEnemy(xMibi, yMibi, yInitialMibi, yAngleScaled, hp, null, attackAngle1, attackAngle2, 0, null, enemyId);
        }
    };
})());
