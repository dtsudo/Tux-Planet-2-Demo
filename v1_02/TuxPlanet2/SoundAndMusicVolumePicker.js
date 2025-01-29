let SoundAndMusicVolumePickerUtil = {
    getSoundAndMusicVolumePicker: function (xPos, yPos, initialSoundVolume, initialMusicVolume, color) {
        let soundVolumePicker = SoundVolumePickerUtil.getSoundVolumePicker(xPos, yPos + 50, initialSoundVolume, color);
        let musicVolumePicker = MusicVolumePickerUtil.getMusicVolumePicker(xPos, yPos, initialMusicVolume, color);
        let processFrame = function (mouseInput, previousMouseInput) {
            soundVolumePicker.processFrame(mouseInput, previousMouseInput);
            musicVolumePicker.processFrame(mouseInput, previousMouseInput);
        };
        let render = function (displayOutput) {
            soundVolumePicker.render(displayOutput);
            musicVolumePicker.render(displayOutput);
        };
        return {
            processFrame,
            getCurrentSoundVolume: function () { return soundVolumePicker.getCurrentSoundVolume(); },
            getCurrentMusicVolume: function () { return musicVolumePicker.getCurrentMusicVolume(); },
            render
        };
    }
};
