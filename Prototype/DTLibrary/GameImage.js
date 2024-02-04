let GameImageUtil = {
    getImageNames: function () {
        return [
            0 /* GameImage.SoundOn */,
            1 /* GameImage.SoundOff */,
            2 /* GameImage.MusicOn */,
            3 /* GameImage.MusicOff */,
            4 /* GameImage.KonqiAir */,
            5 /* GameImage.TinyFlame */,
            6 /* GameImage.FlyAmanita */,
            7 /* GameImage.Ocean */,
            8 /* GameImage.Noone */,
            9 /* GameImage.ExplodeF2 */,
            10 /* GameImage.Strawberry */,
            11 /* GameImage.Freezewave */,
            12 /* GameImage.Poof */,
            13 /* GameImage.OwlBrown */,
            14 /* GameImage.CyraDoll */,
            15 /* GameImage.DashieDoll */,
            16 /* GameImage.Iceball */,
            17 /* GameImage.Skull */,
            18 /* GameImage.BossHealth */,
            19 /* GameImage.ExplodeI */,
            20 /* GameImage.BouncySnow */
        ];
    },
    getFilename: function (image) {
        switch (image) {
            case 0 /* GameImage.SoundOn */: return "Kenney/SoundOn.png";
            case 1 /* GameImage.SoundOff */: return "Kenney/SoundOff.png";
            case 2 /* GameImage.MusicOn */: return "Kenney/MusicOn.png";
            case 3 /* GameImage.MusicOff */: return "Kenney/MusicOff.png";
            case 4 /* GameImage.KonqiAir */: return "KelvinShadewing/konqiair.png";
            case 5 /* GameImage.TinyFlame */: return "KelvinShadewing/tinyflame.png";
            case 6 /* GameImage.FlyAmanita */: return "KelvinShadewing/flyamanita.png";
            case 7 /* GameImage.Ocean */: return "KnoblePersona/ocean.png";
            case 8 /* GameImage.Noone */: return "KelvinShadewing/noone.png";
            case 9 /* GameImage.ExplodeF2 */: return "KelvinShadewing/explodeF.png";
            case 10 /* GameImage.Strawberry */: return "KelvinShadewing/strawberry.png";
            case 11 /* GameImage.Freezewave */: return "KelvinShadewing/freezewave.png";
            case 12 /* GameImage.Poof */: return "KelvinShadewing/poof.png";
            case 13 /* GameImage.OwlBrown */: return "KelvinShadewing/owl-brown.png";
            case 14 /* GameImage.CyraDoll */: return "KelvinShadewing/cyradoll.png";
            case 15 /* GameImage.DashieDoll */: return "KelvinShadewing/dashie-doll.png";
            case 16 /* GameImage.Iceball */: return "KelvinShadewing/iceball.png";
            case 17 /* GameImage.Skull */: return "KelvinShadewing/skull.png";
            case 18 /* GameImage.BossHealth */: return "KelvinShadewing/boss-health.png";
            case 19 /* GameImage.ExplodeI */: return "KelvinShadewing/explodeI.png";
            case 20 /* GameImage.BouncySnow */: return "KelvinShadewing/bouncysnow.png";
        }
    }
};
