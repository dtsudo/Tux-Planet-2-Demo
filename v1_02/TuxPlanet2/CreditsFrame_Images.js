let CreditsFrame_Images = {
    render: function (displayOutput, width, height, buildType) {
        let text = "Image files created by: \n"
            + "* Benjamin K. Smith, Lanea Zimmerman (AKA Sharm), Daniel Eddeland, \n"
            + "   William.Thompsonj, Nushio, Adrix89 \n"
            + "* Crystalized Sun \n"
            + "* Kelvin Shadewing \n"
            + "* Kenney \n"
            + "* KnoblePersona \n"
            + "* Nemisys \n"
            + "* UbuntuJackson \n"
            + "\n"
            + "See the source code for more information (including licensing \n"
            + "details).";
        displayOutput.drawText(10, height - 10, text, 0 /* GameFont.SimpleFont */, 27, black);
    }
};
