let LevelCompleteFrame = {};
LevelCompleteFrame.getFrame = function (globalState, sessionState, underlyingFrame, difficulty, frameInputHistory) {
    /*
        1 = Watch replay
        2 = Restart level
        3 = Return to title screen
    */
    let option = 1;
    let getNextFrame = function (keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame) {
        underlyingFrame = underlyingFrame.getNextFrame(EmptyKeyboard.getEmptyKeyboard(), EmptyMouse.getEmptyMouse(), EmptyKeyboard.getEmptyKeyboard(), EmptyMouse.getEmptyMouse(), displayProcessing, MuteAllSound_SoundOutput.getSoundOutput(soundOutput), musicOutput, underlyingFrame);
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            if (option > 1)
                option--;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            if (option < 3)
                option++;
        }
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            switch (option) {
                case 1: return ReplayFrame.getFrame(globalState, sessionState, frameInputHistory, difficulty);
                case 2: return GameFrame.getFrame(globalState, sessionState, GameStateUtil.getInitialGameState(1, difficulty));
                case 3: return TitleScreenFrame.getFrame(globalState, sessionState);
                default: throw new Error("><");
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawText(GlobalConstants.WINDOW_WIDTH / 2 - 300, 600, "All clear!", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(350, 500, "Watch replay", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(350, 400, "Restart level", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(350, 300, "Return to title screen", 0 /* GameFont.SimpleFont */, 24, white);
        let y;
        switch (option) {
            case 1:
                y = 470;
                break;
            case 2:
                y = 370;
                break;
            case 3:
                y = 270;
                break;
            default:
                throw new Error(" :( ");
        }
        displayOutput.drawRectangle(350, y, 350, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
