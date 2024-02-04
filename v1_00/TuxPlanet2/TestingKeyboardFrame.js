let TestingKeyboardFrame = {};
TestingKeyboardFrame.getFrame = function (globalState, sessionState) {
    let x = 50;
    let y = 50;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        let delta = 8;
        if (keyboardInput.isPressed(43 /* Key.Shift */))
            delta = 2;
        if (keyboardInput.isPressed(38 /* Key.LeftArrow */))
            x -= delta;
        if (keyboardInput.isPressed(39 /* Key.RightArrow */))
            x += delta;
        if (keyboardInput.isPressed(37 /* Key.DownArrow */))
            y -= delta;
        if (keyboardInput.isPressed(36 /* Key.UpArrow */))
            y += delta;
        if (x < 0)
            x = 0;
        if (x > GlobalConstants.WINDOW_WIDTH)
            x = GlobalConstants.WINDOW_WIDTH;
        if (y < 0)
            y = 0;
        if (y > GlobalConstants.WINDOW_HEIGHT)
            y = GlobalConstants.WINDOW_HEIGHT;
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawRectangle(x - 5, y - 5, 11, 11, black, true);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
