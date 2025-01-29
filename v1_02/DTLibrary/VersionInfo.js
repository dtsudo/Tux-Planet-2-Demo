let VersionInfo = {};
VersionInfo.getVersionHistory = function () {
    "use strict";
    return [
        { version: "1.00", alphanumericVersionGuid: "ad3452c3176b8ec393baa35ec5ec3fd1" },
        { version: "1.01", alphanumericVersionGuid: "31b51b385e7956afbd7b44334dcd3317" },
        { version: "1.02", alphanumericVersionGuid: "e30afc174acd4750a8d83a1f4d90d15d" }
    ];
};
VersionInfo.getCurrentVersion = function () {
    "use strict";
    let versionHistory = VersionInfo.getVersionHistory();
    return versionHistory[versionHistory.length - 1];
};
