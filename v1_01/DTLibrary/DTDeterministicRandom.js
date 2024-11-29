let DTDeterministicRandomUtil = {
    getRandom: function (seed) {
        seed = (seed !== null) ? seed : 0;
        let normalizeSeed = function () {
            if (seed < 0)
                seed = -seed;
            if (seed < 0)
                seed = 0;
            if (seed >= 2 * 1000 * 1000 * 1000)
                seed = seed % (2 * 1000 * 1000 * 1000);
        };
        normalizeSeed();
        let getSeed = function () {
            return seed;
        };
        let addSeed = function (i) {
            seed = seed + i;
            normalizeSeed();
        };
        let nextInt = function (i) {
            if (i === 1)
                return 0;
            let a = (((48271 * seed) | 0) + 11) | 0;
            let b = (((48271 * a) | 0) + 11) | 0;
            seed = b;
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
