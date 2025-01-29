let VictoryScreenFrame = {};
VictoryScreenFrame.getFrame = function (globalState, sessionState, underlyingFrame) {
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
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            return TitleScreenFrame.getFrame(globalState, sessionState);
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawText(Math.floor(GlobalConstants.WINDOW_WIDTH / 2) - 102, 600, "You Win!", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(378, 500, "Back to title screen", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawRectangle(375, 473, 250, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
