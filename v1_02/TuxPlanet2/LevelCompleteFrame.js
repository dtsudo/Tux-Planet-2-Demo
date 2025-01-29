let LevelCompleteFrame = {};
LevelCompleteFrame.getFrame = function (globalState, sessionState, underlyingFrame, level, difficulty, frameInputHistory) {
    /*
        1 = Continue
        2 = Watch replay
        3 = Restart level
    */
    let option = 1;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        underlyingFrame = underlyingFrame.getNextFrame({
            keyboardInput: EmptyKeyboard.getEmptyKeyboard(),
            mouseInput: EmptyMouse.getEmptyMouse(),
            previousKeyboardInput: EmptyKeyboard.getEmptyKeyboard(),
            previousMouseInput: EmptyMouse.getEmptyMouse(),
            displayProcessing: displayProcessing,
            soundOutput: MutedSoundOutput.getSoundOutput(soundOutput),
            musicOutput: musicOutput,
            thisFrame: underlyingFrame
        });
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            option--;
            if (option === 0)
                option = 3;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            option++;
            if (option === 4)
                option = 1;
        }
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            switch (option) {
                case 1: return OverworldFrame.getFrame(globalState, sessionState);
                case 2: return ReplayFrame.getFrame(globalState, sessionState, frameInputHistory, level, difficulty, displayProcessing);
                case 3: return GameFrame.getFrame(globalState, sessionState, GameStateUtil.getInitialGameState(level, difficulty, displayProcessing));
                default: throw new Error("Unrecognized option");
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawText(Math.floor(GlobalConstants.WINDOW_WIDTH / 2) - 184, 600, "Level Complete", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(365, 500, "Continue", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 400, "Watch replay", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 300, "Restart level", 0 /* GameFont.SimpleFont */, 24, white);
        let y;
        switch (option) {
            case 1:
                y = 473;
                break;
            case 2:
                y = 373;
                break;
            case 3:
                y = 273;
                break;
            default:
                throw new Error("Unrecognized option");
        }
        displayOutput.drawRectangle(362, y, 174, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
