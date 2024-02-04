let VersionInfo = {};
VersionInfo.getVersionHistory = function () {
    "use strict";
    return [
        { version: "1.00", alphanumericVersionGuid: "b223b79ff03e4ea931c463d8148afed2" }
    ];
};
VersionInfo.getCurrentVersion = function () {
    "use strict";
    let versionHistory = VersionInfo.getVersionHistory();
    return versionHistory[versionHistory.length - 1];
};
