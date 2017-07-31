var Jimp = require("jimp");
var fs = require('fs');

process.stdout.write('\x1B[2J\x1B[0f');
console.log("");
console.log("");
console.log("    ░██▓███   ██      ██▓██▓    ██▓    █    ██  ██████████████▓██▀███  ▄▄▄    ████████▓█████▓█████▄ ");
console.log("    ▓██░  ██▒ ██      ▒▒▓██▒   ▓██▒    ██  ▓██▒██    ▒▓  ██▒ ▓▓██ ▒ ██▒████▄  ▓  ██▒ ▓▓█   ▀▒██▀ ██▌");
console.log("    ▓██░ ██▓▒ ▒█  ██ ▒██▒██░   ▒██░   ▓██  ▒██░ ▓██▄  ▒ ▓██░ ▒▓██ ░▄█ ▒██  ▀█▄▒ ▓██░ ▒▒███  ░██   █▌");
console.log("    ▒██▄█▓▒ ▒  █  ▒▒ ░██▒██░   ▒██░   ▓▓█  ░██░ ▒   ██░ ▓██▓ ░▒██▀▀█▄ ░██▄▄▄▄█░ ▓██▓ ░▒▓█  ▄░▓█▄   ▌");
console.log("    ▒██▒ ░  ░ ████   ░██░██████░██████▒▒█████▓▒██████▒▒ ▒██▒ ░░██▓ ▒██▒▓█   ▓██▒▒██▒ ░░▒████░▒████▓ ");
console.log("    ▒▓▒░ ░  ░ ▒░▒▒   ░▓ ░ ▒░▓  ░ ▒░▓  ░▒▓▒ ▒ ▒▒ ▒▓▒ ▒ ░ ▒ ░░  ░ ▒▓ ░▒▓░▒▒   ▓▒█░▒ ░░  ░░ ▒░ ░▒▒▓  ▒ ");
console.log("    ░▒ ░        ░▒    ▒ ░ ░ ▒  ░ ░ ▒  ░░▒░ ░ ░░ ░▒  ░ ░   ░     ░▒ ░ ▒░ ▒   ▒▒ ░  ░    ░ ░  ░░ ▒  ▒ ");
console.log("    ░░           ░    ▒ ░ ░ ░    ░ ░   ░░░ ░ ░░  ░  ░   ░       ░░   ░  ░   ▒   ░        ░   ░ ░  ░ ");
console.log("    ------------------------------------------------------------------------------------------------");
console.log("    --Dal1980--------------------------------------------------P1-illustrated--Version 1.0--(beta)--");
console.log("");



var rowElements = [ "joy,8n,0,0,red,", "btn,na,0,0,yellow,", "btn,na,0,0,blue,", "btn,na,0,0,green,", "btn,na,0,0,yellow," ];
var platterW = 1000;
var platterY = 500;
var image = new Jimp( platterW, platterY );
var saveImgAs = "test.png";
var btnLayoutCoords = {
    "meta": {
        "width": 95,
        "height": 91
    },
    "4-1": {
        0: [0,112],
        1: [110,112],
        2: [80,0],
        3: [190,0]
    },
    "4-2": {
        0: [0,71],
        1: [110,142],
        2: [220,71],
        3: [110,0]
    },
    "4-3": {
        0: [0,71],
        1: [110,0],
        2: [220,0],
        3: [330,0]
    }
};


var buttonColours = [];

for(var n = 0; n < rowElements.length; n++){
    var elementArray = rowElements[n].split(',');
    if(elementArray[0] == 'btn'){
        buttonColours.push( elementArray[4] );
    }
}
var totalButtons = buttonColours.length;

if(totalButtons > 0) addButtons(totalButtons, buttonColours)

function addButtons(totalButtons, buttonColoursArray){
    
    var layoutID = '1';
    var minXCoord = 0;
    var maxXCoord = 0;
    var minYCoord = 0;
    var maxYCoord = 0;
    
    for(var bc = 0; bc < buttonColoursArray.length; bc++){
        var btnX = parseInt(btnLayoutCoords[ totalButtons + '-' + layoutID ][bc][0]);
        var btnY = parseInt(btnLayoutCoords[ totalButtons + '-' + layoutID ][bc][1]);

        //find the surface area (via loop)
        if(btnX < minXCoord) minXCoord = btnX;
        if(btnX > maxXCoord) maxXCoord = btnX;
        if(btnY < minYCoord) minYCoord = btnY;
        if(btnY > maxYCoord) maxYCoord = btnY;
    }

    //find centre - this needs to be done as a whole somehow?
    var startX = Math.floor( ( platterW - (maxXCoord + minXCoord) - btnLayoutCoords.meta.width ) / 2 );
    var startY = Math.floor( ( platterY - (maxYCoord + minYCoord) - btnLayoutCoords.meta.height ) / 2 );

    for(var bc = 0; bc < buttonColoursArray.length; bc++){
        var btnAsset = 'images\\assets\\button_' + buttonColoursArray[bc];
        var btnX = btnLayoutCoords[ totalButtons + '-' + layoutID ][bc][0];
        var btnY = btnLayoutCoords[ totalButtons + '-' + layoutID ][bc][1];

        addPart( image, btnAsset, btnX + startX, btnY + startY );
    }

    
}


/*

var saveImgAs = "test.png";
addPart( image, '_button', 150, 50 );
addPart( image, '_label', 150, 150 );
addPart( image, '_stick', 450, 50 );
addPart( image, 'in', 150, 50 );
*/

function addPart( jimpObj, fn, xPos, yPos ){
    Jimp.read(fn + ".png", function( err, el ) {
        if (err) throw err;
        image.composite( el, xPos, yPos );
        image.write(saveImgAs); // save
    });
}
