let GameMusicUtil = {
    getMusic: function () {
        return [
            0 /* GameMusic.ChiptuneLevel1 */,
            1 /* GameMusic.ChiptuneLevel3 */,
            2 /* GameMusic.ForestTop */,
            3 /* GameMusic.MainTheme */
        ];
    },
    getMusicInfo: function (music) {
        switch (music) {
            case 0 /* GameMusic.ChiptuneLevel1 */:
                return {
                    filename: "JuhaniJunkala/Level1.ogg",
                    volume: 0.07
                };
            case 1 /* GameMusic.ChiptuneLevel3 */:
                return {
                    filename: "JuhaniJunkala/Level3.ogg",
                    volume: 0.07
                };
            case 2 /* GameMusic.ForestTop */:
                return {
                    filename: "SpringSpring/ForestTop.ogg",
                    volume: 0.60
                };
            case 3 /* GameMusic.MainTheme */:
                return {
                    filename: "wansti/theme.ogg",
                    volume: 0.10
                };
        }
    }
};
