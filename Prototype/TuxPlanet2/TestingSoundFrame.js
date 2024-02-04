let TestingSoundFrame = {};
TestingSoundFrame.getFrame = function (globalState, sessionState) {
    "use strict";
    let volumePicker = null;
    let cooldown = 0;
    let getNextFrame = function (keyboardInput, mouseInput, previousKeyboardInput, previousMouseInput, displayProcessing, soundOutput, musicOutput, thisFrame) {
        if (keyboardInput.isPressed(45 /* Key.Esc */) && !previousKeyboardInput.isPressed(45 /* Key.Esc */))
            return TestingFrame.getFrame(globalState, sessionState);
        if (volumePicker === null)
            volumePicker = SoundAndMusicVolumePickerUtil.getSoundAndMusicVolumePicker(0, 0, soundOutput.getSoundVolume(), musicOutput.getMusicVolume());
        volumePicker.processFrame(mouseInput, previousMouseInput);
        soundOutput.setSoundVolume(volumePicker.getCurrentSoundVolume());
        musicOutput.setMusicVolume(volumePicker.getCurrentMusicVolume());
        cooldown--;
        if (cooldown <= 0) {
            soundOutput.playSound(0 /* GameSound.Click */, 100);
            cooldown += 60;
        }
        return thisFrame;
    };
    let render = function (displayOutput) {
        let backgroundColor = { r: 225, g: 225, b: 225, alpha: 255 };
        displayOutput.drawRectangle(0, 0, GlobalConstants.WINDOW_WIDTH, GlobalConstants.WINDOW_HEIGHT, backgroundColor, true);
        if (volumePicker !== null)
            volumePicker.render(displayOutput);
    };
    return {
        getNextFrame,
        render,
        getClickUrl: function () { return null; },
        getCompletedAchievements: function () { return null; }
    };
};
