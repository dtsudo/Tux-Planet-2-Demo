let CreditsFrame_Sound = {
    render: function (displayOutput, width, height, buildType) {
        let text = "Sound effects created by: \n"
            + "* Basto \n"
            + "* Kenney \n"
            + "\n"
            + "See the source code for more information (including licensing \n"
            + "details).";
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
