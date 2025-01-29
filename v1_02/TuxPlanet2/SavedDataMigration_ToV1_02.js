let SavedDataMigration_ToV1_02 = {
    migrateAllDataFromOlderVersionsToV1_02IfNeeded: function () {
        SavedDataMigration_ToV1_02.migrateSessionStateDataFromOlderVersionsToV1_02IfNeeded();
        SavedDataMigration_ToV1_02.migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_02IfNeeded();
    },
    migrateSessionStateDataFromOlderVersionsToV1_02IfNeeded: function () {
        // v1.01 didn't store any session state data
    },
    migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_02IfNeeded: function () {
        let versionInfo = VersionInfo.getVersionHistory();
        let version1_01 = versionInfo.find(x => x.version === "1.01");
        let version1_02 = versionInfo.find(x => x.version === "1.02");
        let fileId = GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME;
        let v1_02Data = FileIO.fetchData(fileId, version1_02);
        if (v1_02Data !== null)
            return;
        SavedDataMigration_ToV1_01.migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_01IfNeeded();
        let v1_01Data = FileIO.fetchData(fileId, version1_01);
        if (v1_01Data === null)
            return;
        FileIO.persistData(fileId, version1_02, v1_01Data);
    }
};
