let TestingFontFrame2 = {};
TestingFontFrame2.getFrame = function (globalState, sessionState) {
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */))
            return TestingFontFrame.getFrame(globalState, sessionState);
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        let red = { r: 255, g: 0, b: 0, alpha: 255 };
        displayOutput.drawRectangle(51, 527, 617, 119, red, false);
        displayOutput.drawText(50, 650, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 32, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
