let SolidLayerUtil = ((function () {
    let isValidSolidId = function (solidId) {
        if (solidId === null)
            return true;
        return [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].includes(solidId);
    };
    let isValidSolidLayer = function (solidLayer) {
        for (let i = 0; i < solidLayer.length; i++) {
            for (let j = 0; j < solidLayer[i].length; j++) {
                if (!isValidSolidId(solidLayer[i][j])) {
                    return false;
                }
            }
        }
        return true;
    };
    let isSolidCheck = function (xMibi, yMibi, solidId) {
        if (solidId === null)
            return false;
        if (solidId === 0)
            return true;
        if (solidId === 5)
            return xMibi >= yMibi * 2;
        if (solidId === 6) {
            if (yMibi <= 24 * 1024)
                return true;
            return xMibi >= (yMibi - 24 * 1024) * 2;
        }
        if (solidId === 7)
            return yMibi * 2 + xMibi <= 96 * 1024;
        if (solidId === 8)
            return yMibi * 2 <= 48 * 1024 - xMibi;
        if (solidId === 9)
            return yMibi <= xMibi;
        if (solidId === 10)
            return yMibi * 2 >= 96 * 1024 - xMibi;
        if (solidId === 11)
            return yMibi * 2 >= 48 * 1024 - xMibi;
        if (solidId === 12)
            return yMibi * 2 >= xMibi;
        if (solidId === 13)
            return yMibi * 2 >= 48 * 1024 + xMibi;
        if (solidId === 14)
            return yMibi <= 48 * 1024 - xMibi;
        if (solidId === 15)
            return yMibi <= -48 * 1024 + xMibi * 2;
        if (solidId === 16)
            return yMibi <= 48 * 1024 - xMibi * 2;
        if (solidId === 17)
            return yMibi >= 48 * 1024 - xMibi * 2;
        if (solidId === 18)
            return yMibi >= -48 * 1024 + xMibi * 2;
        if (solidId === 19)
            return yMibi >= 48 * 1024 - xMibi;
        if (solidId === 20)
            return yMibi <= xMibi * 2;
        if (solidId === 21)
            return yMibi <= 96 * 1024 - xMibi * 2;
        if (solidId === 22)
            return yMibi >= 96 * 1024 - xMibi * 2;
        if (solidId === 23)
            return yMibi >= xMibi * 2;
        if (solidId === 24)
            return yMibi >= xMibi;
        throw new Error("Unrecognized solidId: " + solidId);
    };
    let isSolid = function (xMibi, yMibi, xOffsetInMibipixels, widthInTiles, heightInTiles, solidLayer) {
        xMibi -= xOffsetInMibipixels;
        let tileX = Math.floor((xMibi >> 10) / 48);
        let tileY = Math.floor((yMibi >> 10) / 48);
        if (tileX < 0 || tileX >= widthInTiles || tileY < 0 || tileY >= heightInTiles)
            return false;
        let solidId = solidLayer[tileX][tileY];
        let offsetX = xMibi - 48 * 1024 * tileX;
        let offsetY = yMibi - 48 * 1024 * tileY;
        return isSolidCheck(offsetX, offsetY, solidId);
    };
    return {
        isSolid,
        isValidSolidLayer
    };
})());
