let FileIO = {};
((function () {
    "use strict";
    let getNamespace = function (fileId, version) {
        return "guid" + version.alphanumericVersionGuid + "_file" + fileId;
    };
    let convertToBase64 = function (byteList) {
        // TODO: handle case where byteList is too large
        let str = String.fromCharCode(...byteList);
        return btoa(str);
    };
    let convertFromBase64 = function (str) {
        let result = atob(str);
        let returnValue = [];
        for (let i = 0; i < result.length; i++) {
            returnValue.push(result.charCodeAt(i));
        }
        return returnValue;
    };
    FileIO.persistData = function (fileId, version, byteList) {
        let namespace = getNamespace(fileId, version);
        let base64Data = convertToBase64(byteList);
        try {
            localStorage.setItem(namespace, base64Data);
        }
        catch (error) {
            // do nothing
        }
    };
    FileIO.fetchData = function (fileId, version) {
        let namespace = getNamespace(fileId, version);
        try {
            let value = localStorage.getItem(namespace);
            if (value === null)
                return null;
            return convertFromBase64(value);
        }
        catch (error) {
            return null;
        }
    };
})());
