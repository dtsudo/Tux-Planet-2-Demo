let TestingFontFrame = {};
TestingFontFrame.getFrame = function (globalState, sessionState) {
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */))
            return TestingFontFrame2.getFrame(globalState, sessionState);
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        let red = { r: 255, g: 0, b: 0, alpha: 255 };
        displayOutput.drawRectangle(50, 604, 233, 46, red, false);
        displayOutput.drawText(50, 650, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 12, black);
        displayOutput.drawRectangle(50, 497, 272, 53, red, false);
        displayOutput.drawText(50, 550, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 14, black);
        displayOutput.drawRectangle(50, 389, 310, 60, red, false);
        displayOutput.drawText(50, 450, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 16, black);
        displayOutput.drawRectangle(50, 282, 349, 67, red, false);
        displayOutput.drawText(50, 350, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 18, black);
        displayOutput.drawRectangle(50, 174, 387, 75, red, false);
        displayOutput.drawText(50, 250, "Line 1 ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            + "\n" + "Line 2"
            + "\n" + "Line 3"
            + "\n" + "Line 4", 0 /* GameFont.SimpleFont */, 20, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
