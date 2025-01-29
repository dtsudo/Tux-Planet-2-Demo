let Enemy_Level1Boss_Phase3 = {};
((function () {
    const INITIAL_HP = 500;
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
            let handleCollisionWithTilemapResult = Enemy_Level1Boss_Phase1.handleCollisionWithTilemap({ xMibi, yMibi, ySpeed, tilemap });
            yMibi = handleCollisionWithTilemapResult.newYMibi;
            ySpeed = handleCollisionWithTilemapResult.newYSpeed;
            frameCounter++;
            let enemies = [thisObj];
            let ATTACK_COOLDOWN;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN = 100;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN = 44;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN = 8;
                    break;
            }
            attackCooldown--;
            if (attackCooldown <= 0) {
                attackCooldown = ATTACK_COOLDOWN;
                enemies.push(Enemy_Bullet_BouncySnow.getEnemy({
                    xMibi: (100 + rng.nextInt(800)) << 10,
                    angleScaled: -128 * (70 + rng.nextInt(40)),
                    explodeYMibi: (50 + rng.nextInt(400)) << 10,
                    difficulty: difficulty,
                    enemyId: nextEnemyId++
                }));
            }
            if (hp <= 0) {
                let deadBoss = Enemy_Level1Boss_Dead.getEnemy({
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
                musicToPlay: Enemy_Level1Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 16 * 3 * 1024,
                yMibi: yMibi - 16 * 3 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 32 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 20) % 4;
            displayOutput.drawImageRotatedClockwise(28 /* GameImage.OwlBrown */, 32 + spriteNum * 32, 0, 32, 32, (xMibi >> 10) - 16 * 3, (yMibi >> 10) - 16 * 3, 0, 128 * 3);
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
    Enemy_Level1Boss_Phase3.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, INITIAL_HP, enemyId);
    };
})());
