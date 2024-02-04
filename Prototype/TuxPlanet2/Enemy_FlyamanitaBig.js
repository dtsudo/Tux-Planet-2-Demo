// REVIEW ME
let Enemy_FlyamanitaBig = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, hp, attackCooldown1, attackCooldown2, frameCounter, screenWipeCountdown, enemyId) {
        let processFrame = function (thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput) {
            let ATTACK_COOLDOWN_1;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_1 = 50;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_1 = 17;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_1 = 11;
                    break;
            }
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi -= xSpeed;
            xSpeed -= 40;
            if (xSpeed > 0 && xSpeed <= 40) {
                if (difficulty === 2 /* Difficulty.Hard */)
                    attackCooldown1 = rng.nextInt(ATTACK_COOLDOWN_1);
            }
            if (xSpeed <= 0)
                xSpeed = 0;
            if (hp <= 0 || frameCounter >= 600 || screenWipeCountdown !== null && screenWipeCountdown <= 0) {
                let explode = Enemy_Background_Explode.getEnemy(xMibi, yMibi, 128 * 3 * 3, rng.nextInt(360 * 128), nextEnemyId);
                nextEnemyId++;
                return {
                    enemies: [explode],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed(),
                    shouldEndLevel: false
                };
            }
            let enemies = [thisObj];
            if (xSpeed === 0) {
                attackCooldown1--;
                if (attackCooldown1 <= 0 && screenWipeCountdown === null) {
                    attackCooldown1 = ATTACK_COOLDOWN_1;
                    soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                    enemies.push(Enemy_Bullet_Freezewave.getEnemy(xMibi, yMibi, playerState, difficulty, nextEnemyId));
                    nextEnemyId++;
                }
            }
            // TODO: attackCooldown2
            if (screenWipeCountdown !== null)
                screenWipeCountdown--;
            frameCounter++;
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                shouldEndLevel: false
            };
        };
        let getHitboxes = function () {
            return [{
                    xMibi: xMibi - 24 * 1024 * 3,
                    yMibi: yMibi - 24 * 1024 * 3,
                    widthMibi: 48 * 1024 * 3,
                    heightMibi: 48 * 1024 * 3
                }];
        };
        let getDamageboxes = function () {
            return [{
                    xMibi: xMibi - 24 * 1024 * 3,
                    yMibi: yMibi - 24 * 1024 * 3,
                    widthMibi: 48 * 1024 * 3,
                    heightMibi: 48 * 1024 * 3
                }];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 10) % 4;
            displayOutput.drawImageRotatedClockwise(6 /* GameImage.FlyAmanita */, spriteNum * 20, 0, 20, 20, (xMibi >> 10) - 90, (yMibi >> 10) - 90, 0, 128 * 3 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, hp, attackCooldown1, attackCooldown2, frameCounter, screenWipeCountdown, enemyId);
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
            onScreenWipe,
            render: render
        };
    };
    Enemy_FlyamanitaBig.getEnemy = function (yMibi, enemyId, rng) {
        let hp = 250;
        let xSpeed = 5000;
        return getEnemy((GlobalConstants.WINDOW_WIDTH + 100) << 10, yMibi, xSpeed, hp, 0, 0, 0, null, enemyId);
    };
})());
