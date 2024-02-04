let GameMusicOutput = {
    getMusicOutput: function () {
        "use strict";
        let musicDictionary = {};
        let numberOfAudioObjectsLoaded = 0;
        let loadMusic = function () {
            let musicNamesArray = GameMusicUtil.getMusic();
            let numberOfAudioObjects = musicNamesArray.length;
            for (let musicName of musicNamesArray) {
                if (musicDictionary[musicName])
                    continue;
                let musicPath = "Data/Music/" + GameMusicUtil.getMusicInfo(musicName).filename + "?doNotCache=" + Date.now().toString();
                let hasAudioLoaded = false;
                let audio = new Audio(musicPath);
                audio.addEventListener("canplaythrough", function () {
                    if (!hasAudioLoaded) {
                        hasAudioLoaded = true;
                        numberOfAudioObjectsLoaded++;
                    }
                });
                audio.loop = true;
                musicDictionary[musicName] = audio;
            }
            return numberOfAudioObjects === numberOfAudioObjectsLoaded;
        };
        /*
            The current music being played, or null if no music is playing.
            
            This may not be the same as intendedMusic since it takes a while
            to fade out an existing music and fade in a new one
        */
        let currentMusic = null;
        // The intended music that should eventually play, or null if we should fade out all music
        let intendedMusic = null;
        /*
            From 0.0 to 1.0
            
            Normally, this value is 1.0
            However, when fading in/out, this value will decrease to represent the drop in music volume.
        */
        let currentFadeInAndOutVolume = 0.0;
        /*
            From 0 to 100.
            
            For currentMusic, the intended volume at which the music should be played.
            We allow this to be set since we might want to play a particular music at a different
            volume depending on circumstances (e.g. maybe the music should be played softer when
            the game is paused)
        */
        let currentMusicVolume = 0;
        /*
            From 0 to 100.
            
            For intendedMusic, the intended volume at which the music should be played.
        */
        let intendedMusicVolume = 0;
        // From 0 to 100
        let globalMusicVolume = 0;
        let playMusic = function (music, volume) {
            intendedMusic = music;
            intendedMusicVolume = volume;
        };
        let stopMusic = function () {
            intendedMusic = null;
        };
        let decreaseCurrentFadeInAndOutVolume = function () {
            currentFadeInAndOutVolume = currentFadeInAndOutVolume - 0.08;
            if (currentFadeInAndOutVolume < 0.0)
                currentFadeInAndOutVolume = 0.0;
        };
        let increaseCurrentFadeInAndOutVolume = function () {
            currentFadeInAndOutVolume = currentFadeInAndOutVolume + 0.08;
            if (currentFadeInAndOutVolume > 1.0)
                currentFadeInAndOutVolume = 1.0;
        };
        let playCurrentMusic = function () {
            let music = musicDictionary[currentMusic];
            let finalVolume = currentFadeInAndOutVolume * (currentMusicVolume / 100.0) * (globalMusicVolume / 100.0) * GameMusicUtil.getMusicInfo(currentMusic).volume;
            if (finalVolume > 1.0)
                finalVolume = 1.0;
            if (finalVolume < 0.0)
                finalVolume = 0.0;
            for (let m in musicDictionary) {
                let audio = musicDictionary[m];
                if (audio === music) {
                    audio.volume = finalVolume;
                    let audioPromise = audio.play();
                    if (audioPromise) {
                        audioPromise.then(function () { }, function () { });
                    }
                }
                else {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        };
        let stopCurrentMusic = function () {
            for (let musicName in musicDictionary) {
                let audio = musicDictionary[musicName];
                audio.pause();
                audio.currentTime = 0;
            }
        };
        let updateCurrentMusic = function () {
            if (intendedMusic === null) {
                if (currentMusic !== null) {
                    decreaseCurrentFadeInAndOutVolume();
                    if (currentFadeInAndOutVolume === 0.0)
                        currentMusic = null;
                }
                return;
            }
            if (currentMusic === null) {
                currentMusic = intendedMusic;
                currentFadeInAndOutVolume = 0.0;
                currentMusicVolume = intendedMusicVolume;
                return;
            }
            if (currentMusic !== intendedMusic) {
                decreaseCurrentFadeInAndOutVolume();
                if (currentFadeInAndOutVolume === 0.0)
                    currentMusic = null;
                return;
            }
            if (currentMusicVolume < intendedMusicVolume) {
                let delta = 3;
                currentMusicVolume = currentMusicVolume + delta;
                if (currentMusicVolume > intendedMusicVolume)
                    currentMusicVolume = intendedMusicVolume;
            }
            if (currentMusicVolume > intendedMusicVolume) {
                let delta = 3;
                currentMusicVolume = currentMusicVolume - delta;
                if (currentMusicVolume < intendedMusicVolume)
                    currentMusicVolume = intendedMusicVolume;
            }
            increaseCurrentFadeInAndOutVolume();
        };
        let processFrame = function () {
            updateCurrentMusic();
            if (currentMusic !== null)
                playCurrentMusic();
            else
                stopCurrentMusic();
        };
        let setMusicVolume = function (volume) {
            globalMusicVolume = volume;
        };
        let getMusicVolume = function () {
            return globalMusicVolume;
        };
        return {
            loadMusic,
            playMusic,
            stopMusic,
            setMusicVolume,
            getMusicVolume,
            processFrame
        };
    }
};
