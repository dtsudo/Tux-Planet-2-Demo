let CreditsFrame_Music = {
    render: function (displayOutput, width, height, buildType) {
        let text = "Music track authors: \n"
            + "* Cal McEachern \n"
            + "* Juhani Junkala \n"
            + "* Spring Spring \n"
            + "* wansti \n"
            + "\n"
            + "See the source code for more information (including licensing \n"
            + "details).";
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
