let SaveAndLoadDataUtil = {
    getSaveAndLoadData: function () {
        let savedSoundVolume = null;
        let savedMusicVolume = null;
        let savedSessionState = null;
        let saveSessionState = function (sessionState) {
            let serializedSessionState = SessionStateUtil.serializeSessionState(sessionState);
            if (savedSessionState !== null) {
                if (savedSessionState.length === serializedSessionState.length) {
                    let isEqual = true;
                    for (let i = 0; i < savedSessionState.length; i++) {
                        if (savedSessionState[i] !== serializedSessionState[i]) {
                            isEqual = false;
                            break;
                        }
                    }
                    if (isEqual)
                        return;
                }
            }
            savedSessionState = serializedSessionState;
            let version = VersionInfo.getCurrentVersion();
            FileIO.persistData(GlobalConstants.FILE_ID_FOR_SESSION_STATE, version, serializedSessionState);
        };
        let saveSoundAndMusicVolume = function (soundVolume, musicVolume) {
            if (savedSoundVolume !== null && savedMusicVolume !== null && savedSoundVolume === soundVolume && savedMusicVolume === musicVolume)
                return;
            savedSoundVolume = soundVolume;
            savedMusicVolume = musicVolume;
            let version = VersionInfo.getCurrentVersion();
            let byteList = [soundVolume, musicVolume];
            FileIO.persistData(GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME, version, byteList);
        };
        let saveAllData = function (sessionState, soundVolume, musicVolume) {
            saveSessionState(sessionState);
            saveSoundAndMusicVolume(soundVolume, musicVolume);
        };
        let loadSessionState = function (sessionState) {
            let version = VersionInfo.getCurrentVersion();
            let data = FileIO.fetchData(GlobalConstants.FILE_ID_FOR_SESSION_STATE, version);
            if (data === null)
                return;
            SessionStateUtil.deserializeSessionState(data, sessionState);
        };
        let loadSoundVolume = function () {
            let version = VersionInfo.getCurrentVersion();
            let data = FileIO.fetchData(GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME, version);
            if (data === null)
                return null;
            if (data.length === 0)
                return null;
            let soundVolume = data[0];
            if (soundVolume < 0 || soundVolume > 100)
                return null;
            return soundVolume;
        };
        let loadMusicVolume = function () {
            let version = VersionInfo.getCurrentVersion();
            let data = FileIO.fetchData(GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME, version);
            if (data === null)
                return null;
            if (data.length <= 1)
                return null;
            let musicVolume = data[1];
            if (musicVolume < 0 || musicVolume > 100)
                return null;
            return musicVolume;
        };
        return {
            saveAllData,
            saveSessionState,
            saveSoundAndMusicVolume,
            loadSessionState,
            loadSoundVolume,
            loadMusicVolume
        };
    }
};
