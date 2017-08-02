var Jimp = require("jimp");
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

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
var imageTracker = "";

var dbName = "roms.db"; //SQLite db file (in db folder)
var db = new sqlite3.Database('db\\' + dbName);

//returns for a promise on reading a json file
var schema = Promise;

const getSchema = (filename) => {
    return new Promise((resolve, reject) => {
        return fs.readFile('data\\' + filename, 'utf8', function (err, data) {
            if (err) return reject( err );
            else return resolve( JSON.parse(data) ); //kaboom - our data object is back
        });
    });
};

var schema = getSchema('schema.json')
    .then(function(schema){
        return new Promise((resolve, reject) => {

            db.each("SELECT * FROM `p1i` WHERE `element_1` != '' LIMIT 3", function(err, row) {
                if(err) console.log(err);
                console.log(row.name + ": " + row.element_1);
                prepElements(schema, row);
            });

            
        });
    }); //end then

function prepElements(schema, row){

    var buttonColours = [];
    var joyColour = "";
    var totalButtons = 0;

    for(var n = 1; n < 9; n++){
        if(typeof row['element_' + n] != "undefined" && row['element_' + n] != ""){
            var elementArray = row['element_' + n].split(',');
            if(elementArray.length == 6){
                if(elementArray[0] == 'btn'){
                    buttonColours.push( elementArray[4] );
                }
                else if(elementArray[0] == 'joy'){
                    joyWays = elementArray[1];
                    joyColour = elementArray[4];
                }
            }
        }
    }
    

    var totalButtons = buttonColours.length;
    console.log('buttonTotal: ' + totalButtons);
    saveImgAs = row.name;
    console.log(saveImgAs);
    if(joyColour != "") addJoy(schema, joyColour, joyWays, saveImgAs);
    if(totalButtons > 0) addButtons(schema, totalButtons, buttonColours, saveImgAs);
    
}

function addJoy(schema, joyColour, joyWays, saveImgAs){
    //schema.joy.width
    //schema.joy.height
    //joyColour
    var joyAsset = 'images\\assets\\joy_' + joyWays + '_' + joyColour;
    if(saveImgAs != "") addPart( joyAsset, 0, 0, saveImgAs );
}

function addButtons(schema, totalButtons, buttonColoursArray, saveImgAs){
    
    var layoutID = '1';
    var minXCoord = 0;
    var maxXCoord = 0;
    var minYCoord = 0;
    var maxYCoord = 0;
    
    for(var bc = 0; bc < buttonColoursArray.length; bc++){

        var btnX = parseInt(schema.buttons[ totalButtons + '-' + layoutID ][bc]['x']);
        var btnY = parseInt(schema.buttons[ totalButtons + '-' + layoutID ][bc]['y']);

        //find the surface area (via loop)
        if(btnX < minXCoord) minXCoord = btnX;
        if(btnX > maxXCoord) maxXCoord = btnX;
        if(btnY < minYCoord) minYCoord = btnY;
        if(btnY > maxYCoord) maxYCoord = btnY;
    }

    //find centre - this needs to be done as a whole somehow?
    var startX = Math.floor( ( platterW - (maxXCoord + minXCoord) - schema.buttons.width ) / 2 );
    var startY = Math.floor( ( platterY - (maxYCoord + minYCoord) - schema.buttons.height ) / 2 );

    for(var bc = 0; bc < buttonColoursArray.length; bc++){
        var buttonAsset = 'images\\assets\\button_' + buttonColoursArray[bc];
        var btnX = schema.buttons[ totalButtons + '-' + layoutID ][bc]['x'];
        var btnY = schema.buttons[ totalButtons + '-' + layoutID ][bc]['y'];

        if(saveImgAs != "") addPart( buttonAsset, btnX + startX, btnY + startY, saveImgAs );
    }

    
}


/*
var saveImgAs = "test.png";
addPart( image, '_button', 150, 50 );
addPart( image, '_label', 150, 150 );
addPart( image, '_stick', 450, 50 );
addPart( image, 'in', 150, 50 );
*/

function addPart( jimpObj, fn, xPos, yPos, saveImgAs ){
    console.log('Adding part: ' + fn + ' x: ' + xPos + ' y: ' + yPos);
    Jimp.read(fn + ".png", function( err, el ) {
        if (err) throw err;
        console.log(saveImgAs + " ?= " + imageTracker);
        if(saveImgAs != imageTracker){
            imageTracker = saveImgAs;
            var image = new Jimp(1000, 500);
        }
        image.composite( el, xPos, yPos );
        image.write("set\\" + saveImgAs + ".png"); // save
    });
}


