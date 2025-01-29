let Enemy_Level2Boss_Phase3 = {};
((function () {
    const INITIAL_HP = 400;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (playerState.yMibi - yMibi >= 1024 * 20) {
                if (ySpeed < 500)
                    ySpeed += 8;
            }
            if (playerState.yMibi - yMibi <= -1024 * 20) {
                if (ySpeed > -500)
                    ySpeed -= 8;
            }
            frameCounter++;
            let enemies = [thisObj];
            let ATTACK_COOLDOWN;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN = 15;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN = 7;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN = 4;
                    break;
            }
            attackCooldown--;
            if (attackCooldown <= 0) {
                attackCooldown = ATTACK_COOLDOWN;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let angleToPlayer = DTMath.arcTangentScaledSafe(playerState.xMibi - xMibi, playerState.yMibi - yMibi);
                let direction = rng.nextBool() ? -1 : 1;
                enemies.push(Enemy_Bullet_Fireball_Homing.getEnemy({
                    xInitialMibi: xMibi,
                    yInitialMibi: yMibi,
                    targetPixelSpeedInMibipixelsPerFrame: 48000,
                    targetPixelAngleScaled1: angleToPlayer + (130 * 128 + rng.nextInt(40 * 128)) * direction,
                    targetPixelAngleScaled2: angleToPlayer + (50 * 128 + rng.nextInt(40 * 128)) * direction,
                    targetPixelAngleOffsetScaled3: rng.nextInt(10 * 128) - 5 * 128,
                    switchToPhase2Cutoff: 8 + rng.nextInt(5),
                    switchToPhase3Cutoff: 18 + rng.nextInt(5),
                    speedInMibipixelsPerFrame: 12000 + rng.nextInt(4000),
                    enemyId: nextEnemyId++
                }));
            }
            if (hp <= 0) {
                let deadBoss = Enemy_Level2Boss_Dead.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [deadBoss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            return {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level2Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 9 * 3 * 1024,
                yMibi: yMibi - 12 * 3 * 1024,
                widthMibi: 22 * 3 * 1024,
                heightMibi: 23 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 24) % 6;
            displayOutput.drawImageRotatedClockwise(29 /* GameImage.DarkKonqi_Mirrored */, spriteNum * 32, 128, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            if (hp > 0)
                hp--;
            return true;
        };
        return {
            getSnapshot: getSnapshot,
            enemyId: enemyId,
            isBullet: false,
            isBackground: false,
            processFrame: processFrame,
            getHitboxes: getHitboxes,
            getDamageboxes: getDamageboxes,
            onCollideWithPlayer: function () { return false; },
            onCollideWithPlayerBullet: onCollideWithPlayerBullet,
            onScreenWipe: function (countdown) { },
            render: render
        };
    };
    Enemy_Level2Boss_Phase3.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, INITIAL_HP, enemyId);
    };
})());
