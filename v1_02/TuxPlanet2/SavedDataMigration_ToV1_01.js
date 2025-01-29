let SavedDataMigration_ToV1_01 = {
    migrateAllDataFromOlderVersionsToV1_01IfNeeded: function () {
        SavedDataMigration_ToV1_01.migrateSessionStateDataFromOlderVersionsToV1_01IfNeeded();
        SavedDataMigration_ToV1_01.migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_01IfNeeded();
    },
    migrateSessionStateDataFromOlderVersionsToV1_01IfNeeded: function () {
        // v1.00 didn't store any session state data
    },
    migrateSoundAndMusicVolumeDataFromOlderVersionsToV1_01IfNeeded: function () {
        let versionInfo = VersionInfo.getVersionHistory();
        let version1_00 = versionInfo.find(x => x.version === "1.00");
        let version1_01 = versionInfo.find(x => x.version === "1.01");
        let fileId = GlobalConstants.FILE_ID_FOR_SOUND_AND_MUSIC_VOLUME;
        let v1_01Data = FileIO.fetchData(fileId, version1_01);
        if (v1_01Data !== null)
            return;
        let v1_00Data = FileIO.fetchData(fileId, version1_00);
        if (v1_00Data === null)
            return;
        FileIO.persistData(fileId, version1_01, v1_00Data);
    }
};
