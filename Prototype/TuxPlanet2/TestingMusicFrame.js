let TestingMusicFrame = {};
TestingMusicFrame.getFrame = function (globalState, sessionState) {
    let volumePicker = null;
    let getNextFrame = function (keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        let music = null;
        if (keyboardInput.isPressed(27 /* Key.One */))
            music = 0 /* GameMusic.ChiptuneLevel1 */;
        if (keyboardInput.isPressed(28 /* Key.Two */))
            music = 1 /* GameMusic.ChiptuneLevel3 */;
        if (music !== null)
            musicOutput.playMusic(music, 100);
        if (keyboardInput.isPressed(29 /* Key.Three */))
            musicOutput.stopMusic();
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
        displayOutput.drawText(50, GlobalConstants.WINDOW_HEIGHT - 50, "Press 1/2 to switch music tracks." + "\n" + "Press 3 to stop music.", 0 /* GameFont.SimpleFont */, 24, black);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
