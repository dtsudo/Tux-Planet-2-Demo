let VersionInfo = {};
VersionInfo.getVersionHistory = function () {
    "use strict";
    return [
        { version: "1.00", alphanumericVersionGuid: "ad3452c3176b8ec393baa35ec5ec3fd1" },
        { version: "1.01", alphanumericVersionGuid: "31b51b385e7956afbd7b44334dcd3317" }
    ];
};
VersionInfo.getCurrentVersion = function () {
    "use strict";
    let versionHistory = VersionInfo.getVersionHistory();
    return versionHistory[versionHistory.length - 1];
};
