// REVIEW ME
let Enemy_Level1Boss_Phase3 = {};
((function () {
    let getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, hp, enemyId) {
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
                    ATTACK_COOLDOWN_1 = 50;
                    break;
                case 1 /* Difficulty.Normal */:
                    ATTACK_COOLDOWN_1 = 22;
                    break;
                case 2 /* Difficulty.Hard */:
                    ATTACK_COOLDOWN_1 = 4;
                    break;
            }
            attackCooldown1--;
            if (attackCooldown1 <= 0) {
                attackCooldown1 = ATTACK_COOLDOWN_1;
                //soundOutput.playSound(GameSound.EnemyShoot, 100);
                enemies.push(Enemy_Bullet_BouncySnow.getEnemy((100 + rng.nextInt(800)) << 10, -128 * (70 + rng.nextInt(40)), (50 + rng.nextInt(400)) << 10, difficulty, nextEnemyId++));
            }
            if (hp <= 0) {
                let deadBoss = Enemy_Level1Boss_Dead.getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, nextEnemyId++);
                return {
                    enemies: [deadBoss],
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
                bossHealthDisplayValue: Math.round(hp * 100 / 500)
            };
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
            return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, attackCooldown1, hp, enemyId);
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
    Enemy_Level1Boss_Phase3.getEnemy = function (xMibi, yMibi, xSpeed, ySpeed, frameCounter, enemyId) {
        let initialHp = 500;
        // TODO remove
        //initialHp = 10;
        return getEnemy(xMibi, yMibi, xSpeed, ySpeed, frameCounter, 0, initialHp, enemyId);
    };
})());
