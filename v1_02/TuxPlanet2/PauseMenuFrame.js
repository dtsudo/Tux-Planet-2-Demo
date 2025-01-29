let PauseMenuFrame = {};
PauseMenuFrame.getFrame = function (globalState, sessionState, underlyingFrame, level, difficulty) {
    let volumePicker = null;
    /*
        1 = Continue
        2 = Restart level
        3 = Return to overworld
    */
    let option = 1;
    let getNextFrame = function ({ keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame }) {
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume(), 1 /* VolumePickerColor.White */);
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
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
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return underlyingFrame;
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            switch (option) {
                case 1: return underlyingFrame;
                case 2: return GameFrame.getFrame(globalState, sessionState, GameStateUtil.getInitialGameState(level, difficulty, displayProcessing));
                case 3: return OverworldFrame.getFrame(globalState, sessionState);
                default: throw new Error("Unrecognized option");
            }
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        underlyingFrame.render(displayOutput);
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, { r: 0, g: 0, b: 0, alpha: 175 }, true);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
        displayOutput.drawText(400, 600, "Paused", 0 /* GameFont.SimpleFont */, 48, white);
        displayOutput.drawText(365, 500, "Continue", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 400, "Restart level", 0 /* GameFont.SimpleFont */, 24, white);
        displayOutput.drawText(365, 300, "Quit level and return to map", 0 /* GameFont.SimpleFont */, 24, white);
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
        displayOutput.drawRectangle(362, y, 350, 30, white, false);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
