let MuteAllSound_SoundOutput = {
    getSoundOutput: function (soundOutput) {
        return {
            loadSounds: soundOutput.loadSounds,
            setSoundVolume: soundOutput.setSoundVolume,
            getSoundVolume: soundOutput.getSoundVolume,
            playSound: function (sound, volume) { }
        };
    }
};
