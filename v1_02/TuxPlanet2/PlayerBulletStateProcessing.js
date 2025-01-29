let PlayerBulletStateProcessing = {
    processFrame: function (gameState) {
        let currentPlayerBullets = gameState.playerBulletState.playerBullets;
        let tilemap = gameState.tilemap;
        let newPlayerBullets = [];
        for (let currentPlayerBullet of currentPlayerBullets) {
            currentPlayerBullet.xMibi += currentPlayerBullet.xSpeedInMibipixelsPerFrame;
            currentPlayerBullet.yMibi += currentPlayerBullet.ySpeedInMibipixelsPerFrame;
            let newX = currentPlayerBullet.xMibi >> 10;
            let newY = currentPlayerBullet.yMibi >> 10;
            if (newX < -50 || newX > GlobalConstants.WINDOW_WIDTH + 50 || newY < -50 || newY > GlobalConstants.WINDOW_HEIGHT + 50)
                continue;
            if (tilemap.isSolid(currentPlayerBullet.xMibi, currentPlayerBullet.yMibi))
                continue;
            newPlayerBullets.push(currentPlayerBullet);
        }
        gameState.playerBulletState.playerBullets = newPlayerBullets;
    }
};
