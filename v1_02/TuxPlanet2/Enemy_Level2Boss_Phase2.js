let Enemy_Level2Boss_Phase2 = {};
((function () {
    const INITIAL_HP = 525;
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, transitionToPhase3Counter, enemyId) {
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
                    ATTACK_COOLDOWN = 5;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN = 4;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN = 3;
                    break;
            }
            attackCooldown--;
            if (attackCooldown <= 0 && transitionToPhase3Counter === null) {
                attackCooldown = ATTACK_COOLDOWN;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let numFireballs;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        numFireballs = 1;
                        break;
                    case 1 /* Difficulty.Normal */:
                        numFireballs = 2;
                        break;
                    case 2 /* Difficulty.Hard */:
                        numFireballs = 5;
                        break;
                }
                for (let i = 0; i < numFireballs; i++) {
                    enemies.push(Enemy_Bullet_Fireball_Gravity.getEnemy({
                        xInitialMibi: xMibi,
                        yInitialMibi: yMibi,
                        xSpeedInMibipixelsPerFrame: rng.nextInt(16000) - 8000,
                        yInitialSpeedInMibipixelsPerFrame: 4000 + rng.nextInt(8000),
                        enemyId: nextEnemyId++
                    }));
                }
            }
            if (hp <= 0 && transitionToPhase3Counter === null)
                transitionToPhase3Counter = 0;
            if (transitionToPhase3Counter !== null)
                transitionToPhase3Counter++;
            if (transitionToPhase3Counter !== null && transitionToPhase3Counter >= 2 + GameStateProcessing.SCREEN_WIPE_MAX_COUNTDOWN + 180) {
                let phase3Boss = Enemy_Level2Boss_Phase3.getEnemy({
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
                musicToPlay: Enemy_Level2Boss_Phase1.BOSS_MUSIC,
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
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown, hp, transitionToPhase3Counter, enemyId);
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
    Enemy_Level2Boss_Phase2.getEnemy = function ({ xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId }) {
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, INITIAL_HP, null, enemyId);
    };
})());
