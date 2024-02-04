let SoundAndMusicVolumePickerUtil = {
    getSoundAndMusicVolumePicker: function (xPos, yPos, initialSoundVolume, initialMusicVolume) {
        let soundVolumePicker = SoundVolumePickerUtil.getSoundVolumePicker(xPos, yPos + 50, initialSoundVolume);
        let musicVolumePicker = MusicVolumePickerUtil.getMusicVolumePicker(xPos, yPos, initialMusicVolume);
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
            getCurrentSoundVolume: soundVolumePicker.getCurrentSoundVolume,
            getCurrentMusicVolume: musicVolumePicker.getCurrentMusicVolume,
            render
        };
    }
};
