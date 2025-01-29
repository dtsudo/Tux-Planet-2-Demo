let LevelUtil = {
    getLevelIdFromLevel: function (level) {
        switch (level) {
            case 0 /* Level.Level1 */: return 1;
            case 1 /* Level.Level2 */: return 2;
        }
    },
    getLevelFromLevelId: function (levelId) {
        if (levelId === 1)
            return 0 /* Level.Level1 */;
        if (levelId === 2)
            return 1 /* Level.Level2 */;
        throw new Error("Unrecognized levelId");
    },
    getFinalLevel: function () {
        return 1 /* Level.Level2 */;
    }
};
