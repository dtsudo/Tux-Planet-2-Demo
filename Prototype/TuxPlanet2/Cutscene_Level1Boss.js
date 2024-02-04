// REVIEW ME
let Cutscene_Level1Boss = {};
((function () {
    let dialogue = [
        {
            isKonqi: false,
            text: "Are you a dinosaur?",
            width: 250
        },
        {
            isKonqi: true,
            text: "No. I'm a dragon!",
            width: 200
        },
        {
            isKonqi: false,
            text: "You're a flying dragon?",
            width: 295
        },
        {
            isKonqi: true,
            text: "That's right. I'm Konqi the Dragon!",
            width: 400
        },
        {
            isKonqi: false,
            text: "I see. Then I shall use ice attacks!",
            width: 410
        },
        {
            isKonqi: true,
            text: "I only have one hit point in any case.",
            width: 440
        }
    ];
    let getCutscene = function (dialogueIndex, frameCounter, owlEnemyId, owlXMibi, owlYMibi, playerXMibi, playerYMibi) {
        let getSnapshot = function (thisObj) {
            return getCutscene(dialogueIndex, frameCounter, owlEnemyId, owlXMibi, owlYMibi, playerXMibi, playerYMibi);
        };
        let processFrame = function (gameState, enemyMapping, frameInput, musicOutput) {
            playerXMibi = gameState.playerState.xMibi;
            playerYMibi = gameState.playerState.yMibi;
            let owlEnemy = enemyMapping[owlEnemyId];
            let owlEnemyAsOwl = owlEnemy;
            owlXMibi = owlEnemyAsOwl.getXMibi();
            owlYMibi = owlEnemyAsOwl.getYMibi();
            //if (frameCounter === null)
            //	musicOutput.stopMusic();
            if (frameInput.continueDialogue && frameCounter === null) {
                dialogueIndex++;
                if (dialogueIndex === dialogue.length) {
                    if (frameCounter === null)
                        frameCounter = 0;
                }
            }
            if (frameCounter !== null) {
                frameCounter++;
                if (frameCounter === 1)
                    gameState.background.startBoss();
                musicOutput.playMusic(1 /* GameMusic.ChiptuneLevel3 */, 100);
            }
            if (frameCounter !== null && frameCounter === 50) {
                gameState.cutscene = null;
                owlEnemyAsOwl.transformToLevel1Boss();
            }
            return {
                updatedFrameInput: {
                    up: frameInput.up,
                    down: frameInput.down,
                    left: frameInput.left,
                    right: frameInput.right,
                    shoot: false,
                    continueDialogue: frameInput.continueDialogue
                },
                shouldCreateAutoSavestate: frameCounter !== null && frameCounter === 1
            };
        };
        let drawDialogue = function (x, y, width, text, displayOutput) {
            let numLines = text.length - text.replace("\n", "").length + 1;
            let height = numLines * 24;
            displayOutput.drawRectangle(x, y, width, height, { r: 0, g: 0, b: 0, alpha: 150 }, true);
            displayOutput.drawText(x, y + height, text, 0 /* GameFont.SimpleFont */, 24, white);
        };
        let render = function (displayOutput) {
            if (frameCounter === null && owlXMibi !== null && owlYMibi !== null && playerXMibi !== null && playerYMibi !== null) {
                let currentText = dialogue[dialogueIndex];
                let isKonqi = currentText.isKonqi;
                let text = currentText.text;
                let x;
                let y;
                let width = currentText.width;
                if (isKonqi) {
                    x = (playerXMibi >> 10) - Math.floor(width / 2);
                    y = (playerYMibi >> 10) + 35;
                }
                else {
                    x = (owlXMibi >> 10) - Math.floor(width / 2);
                    y = (owlYMibi >> 10) + 35;
                }
                drawDialogue(x, y, width, text, displayOutput);
            }
        };
        return {
            getSnapshot,
            processFrame,
            render
        };
    };
    Cutscene_Level1Boss.getCutscene = function (owlEnemyId) {
        return getCutscene(0, null, owlEnemyId, null, null, null, null);
    };
})());
