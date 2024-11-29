let MutedSoundOutput = {
    getSoundOutput: function (soundOutput) {
        return {
            loadSounds: function () { return soundOutput.loadSounds(); },
            setSoundVolume: function (volume) { soundOutput.setSoundVolume(volume); },
            getSoundVolume: function () { return soundOutput.getSoundVolume(); },
            playSound: function (sound, volume) { }
        };
    }
};
