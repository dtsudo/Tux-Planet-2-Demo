// REVIEW ME
let Enemy_Level1Boss_Phase1 = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, attack2AngleScaled, attack2AngleScaled2, transitionToPhase2Counter, hp, enemyId) {
        let processFrame = function (thisObj, enemyMapping, rngSeed, nextEnemyId, difficulty, playerState, soundOutput) {
            let rng = DTDeterministicRandomUtil.getRandom(rngSeed);
            xMibi += xSpeed;
            yMibi += ySpeed;
            if (playerState.yMibi - yMibi >= 1024 * 20) {
                if (ySpeed < 1000)
                    ySpeed += 30;
            }
            if (playerState.yMibi - yMibi <= -1024 * 20) {
                if (ySpeed > -1000)
                    ySpeed -= 30;
            }
            let enemies = [thisObj];
            let ATTACK_COOLDOWN_1;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_1 = 90;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_1 = 90;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_1 = 90;
                    break;
            }
            attackCooldown1--;
            if (attackCooldown1 <= 0 && transitionToPhase2Counter === null) {
                attackCooldown1 = ATTACK_COOLDOWN_1;
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
                    if (frameCounter < 600)
                        enemies.push(Enemy_Bullet_Noone.getEnemy(xMibi, yMibi, i, rng.nextBool(), rng.nextInt(360 * 128), difficulty, nextEnemyId++));
                    else
                        enemies.push(Enemy_Bullet_Noone2.getEnemy(xMibi, yMibi, i, rng.nextBool(), rng.nextInt(360 * 128), difficulty, nextEnemyId++));
                }
            }
            let ATTACK_COOLDOWN_2;
            switch (difficulty) {
                case 0 /* Difficulty.Easy */:
                    ATTACK_COOLDOWN_2 = 20;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_2 = 24;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_2 = 10;
                    break;
            }
            attackCooldown2--;
            if (attackCooldown2 <= 0 && transitionToPhase2Counter === null) {
                attackCooldown2 = ATTACK_COOLDOWN_2;
                soundOutput.playSound(4 /* GameSound.EnemyShoot */, 100);
                let increment;
                let numBullets;
                switch (difficulty) {
                    case 0 /* Difficulty.Easy */:
                        increment = 500;
                        numBullets = 3;
                        break;
                    case 1 /* Difficulty.Normal */:
                        increment = 600;
                        numBullets = 5;
                        break;
                    case 2 /* Difficulty.Hard */:
                        increment = 500;
                        numBullets = 10;
                        break;
                }
                attack2AngleScaled += increment;
                if (attack2AngleScaled >= 360 * 128)
                    attack2AngleScaled -= 360 * 128;
                let delta = Math.floor(360 * 128 / numBullets);
                for (let i = 0; i < numBullets; i++) {
                    let strawberry = Enemy_Bullet_Strawberry.getEnemy(xMibi, yMibi, attack2AngleScaled + delta * i, difficulty, nextEnemyId++);
                    enemies.push(strawberry);
                }
                attack2AngleScaled2 -= increment;
                if (attack2AngleScaled2 < 0)
                    attack2AngleScaled2 += 360 * 128;
                for (let i = 0; i < numBullets; i++) {
                    let strawberry = Enemy_Bullet_Strawberry.getEnemy(xMibi, yMibi, attack2AngleScaled2 + delta * i, difficulty, nextEnemyId++);
                    enemies.push(strawberry);
                }
            }
            if (hp <= 0 && transitionToPhase2Counter === null) {
                transitionToPhase2Counter = 0;
            }
            if (transitionToPhase2Counter !== null)
                transitionToPhase2Counter++;
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter >= 120) {
                let phase2Boss = Enemy_Level1Boss_Phase2.getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, nextEnemyId++);
                return {
                    enemies: [phase2Boss],
                    nextEnemyId: nextEnemyId,
                    newRngSeed: rng.getSeed()
                };
            }
            frameCounter++;
            let returnVal = {
                enemies: enemies,
                nextEnemyId: nextEnemyId,
                newRngSeed: rng.getSeed(),
                musicToPlay: 1 /* GameMusic.ChiptuneLevel3 */,
                bossHealthDisplayValue: Math.round(hp * 100 / 1000)
            };
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter === 2)
                returnVal.shouldScreenWipe = true;
            if (transitionToPhase2Counter !== null && transitionToPhase2Counter === 60)
                returnVal.shouldCreateAutoSavestate = true;
            return returnVal;
        };
        let getHitboxes = function () {
            return null;
        };
        let getDamageboxes = function () {
            let damagebox = {
                xMibi: xMibi - 48 * 1024,
                yMibi: yMibi - 48 * 1024,
                widthMibi: 32 * 3 * 1024,
                heightMibi: 32 * 3 * 1024
            };
            return [damagebox];
        };
        let render = function (displayOutput) {
            let spriteNum = Math.floor(frameCounter / 10) % 4;
            displayOutput.drawImageRotatedClockwise(13 /* GameImage.OwlBrown */, 32 + spriteNum * 32, 0, 32, 32, (xMibi >> 10) - 48, (yMibi >> 10) - 48, 0, 128 * 3);
        };
        let getSnapshot = function (thisObj) {
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, attackCooldown2, attack2AngleScaled, attack2AngleScaled2, transitionToPhase2Counter, hp, enemyId);
        };
        let onCollideWithPlayerBullet = function () {
            hp--;
            return true;
        };
        let onScreenWipe = function (countdown) {
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
            onScreenWipe,
            render: render
        };
    };
    Enemy_Level1Boss_Phase1.getEnemy = function (xMibi, yMibi, frameCounter, enemyId) {
        let initialHp = 1000;
        // TODO: remove
        //initialHp = 50;
        return getEnemy(xMibi, yMibi, 0, 0, frameCounter % 40, 0, 0, 0, 0, null, initialHp, enemyId);
    };
})());
