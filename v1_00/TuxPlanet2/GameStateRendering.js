let GameStateRendering = {
    render: function (gameState, displayOutput, renderKonqiHitbox) {
        gameState.background.render(displayOutput);
        let backgroundEnemies = [];
        let normalEnemies = [];
        let bulletEnemies = [];
        for (let enemy of gameState.enemies) {
            if (enemy.isBullet)
                bulletEnemies.push(enemy);
            else if (enemy.isBackground)
                backgroundEnemies.push(enemy);
            else
                normalEnemies.push(enemy);
        }
        for (let enemy of backgroundEnemies) {
            enemy.render(displayOutput);
        }
        if (gameState.playerState.isDeadFrameCount === null) {
            let konqiSpriteNum = Math.floor(gameState.frameCount / 12) % 6;
            displayOutput.drawImageRotatedClockwise(8 /* GameImage.KonqiAir */, 32 * konqiSpriteNum, 128, 32, 32, (gameState.playerState.xMibi >> 10) - 56, (gameState.playerState.yMibi >> 10) - 48, 0, 128 * 3);
            if (renderKonqiHitbox)
                displayOutput.drawRectangle((gameState.playerState.xMibi >> 10) - 2, (gameState.playerState.yMibi >> 10) - 2, 5, 5, white, true);
        }
        else {
            let konqiSpriteNum = Math.floor(gameState.frameCount / 12) % 2;
            let yPositionOffset = 30000 * gameState.playerState.isDeadFrameCount - 1000 * gameState.playerState.isDeadFrameCount * gameState.playerState.isDeadFrameCount;
            displayOutput.drawImageRotatedClockwise(8 /* GameImage.KonqiAir */, 128 + 32 * konqiSpriteNum, 32, 32, 32, (gameState.playerState.xMibi >> 10) - 56, ((gameState.playerState.yMibi + yPositionOffset) >> 10) - 48, 0, 128 * 3);
        }
        for (let playerBullet of gameState.playerBulletState.playerBullets) {
            let bulletSpriteNum = Math.floor((gameState.frameCount + playerBullet.animationOffset) / 4) % 6;
            let imageX = (bulletSpriteNum % 3) * 8;
            let imageY = bulletSpriteNum <= 2 ? 0 : 8;
            displayOutput.drawImageRotatedClockwise(9 /* GameImage.TinyFlame */, imageX, imageY, 8, 8, (playerBullet.xMibi >> 10) - 3 * 4, (playerBullet.yMibi >> 10) - 3 * 4, playerBullet.displayRotationScaled, 128 * 3);
        }
        for (let enemy of normalEnemies) {
            enemy.render(displayOutput);
        }
        for (let enemy of bulletEnemies) {
            enemy.render(displayOutput);
        }
        gameState.bossHealthDisplay.render(displayOutput);
        if (gameState.cutscene !== null)
            gameState.cutscene.render(displayOutput);
    }
};
