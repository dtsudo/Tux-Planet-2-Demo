let Enemy_Level2Boss_Phase1 = {};
Enemy_Level2Boss_Phase1.BOSS_MUSIC = 1 /* GameMusic.ChiptuneLevel3 */;
((function () {
    let INITIAL_HP = 575;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, attack2IsNextAttackClockwise, transitionToPhase2Counter, hp, enemyId) {
        let processFrame = function ({ thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput, tilemap }) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            frameCounter++;
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
            let enemies = [thisObj];
            let ATTACK_COOLDOWN_1;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_1 = 5;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_1 = 4;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_1 = 3;
                    break;
            }
            attackCooldown1--;
            if (attackCooldown1 <= 0 && transitionToPhase2Counter === null) {
                attackCooldown1 = ATTACK_COOLDOWN_1;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let numFireballs;
                let baseSpeed;
                let maxSpeedIncrement;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        numFireballs = 1;
                        baseSpeed = 1150;
                        maxSpeedIncrement = 2000;
                        break;
                    case 1 /* Difficulty.Normal */:
                        numFireballs = 2;
                        baseSpeed = 1700;
                        maxSpeedIncrement = 2950;
                        break;
                    case 2 /* Difficulty.Hard */:
                        numFireballs = 5;
                        baseSpeed = 2300;
                        maxSpeedIncrement = 4000;
                        break;
                }
                for (let i = 0; i < numFireballs; i++) {
                    enemies.push(Enemy_Bullet_Fireball_Normal.getEnemy({
                        xInitialMibi: xMibi,
                        yInitialMibi: yMibi,
                        angleScaled: rng.nextInt(360 * 128),
                        speedInMibipixelsPerFrame: baseSpeed + rng.nextInt(maxSpeedIncrement),
                        enemyId: nextEnemyId++
                    }));
                }
            }
            let ATTACK_COOLDOWN_2;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_2 = 360;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_2 = 160;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_2 = 40;
                    break;
            }
            attackCooldown2--;
            if (attackCooldown2 <= 0 && transitionToPhase2Counter === null) {
                attackCooldown2 = ATTACK_COOLDOWN_2;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let numBullets;
                let angularSpeed;
                let radiusSpeed;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        numBullets = 5;
                        angularSpeed = 43;
                        radiusSpeed = 853;
                        break;
                    case 1 /* Difficulty.Normal */:
                        numBullets = 7;
                        angularSpeed = 64;
                        radiusSpeed = 1280;
                        break;
                    case 2 /* Difficulty.Hard */:
                        numBullets = 12;
                        angularSpeed = 128;
                        radiusSpeed = 2560;
                        break;
                }
                let delta = Math.floor(360 * 128 / numBullets);
                let offset = rng.nextInt(delta);
                for (let i = 0; i < numBullets; i++) {
                    enemies.push(Enemy_Bullet_Fireball_Spiral.getEnemy({
                        xInitialMibi: xMibi,
                        yInitialMibi: yMibi,
                        angleScaled: offset + delta * i,
                        angularSpeedInAngleScaledPerFrame: angularSpeed,
                        radiusSpeedInMibipixelsPerFrame: radiusSpeed,
                        isRotatingClockwise: attack2IsNextAttackClockwise,
                        enemyId: nextEnemyId++
                    }));
                }
                attack2IsNextAttackClockwise = !attack2IsNextAttackClockwise;
            }
            if (hp <= 0 && transitionToPhase2Counter === null)
                transitionToPhase2Counter = 0;
            if (transitionToPhase2Counter !== null)
                transitionToPhase2Counter++;
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter >= 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180) {
                let phase2Boss = Enemy_Level2Boss_Phase2.getEnemy({
                    xMibi: xMibi,
                    yMibi: yMibi,
                    xSpeed: xSpeed,
                    ySpeed: ySpeed,
                    frameCounter: frameCounter,
                    enemyId: nextEnemyId++
                });
                return {
                    enemies: [phase2Boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: Enemy_Level2Boss_Phase1.BOSS_MUSIC,
                bossHealthDisplayValue: Math.ceil(hp * 100 / INITIAL_HP)
            };
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter === 2)
                returnVal.shouldScreenWipe = true;
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter === 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 60)
                returnVal.shouldCreateAutoSavestate = true;
            return returnVal;
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
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, attack2IsNextAttackClockwise, transitionToPhase2Counter, hp, enemyId);
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
    Enemy_Level2Boss_Phase1.getEnemy = function ({ xMibi, yMibi, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, 0, 0, frameCounter, 0, 0, true, null, INITIAL_HP, enemyId);
    };
})());
