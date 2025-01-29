let GameImageUtil = {
    getImageNames: function () {
        return [
            0 /* GameImage.SoundOn_Black */,
            1 /* GameImage.SoundOff_Black */,
            2 /* GameImage.MusicOn_Black */,
            3 /* GameImage.MusicOff_Black */,
            4 /* GameImage.SoundOn_White */,
            5 /* GameImage.SoundOff_White */,
            6 /* GameImage.MusicOn_White */,
            7 /* GameImage.MusicOff_White */,
            8 /* GameImage.KonqiAir */,
            9 /* GameImage.TinyFlame */,
            10 /* GameImage.FlyAmanita */,
            11 /* GameImage.Smartcap */,
            12 /* GameImage.Smartcap_Mirrored */,
            13 /* GameImage.Snowfly */,
            14 /* GameImage.Snowfly_Mirrored */,
            15 /* GameImage.OgJumpy */,
            16 /* GameImage.OgJumpy_Mirrored */,
            17 /* GameImage.Ocean */,
            18 /* GameImage.Noone */,
            19 /* GameImage.NooneIce */,
            20 /* GameImage.ExplodeF */,
            21 /* GameImage.Strawberry */,
            22 /* GameImage.Freezewave */,
            23 /* GameImage.Poof */,
            24 /* GameImage.OverworldTileset_Snow */,
            25 /* GameImage.OverworldTileset_PathDirt */,
            26 /* GameImage.LevelIcons */,
            27 /* GameImage.KonqiO */,
            28 /* GameImage.OwlBrown */,
            29 /* GameImage.DarkKonqi_Mirrored */,
            30 /* GameImage.Flame */,
            31 /* GameImage.FlameBlue */,
            32 /* GameImage.FlameGreen */,
            33 /* GameImage.CyraDoll */,
            34 /* GameImage.DashieDoll */,
            35 /* GameImage.Iceball */,
            36 /* GameImage.Skull */,
            37 /* GameImage.BossHealth */,
            38 /* GameImage.ExplodeI */,
            39 /* GameImage.BouncySnow */,
            40 /* GameImage.BouncySnow_Mirrored */,
            41 /* GameImage.TsSnow */,
            42 /* GameImage.SignPost */,
            43 /* GameImage.Igloo */,
            44 /* GameImage.IceCaveTiles */,
            45 /* GameImage.Treetops */,
            46 /* GameImage.Level1Screenshot */,
            47 /* GameImage.Level2Screenshot */
        ];
    },
    getFilename: function (image) {
        switch (image) {
            case 0 /* GameImage.SoundOn_Black */: return "Kenney/SoundOn_Black.png";
            case 1 /* GameImage.SoundOff_Black */: return "Kenney/SoundOff_Black.png";
            case 2 /* GameImage.MusicOn_Black */: return "Kenney/MusicOn_Black.png";
            case 3 /* GameImage.MusicOff_Black */: return "Kenney/MusicOff_Black.png";
            case 4 /* GameImage.SoundOn_White */: return "Kenney/SoundOn_White.png";
            case 5 /* GameImage.SoundOff_White */: return "Kenney/SoundOff_White.png";
            case 6 /* GameImage.MusicOn_White */: return "Kenney/MusicOn_White.png";
            case 7 /* GameImage.MusicOff_White */: return "Kenney/MusicOff_White.png";
            case 8 /* GameImage.KonqiAir */: return "KelvinShadewing/konqiair.png";
            case 9 /* GameImage.TinyFlame */: return "KelvinShadewing/tinyflame.png";
            case 10 /* GameImage.FlyAmanita */: return "KelvinShadewing/flyamanita.png";
            case 11 /* GameImage.Smartcap */: return "KelvinShadewing/smartcap.png";
            case 12 /* GameImage.Smartcap_Mirrored */: return "KelvinShadewing/smartcap_mirrored.png";
            case 13 /* GameImage.Snowfly */: return "KelvinShadewing/snowfly.png";
            case 14 /* GameImage.Snowfly_Mirrored */: return "KelvinShadewing/snowfly_mirrored.png";
            case 15 /* GameImage.OgJumpy */: return "CrystalizedSun/og-jumpy.png";
            case 16 /* GameImage.OgJumpy_Mirrored */: return "CrystalizedSun/og-jumpy_mirrored.png";
            case 17 /* GameImage.Ocean */: return "KnoblePersona/ocean.png";
            case 18 /* GameImage.Noone */: return "KelvinShadewing/noone.png";
            case 19 /* GameImage.NooneIce */: return "KelvinShadewing/noone_ice.png";
            case 20 /* GameImage.ExplodeF */: return "KelvinShadewing/explodeF.png";
            case 21 /* GameImage.Strawberry */: return "KelvinShadewing/strawberry.png";
            case 22 /* GameImage.Freezewave */: return "KelvinShadewing/freezewave.png";
            case 23 /* GameImage.Poof */: return "KelvinShadewing/poof.png";
            case 24 /* GameImage.OverworldTileset_Snow */: return "BenCreating/Snow/Snow.png";
            case 25 /* GameImage.OverworldTileset_PathDirt */: return "BenCreating/PathDirt.png";
            case 26 /* GameImage.LevelIcons */: return "KelvinShadewing/level-icons.png";
            case 27 /* GameImage.KonqiO */: return "KelvinShadewing/konqiO.png";
            case 28 /* GameImage.OwlBrown */: return "KelvinShadewing/owl-brown.png";
            case 29 /* GameImage.DarkKonqi_Mirrored */: return "KelvinShadewing/konqi_dark_mirrored.png";
            case 30 /* GameImage.Flame */: return "KelvinShadewing/flame.png";
            case 31 /* GameImage.FlameBlue */: return "KelvinShadewing/flameBlue.png";
            case 32 /* GameImage.FlameGreen */: return "KelvinShadewing/flameGreen.png";
            case 33 /* GameImage.CyraDoll */: return "KelvinShadewing/cyradoll.png";
            case 34 /* GameImage.DashieDoll */: return "KelvinShadewing/dashie-doll.png";
            case 35 /* GameImage.Iceball */: return "KelvinShadewing/iceball.png";
            case 36 /* GameImage.Skull */: return "KelvinShadewing/skull.png";
            case 37 /* GameImage.BossHealth */: return "KelvinShadewing/boss-health.png";
            case 38 /* GameImage.ExplodeI */: return "KelvinShadewing/explodeI.png";
            case 39 /* GameImage.BouncySnow */: return "KelvinShadewing/bouncysnow.png";
            case 40 /* GameImage.BouncySnow_Mirrored */: return "KelvinShadewing/bouncysnow_mirrored.png";
            case 41 /* GameImage.TsSnow */: return "KelvinShadewing/tssnow.png";
            case 42 /* GameImage.SignPost */: return "Nemisys/signpost.png";
            case 43 /* GameImage.Igloo */: return "KelvinShadewing/igloo.png";
            case 44 /* GameImage.IceCaveTiles */: return "KelvinShadewing/icecavetiles.png";
            case 45 /* GameImage.Treetops */: return "Treetops/treetops.png";
            case 46 /* GameImage.Level1Screenshot */: return "Screenshots/Level1Screenshot.png";
            case 47 /* GameImage.Level2Screenshot */: return "Screenshots/Level2Screenshot.png";
        }
    }
};
