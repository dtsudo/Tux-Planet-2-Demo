let Enemy_Level1Boss_Phase2 = {};
((function () {
    const INITIAL_HP = 500;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, hp, transitionToPhase3Counter, enemyId) {
        let arcTangentScaled = function (x, y) {
            if (x === 0 && y === 0)
                return 0;
            return DTMath.arcTangentScaled(x, y);
        };
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
            let ATTACK_COOLDOWN_1;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_1 = 100;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_1 = 60;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_1 = 24;
                    break;
            }
            attackCooldown1--;
            if (attackCooldown1 <= 0 && transitionToPhase3Counter === null) {
                attackCooldown1 = ATTACK_COOLDOWN_1;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                let speed;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 30 * 128;
                        speed = 1536;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 15 * 128;
                        speed = 2 * 1024;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 10 * 128;
                        speed = 3 * 1024;
                        break;
                }
                for (let i = rng.nextInt(increment); i < 360 * 128; i += increment) {
                    enemies.push(Enemy_Bullet_Iceball.getEnemy({
                        xMibi: xMibi,
                        yMibi: yMibi,
                        speed: speed,
                        angleScaled: i,
                        xVelocityOffsetInMibipixelsPerFrame: 0,
                        hasCollisionWithTilemap: false,
                        gameImage: 35 /* GameImage.Iceball */,
                        enemyId: nextEnemyId++
                    }));
                }
            }
            let ATTACK_COOLDOWN_2;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_2 = 236;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_2 = 160;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_2 = 70;
                    break;
            }
            attackCooldown2--;
            if (attackCooldown2 <= 0 && transitionToPhase3Counter === null) {
                attackCooldown2 = ATTACK_COOLDOWN_2;
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
                enemies.push(Enemy_Bullet_Freezewave.getEnemy({ xMibi: xMibi, yMibi: yMibi, playerState: playerState, speed: freezewaveSpeed, scalingFactorScaled: 3 * 128, hasCollisionWithTilemap: false, enemyId: nextEnemyId++ }));
                let initialAngleScaled = arcTangentScaled(playerState.xMibi - xMibi, playerState.yMibi - yMibi);
                enemies.push(Enemy_Bullet_Homing.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    initialAngleScaled: initialAngleScaled + 50 * 128,
                    enemyId: nextEnemyId++
                }));
                enemies.push(Enemy_Bullet_Homing.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    initialAngleScaled: initialAngleScaled - 50 * 128,
                    enemyId: nextEnemyId++
                }));
            }
            if (hp <= 0 && transitionToPhase3Counter === null)
                transitionToPhase3Counter = 0;
            if (transitionToPhase3Counter !== null)
                transitionToPhase3Counter++;
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter >= 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180) {
                let phase3Boss = Enemy_Level1Boss_Phase3.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [phase3Boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level1Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter === 2)
                returnVal.shouldScreenWipe = true;
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter === 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 60)
                returnVal.shouldCreateAutoSavestate = true;
            return returnVal;
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
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, hp, transitionToPhase3Counter, enemyId);
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
    Enemy_Level1Boss_Phase2.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, 240, INITIAL_HP, null, enemyId);
    };
})());
