let ReplayPauseMenuFrame = {};
ReplayPauseMenuFrame.getFrame = function (globalState, sessionState, underlyingFrame, difficulty, frameInputHistory) {
    let volumePicker = null;
    /*
        1 = Continue
        2 = Restart replay
        3 = Return to title screen
    */
    let option = 1;
    let getNextFrame = function (keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame) {
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        if (keyboardInput.isPressed(36 /* Key.UpArrow */) && !previousKeyboardInput.isPressed(36 /* Key.UpArrow */)) {
            if (option > 1)
                option--;
        }
        if (keyboardInput.isPressed(37 /* Key.DownArrow */) && !previousKeyboardInput.isPressed(37 /* Key.DownArrow */)) {
            if (option < 3)
                option++;
        }
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */)) {
            return underlyingFrame;
        }
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            switch (option) {
                case 1: return underlyingFrame;
                case 2: return ReplayFrame.getFrame(globalState, sessionState, frameInputHistory, difficulty);
                case 3: return TitleScreenFrame.getFrame(globalState, sessionState);
                default: throw new Error("><");
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: 150 }, true);
        displayOutput.drawText(GlobalConstants.WINDOW_WIDTH / 2 - 300, 600, "Paused", 0 /* GameFont.SimpleFont */, 48, white);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
        displayOutput.drawText(350, 500, "Continue", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(350, 400, "Restart replay", 0 /* GameFont.SimpleFont */, 24, white);
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
