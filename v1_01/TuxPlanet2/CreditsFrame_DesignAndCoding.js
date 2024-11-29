let CreditsFrame_DesignAndCoding = {
    render: function (displayOutput, width, height, buildType) {
        let text;
        switch (buildType) {
            case 0 /* BuildType.WebStandalone */:
            case 1 /* BuildType.WebEmbedded */:
                text = "Design and coding by dtsudo. \n"
                    + "\n"
                    + "Level layout was adapted from SuperTux Advance maps. \n"
                    + "\n"
                    + "This game is a fangame of SuperTux and SuperTux Advance. \n"
                    + "\n"
                    + "This game is open source, licensed under GPL 3.0. \n"
                    + "(Code dependencies and images/font/sound/music licensed under \n"
                    + "other open source licenses.) \n"
                    + "\n"
                    + "See the source code for more information (including licensing \n"
                    + "details).";
                break;
            case 2 /* BuildType.Electron */:
                text = "Design and coding by dtsudo. \n"
                    + "\n"
                    + "Level layout was adapted from SuperTux Advance maps. \n"
                    + "\n"
                    + "This game is a fangame of SuperTux and SuperTux Advance. \n"
                    + "\n"
                    + "This game is open source, licensed under GPL 3.0. \n"
                    + "(Code dependencies and images/font/sound/music licensed under \n"
                    + "other open source licenses.) \n"
                    + "\n"
                    + "This game uses the Electron framework (https://www.electronjs.org) \n"
                    + "\n"
                    + "See the source code for more information (including licensing \n"
                    + "details).";
                break;
        }
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
