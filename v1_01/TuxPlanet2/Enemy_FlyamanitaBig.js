let Enemy_FlyamanitaBig = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput }) {
            let ATTACK_COOLDOWN;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN = 100;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN = 34;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN = 22;
                    break;
            }
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi -= xSpeed;
            xSpeed -= 10;
            if (xSpeed <= 0)
                xSpeed = 0;
            if (xSpeed > 0) {
                if (difficulty === 2 /* Difficulty.Hard */)
                    attackCooldown = rng.nextInt(ATTACK_COOLDOWN);
            }
            if (hp <= 0 || frameCounter >= 1200 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    displayAngleScaled: rng.nextInt(360 * 128),
                    scalingFactorScaled: 128 * 3 * 3,
                    renderOnTop: false,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let enemies = [thisObj];
            if (xSpeed === 0) {
                attackCooldown--;
                if (attackCooldown <= 0 && screenWipeCountdown === null) {
                    attackCooldown = ATTACK_COOLDOWN;
                    soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                    let freezewaveSpeed;
                    switch (difficulty) {
                        case 0 /* Difficulty.Easy */:
                            freezewaveSpeed = 5;
                            break;
                        case 1 /* Difficulty.Normal */:
                            freezewaveSpeed = 10;
                            break;
                        case 2 /* Difficulty.Hard */:
                            freezewaveSpeed = 15;
                            break;
                    }
                    enemies.push(Enemy_Bullet_Freezewave.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        playerState: playerState,
                        speed: freezewaveSpeed,
                        scalingFactorScaled: 3 * 128,
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
            let hitbox = {
                xMibi: xMibi - 3 * 8 * 3 * 1024,
                yMibi: yMibi - 3 * 8 * 3 * 1024,
                widthMibi: 3 * 16 * 3 * 1024,
                heightMibi: 3 * 16 * 3 * 1024
            };
            return [hitbox];
        };
        let getDamageboxes = function () {
            let hitbox = {
                xMibi: xMibi - 3 * 8 * 3 * 1024,
                yMibi: yMibi - 3 * 8 * 3 * 1024,
                widthMibi: 3 * 16 * 3 * 1024,
                heightMibi: 3 * 16 * 3 * 1024
            };
            return [hitbox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(10 /* GameImage.FlyAmanita */, spriteNum * 20, 0, 20, 20, (xMibi >> 10) - 3 * 3 * 10, (yMibi >> 10) - 3 * 3 * 10, 0, 128 * 3 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, hp, attackCooldown, frameCounter, screenWipeCountdown, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
            screenWipeCountdown = countdown;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return true; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: onScreenWipe,
            render: render
        };
    };
    Enemy_FlyamanitaBig.getEnemy = function ({ yMibi, enemyId }) {
        let hp = 250;
        let xSpeed = 2500;
        return getEnemy((GlobalConstants.WINDOW_WIDTH + 100) << 10, yMibi, xSpeed, hp, 0, 0, null, enemyId);
    };
})());
