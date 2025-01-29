let GameMouse = {
    getMouse: function () {
        "use strict";
        let mouseXPosition = -50;
        let mouseYPosition = -50;
        let canvas = null;
        let mouseMoveHandler = function (e) {
            if (canvas === null) {
                canvas = document.getElementById("gameCanvas");
                if (canvas === null)
                    return;
            }
            let canvasCssWidth = canvas.offsetWidth;
            let canvasCssHeight = canvas.offsetHeight;
            let xPosition = (e.pageX !== null && e.pageX !== undefined ? e.pageX : e.clientX) - canvas.offsetLeft;
            let canvasXScaling = canvasCssWidth / canvas.width;
            if (canvasXScaling < 0.001)
                canvasXScaling = 0.001;
            xPosition = Math.round(xPosition / canvasXScaling);
            if (xPosition < -5)
                xPosition = -5;
            if (xPosition > canvas.width + 5)
                xPosition = canvas.width + 5;
            let yPosition = (e.pageY !== null && e.pageY !== undefined ? e.pageY : e.clientY) - canvas.offsetTop;
            let canvasYScaling = canvasCssHeight / canvas.height;
            if (canvasYScaling < 0.001)
                canvasYScaling = 0.001;
            yPosition = Math.round(yPosition / canvasYScaling);
            if (yPosition < -5)
                yPosition = -5;
            if (yPosition > canvas.height + 5)
                yPosition = canvas.height + 5;
            mouseXPosition = xPosition;
            mouseYPosition = canvas.height - yPosition - 1;
        };
        let isLeftMouseButtonPressed = false;
        let isRightMouseButtonPressed = false;
        let checkMouseButtonHandler = function (e) {
            if ((e.buttons & 1) === 1)
                isLeftMouseButtonPressed = true;
            else
                isLeftMouseButtonPressed = false;
            if ((e.buttons & 2) === 2)
                isRightMouseButtonPressed = true;
            else
                isRightMouseButtonPressed = false;
        };
        let disableContextMenu;
        disableContextMenu = function () {
            if (canvas === null) {
                canvas = document.getElementById("gameCanvas");
                if (canvas === null) {
                    setTimeout(disableContextMenu, 50);
                    return;
                }
            }
            canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
        };
        disableContextMenu();
        document.addEventListener("mousemove", function (e) { mouseMoveHandler(e); checkMouseButtonHandler(e); }, false);
        document.addEventListener("mousedown", function (e) { checkMouseButtonHandler(e); }, false);
        document.addEventListener("mouseup", function (e) { checkMouseButtonHandler(e); }, false);
        return {
            isLeftMouseButtonPressed: function () { return isLeftMouseButtonPressed; },
            isRightMouseButtonPressed: function () { return isRightMouseButtonPressed; },
            getX: function () { return Math.round(mouseXPosition); },
            getY: function () { return Math.round(mouseYPosition); }
        };
    }
};
