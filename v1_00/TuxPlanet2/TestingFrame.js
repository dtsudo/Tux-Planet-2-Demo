let TestingFrame = {};
TestingFrame.getFrame = function (globalState, sessionState) {
    "use strict";
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TitleScreenFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(27 /* Key.One */) && !previousKeyboardInput.isPressed(27 /* Key.One */))
            return TestingKeyboardFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(28 /* Key.Two */) && !previousKeyboardInput.isPressed(28 /* Key.Two */))
            return TestingMouseFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(29 /* Key.Three */) && !previousKeyboardInput.isPressed(29 /* Key.Three */))
            return TestingFontFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(30 /* Key.Four */) && !previousKeyboardInput.isPressed(30 /* Key.Four */))
            return TestingSoundFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(31 /* Key.Five */) && !previousKeyboardInput.isPressed(31 /* Key.Five */))
            return TestingMusicFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(32 /* Key.Six */) && !previousKeyboardInput.isPressed(32 /* Key.Six */))
            return TestingClickUrlFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(33 /* Key.Seven */) && !previousKeyboardInput.isPressed(33 /* Key.Seven */))
            return TestingAchievementsFrame.getFrame(globalState, sessionState);
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawText(50, GlobalConstants.WINDOW_HEIGHT - 50, "1) Test keyboard"
            + "\n" + "2) Test mouse"
            + "\n" + "3) Test font"
            + "\n" + "4) Test sound"
            + "\n" + "5) Test music"
            + "\n" + "6) Test click URL"
            + "\n" + "7) Test achievements", 0 /* GameFont.SimpleFont */, 20, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
