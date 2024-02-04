// REVIEW ME
let EnemyCollision = {
    processCollisionBetweenPlayerAndEnemies: function (gameState) {
        if (gameState.playerState.isDeadFrameCount !== null)
            return;
        let playerXMibi = gameState.playerState.xMibi;
        let playerYMibi = gameState.playerState.yMibi;
        for (let enemy of gameState.enemies) {
            let hitboxes = enemy.getHitboxes();
            if (hitboxes !== null) {
                let hasCollided = false;
                for (let hitbox of hitboxes) {
                    if (hitbox.xMibi <= playerXMibi
                        && playerXMibi <= hitbox.xMibi + hitbox.widthMibi
                        && hitbox.yMibi <= playerYMibi
                        && playerYMibi <= hitbox.yMibi + hitbox.heightMibi) {
                        hasCollided = true;
                        break;
                    }
                }
                if (hasCollided) {
                    let shouldKillPlayer = enemy.onCollideWithPlayer(gameState.playerState);
                    if (shouldKillPlayer)
                        gameState.playerState.isDeadFrameCount = 0;
                }
            }
        }
    },
    processCollisionBetweenPlayerBulletsAndEnemies: function (gameState) {
        let enemiesThatActuallyHaveDamageboxes = gameState.enemies.filter(x => x.getDamageboxes() !== null);
        let playerBullets = gameState.playerBulletState.playerBullets;
        for (let enemy of enemiesThatActuallyHaveDamageboxes) {
            let newPlayerBullets = [];
            for (let playerBullet of playerBullets) {
                let hasCollided = false;
                for (let damagebox of enemy.getDamageboxes()) {
                    if (damagebox.xMibi <= playerBullet.xMibi
                        && playerBullet.xMibi <= damagebox.xMibi + damagebox.widthMibi
                        && damagebox.yMibi <= playerBullet.yMibi
                        && playerBullet.yMibi <= damagebox.yMibi + damagebox.heightMibi) {
                        hasCollided = true;
                        break;
                    }
                }
                if (hasCollided) {
                    let shouldDeletePlayerBullet = enemy.onCollideWithPlayerBullet(playerBullet);
                    if (!shouldDeletePlayerBullet)
                        newPlayerBullets.push(playerBullet);
                }
                else {
                    newPlayerBullets.push(playerBullet);
                }
            }
            playerBullets = newPlayerBullets;
        }
        gameState.playerBulletState.playerBullets = playerBullets;
    }
};
