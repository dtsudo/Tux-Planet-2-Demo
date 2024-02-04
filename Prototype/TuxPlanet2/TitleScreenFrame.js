let TitleScreenFrame = {};
TitleScreenFrame.getFrame = function (globalState, sessionState) {
    let volumePicker = null;
    let isHoverOverUrl = false;
    let getNextFrame = function (keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame) {
        if (globalState.debugMode) {
            if (keyboardInput.isPressed(19 /* Key.T */) && !previousKeyboardInput.isPressed(19 /* Key.T */))
                return TestingFrame.getFrame(globalState, sessionState);
        }
        let mouseX = mouseInput.getX();
        let mouseY = mouseInput.getY();
        isHoverOverUrl = 620 <= mouseX && mouseX <= 620 + 350 && 4 <= mouseY && mouseY <= 20;
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        globalState.saveAndLoadData.saveSoundAndMusicVolume(soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        if (keyboardInput.isPressed(42 /* Key.Enter */) && !previousKeyboardInput.isPressed(42 /* Key.Enter */)
            || keyboardInput.isPressed(44 /* Key.Space */) && !previousKeyboardInput.isPressed(44 /* Key.Space */)
            || keyboardInput.isPressed(25 /* Key.Z */) && !previousKeyboardInput.isPressed(25 /* Key.Z */)) {
            return ChooseDifficultyFrame.getFrame(globalState, sessionState);
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        displayOutput.drawText(GlobalConstants.WINDOW_WIDTH / 2 - 300, 600, "Tux Planet 2: \n Konqi's Fiery Adventure", 0 /* GameFont.SimpleFont */, 48, black);
        displayOutput.drawText(GlobalConstants.WINDOW_WIDTH / 2 - 150, 300, "Press Enter", 0 /* GameFont.SimpleFont */, 28, black);
        displayOutput.drawText(350, 20, "The previous game (Tux Planet 1): ", 0 /* GameFont.SimpleFont */, 16, black);
        displayOutput.drawText(620, 20, "https://dtsudo.itch.io/tux-planet-speedrun", 0 /* GameFont.SimpleFont */, 16, isHoverOverUrl ? { r: 0, g: 0, b: 255, alpha: 255 } : black);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return isHoverOverUrl ? "https://dtsudo.itch.io/tux-planet-speedrun" : null; },
        getCompletedAchievements: function () { return null; }
    };
};
