let DTDeterministicRandomUtil = {
    getRandom: function (seed) {
        let x = (seed !== null) ? seed : 0;
        let normalizeX = function () {
            if (x < 0)
                x = -x;
            if (x < 0)
                x = 0;
            if (x > 2 * 1000 * 1000 * 1000)
                x = x % (2 * 1000 * 1000 * 1000);
        };
        normalizeX();
        let getSeed = function () {
            return x;
        };
        let addSeed = function (i) {
            x = x + i;
            normalizeX();
        };
        let nextInt = function (i) {
            if (i === 1)
                return 0;
            let a = (((48271 * x) | 0) + 11) | 0;
            let b = (((48271 * a) | 0) + 11) | 0;
            x = b;
            let c = ((a >> 16) << 16) | ((b >> 16) & 0xffff);
            if (c < 0)
                c = -c;
            if (c < 0)
                c = 0;
            return c % i;
        };
        let nextBool = function () {
            return nextInt(2) === 1;
        };
        return {
            getSeed,
            addSeed,
            nextInt,
            nextBool
        };
    }
};
