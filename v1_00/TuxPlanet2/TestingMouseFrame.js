let TestingMouseFrame = {};
TestingMouseFrame.getFrame = function (globalState, sessionState) {
    let x = 0;
    let y = 0;
    let color = 0;
    let shouldFill = true;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        x = mouseInput.getX();
        y = mouseInput.getY();
        if (mouseInput.isLeftMouseButtonPressed() && !previousMouseInput.isLeftMouseButtonPressed()) {
            color++;
            if (color === 4)
                color = 0;
        }
        if (mouseInput.isRightMouseButtonPressed() && !previousMouseInput.isRightMouseButtonPressed())
            shouldFill = !shouldFill;
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        let dtColor;
        switch (color) {
            case 0:
                dtColor = black;
                break;
            case 1:
                dtColor = { r: 255, g: 0, b: 0, alpha: 255 };
                break;
            case 2:
                dtColor = { r: 0, g: 255, b: 0, alpha: 255 };
                break;
            case 3:
                dtColor = { r: 0, g: 0, b: 255, alpha: 255 };
                break;
            default:
                throw new Error("unrecognized color");
        }
        displayOutput.drawRectangle(x - 5, y - 5, 11, 11, dtColor, shouldFill);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
