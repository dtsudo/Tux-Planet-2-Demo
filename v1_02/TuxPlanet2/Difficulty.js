let DifficultyUtil = {
    getDifficultyIdFromDifficulty: function (difficulty) {
        switch (difficulty) {
            case 0 /* Difficulty.Easy */: return 1;
            case 1 /* Difficulty.Normal */: return 2;
            case 2 /* Difficulty.Hard */: return 3;
        }
    },
    getDifficultyFromDifficultyId: function (difficultyId) {
        if (difficultyId === 1)
            return 0 /* Difficulty.Easy */;
        if (difficultyId === 2)
            return 1 /* Difficulty.Normal */;
        if (difficultyId === 3)
            return 2 /* Difficulty.Hard */;
        throw new Error("Unrecognized difficultyId");
    }
};
