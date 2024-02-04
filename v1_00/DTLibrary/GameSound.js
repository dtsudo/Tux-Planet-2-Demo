let GameSoundUtil = {
    getSounds: function () {
        return [
            0 /* GameSound.Click */,
            1 /* GameSound.Cut */,
            2 /* GameSound.PlayerShoot */,
            3 /* GameSound.StandardDeath */,
            4 /* GameSound.EnemyShoot */
        ];
    },
    getSoundInfo: function (sound) {
        switch (sound) {
            case 0 /* GameSound.Click */:
                return {
                    filename: "Kenney/click3_Modified.wav",
                    volume: 0.3
                };
            case 1 /* GameSound.Cut */:
                return {
                    filename: "Basto/cut.ogg",
                    volume: 0.5
                };
            case 2 /* GameSound.PlayerShoot */:
                return {
                    filename: "Kenney/PlayerShoot_Modified.ogg",
                    volume: 0.2
                };
            case 3 /* GameSound.StandardDeath */:
                return {
                    filename: "Kenney/StandardDeath.ogg",
                    volume: 0.3
                };
            case 4 /* GameSound.EnemyShoot */:
                return {
                    filename: "Kenney/EnemyShoot_Modified.ogg",
                    volume: 1.0
                };
        }
    }
};
