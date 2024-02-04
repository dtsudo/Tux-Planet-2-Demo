let GameStateUtil = {
    getSnapshot: function (gameState) {
        let playerState = gameState.playerState;
        let playerStateSnapshot = {
            xMibi: playerState.xMibi,
            yMibi: playerState.yMibi,
            attackCooldown: playerState.attackCooldown,
            attackSoundCooldown: playerState.attackSoundCooldown,
            isDeadFrameCount: playerState.isDeadFrameCount
        };
        let playerBulletStateSnapshot = {
            playerBullets: gameState.playerBulletState.playerBullets.map(x => ({
                xMibi: x.xMibi,
                yMibi: x.yMibi,
                xSpeedInMibipixelsPerFrame: x.xSpeedInMibipixelsPerFrame,
                ySpeedInMibipixelsPerFrame: x.ySpeedInMibipixelsPerFrame,
                displayRotationScaled: x.displayRotationScaled,
                animationOffset: x.animationOffset
            }))
        };
        let enemiesSnapshot = gameState.enemies.map(x => x.getSnapshot(x));
        return {
            playerState: playerStateSnapshot,
            playerBulletState: playerBulletStateSnapshot,
            enemies: enemiesSnapshot,
            nextEnemyId: gameState.nextEnemyId,
            frameCount: gameState.frameCount,
            rngSeed: gameState.rngSeed,
            difficulty: gameState.difficulty,
            cutscene: gameState.cutscene !== null ? gameState.cutscene.getSnapshot(gameState.cutscene) : null,
            bossHealthDisplay: gameState.bossHealthDisplay.getSnapshot(gameState.bossHealthDisplay),
            background: gameState.background.getSnapshot(gameState.background)
        };
    },
    getInitialGameState: function (levelNum, difficulty) {
        let enemy;
        let background;
        let nextEnemyId = 1;
        switch (levelNum) {
            case 1:
                enemy = Enemy_Level1.getEnemy({ enemyId: nextEnemyId++ });
                background = Background_Ocean.getBackground();
                break;
            default:
                throw new Error("Unrecognized levelNum: " + levelNum);
        }
        return {
            playerState: {
                xMibi: 50 * 1024,
                yMibi: Math.floor(GlobalConstants.WINDOW_HEIGHT / 2) * 1024,
                attackCooldown: 0,
                attackSoundCooldown: 0,
                isDeadFrameCount: null
            },
            playerBulletState: {
                playerBullets: []
            },
            enemies: [enemy],
            nextEnemyId: nextEnemyId,
            frameCount: 0,
            rngSeed: 0,
            difficulty: difficulty,
            cutscene: null,
            bossHealthDisplay: BossHealthDisplayUtil.getDisplay(),
            background: background
        };
    }
};
