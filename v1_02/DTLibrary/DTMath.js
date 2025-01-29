let DTMath = ((function () {
    "use strict";
    let normalizeDegreesScaled = function (degreesScaled) {
        if (degreesScaled >= 0 && degreesScaled < 360 * 128)
            return degreesScaled;
        if (degreesScaled < 0)
            degreesScaled = degreesScaled + 360 * 128 * 2;
        let multiple = Math.floor(degreesScaled / (360 * 128));
        degreesScaled = degreesScaled - multiple * (360 * 128);
        while (degreesScaled < 0)
            degreesScaled = degreesScaled + 360 * 128;
        while (degreesScaled >= 360 * 128)
            degreesScaled = degreesScaled - 360 * 128;
        return degreesScaled;
    };
    // Given X as input, returns 1024 * sin(X / 128 degrees)
    let sineScaled = function (degreesScaled) {
        if (degreesScaled < 0)
            degreesScaled = degreesScaled + 360 * 128 * 2;
        if (degreesScaled < 0)
            return -sineScaled(-degreesScaled);
        let degreesTimes32 = degreesScaled >> 2;
        let newDegreesTimes32;
        if (degreesTimes32 < 360 * 32)
            newDegreesTimes32 = degreesTimes32;
        else {
            let division = Math.floor(degreesTimes32 / (360 * 32));
            newDegreesTimes32 = degreesTimes32 - 360 * 32 * division;
        }
        if (newDegreesTimes32 < 180 * 32)
            return DTMathHelper.sineArray[newDegreesTimes32];
        else {
            let translatedDegrees = newDegreesTimes32 - 180 * 32;
            return -DTMathHelper.sineArray[translatedDegrees];
        }
    };
    // Given X as input, returns 1024 * cos(X / 128 degrees)
    let cosineScaled = function (degreesScaled) {
        if (degreesScaled < 0)
            degreesScaled = degreesScaled + 360 * 128 * 2;
        if (degreesScaled < 0)
            degreesScaled = -degreesScaled;
        if (degreesScaled >= 360 * 128) {
            let division = Math.floor(degreesScaled / (360 * 128));
            degreesScaled = degreesScaled - 360 * 128 * division;
        }
        let newDegrees = degreesScaled + 90 * 128;
        if (newDegrees >= 360 * 128)
            newDegrees -= 360 * 128;
        return sineScaled(newDegrees);
    };
    // Returns arctan(x, y) * 128, using degrees (not radians)
    let arcTangentScaled = function (x, y) {
        if (x === 0) {
            if (y > 0)
                return 90 * 128;
            else
                return -90 * 128;
        }
        if (y === 0) {
            if (x > 0)
                return 0;
            else
                return 180 * 128;
        }
        if (x > 0 && y > 0) {
            let result;
            if (x >= 15 * 1000 * 1000 || y >= 15 * 1000 * 1000) {
                result = Math.floor((y * 128) / x);
                if (result >= 1000 * 1000 * 1000)
                    result = 1000 * 1000 * 1000;
            }
            else
                result = Math.floor((y << 7) / x);
            if (result >= DTMathHelper.arctanArray.length)
                result = DTMathHelper.arctanArray.length - 1;
            let angle = DTMathHelper.arctanArray[result];
            return angle;
        }
        if (x < 0 && y > 0) {
            let negativeX;
            if (x <= -2147483648)
                negativeX = 2147483647;
            else
                negativeX = -x;
            return 90 * 128 + arcTangentScaled(y, negativeX);
        }
        if (y < 0) {
            let negativeY;
            if (y <= -2147483648)
                negativeY = 2147483647;
            else
                negativeY = -y;
            return -arcTangentScaled(x, negativeY);
        }
        throw new Error("Unreachable");
    };
    let arcTangentScaledSafe = function (x, y) {
        if (x === 0 && y === 0)
            return 0;
        return arcTangentScaled(x, y);
    };
    return {
        normalizeDegreesScaled,
        sineScaled,
        cosineScaled,
        arcTangentScaled,
        arcTangentScaledSafe
    };
})());
