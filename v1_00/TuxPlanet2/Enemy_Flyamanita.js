let Enemy_Flyamanita = {};
((function () {
    let ATTACK_COOLDOWN = 120;
    let getEnemy = function (xMibi, yMibi, yInitialMibi, yAngleScaled, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
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
                    displayAngleScaled: rng.nextInt(360 * 128),
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
            xMibi -= 1000;
            yAngleScaled += 128 * 3;
            if (yAngleScaled >= 360 * 128)
                yAngleScaled -= 360 * 128;
            yMibi = yInitialMibi + Math.floor(100 * DTMath.sineScaled(yAngleScaled));
            let enemies = [thisObj];
            attackCooldown--;
            if (attackCooldown <= 0 && screenWipeCountdown === null) {
                attackCooldown = ATTACK_COOLDOWN;
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
                        increment = 30 * 128;
                        break;
                }
                for (let i = rng.nextInt(increment); i < 360 * 128; i += increment) {
                    enemies.push(Enemy_Bullet_Noone.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        directionScaled: i,
                        rotatesClockwise: rng.nextBool(),
                        displayAngleScaled: rng.nextInt(360 * 128),
                        gameImage: 12 /* GameImage.Noone */,
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
                    xMibi: xMibi - 3 * 8 * 1024,
                    yMibi: yMibi - 3 * 8 * 1024,
                    widthMibi: 3 * 16 * 1024,
                    heightMibi: 3 * 16 * 1024
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
            let spriteNum = Math.floor(frameCounter / 10) % 4;
            displayOutput.drawImageRotatedClockwise(10 /* GameImage.FlyAmanita */, spriteNum * 20, 0, 20, 20, (xMibi >> 10) - 3 * 10, (yMibi >> 10) - 3 * 10, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, yInitialMibi, yAngleScaled, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId);
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
    Enemy_Flyamanita.getEnemy = function ({ yInitialMibi, yAngleScaled, enemyId }) {
        yAngleScaled = DTMath.normalizeDegreesScaled(yAngleScaled);
        let hp = 50;
        let xMibi = (GlobalConstants.WINDOW_WIDTH + 50) << 10;
        let yMibi = yInitialMibi + Math.floor(100 * DTMath.sineScaled(yAngleScaled));
        return getEnemy(xMibi, yMibi, yInitialMibi, yAngleScaled, hp, ATTACK_COOLDOWN, 0, null, enemyId);
    };
})());
