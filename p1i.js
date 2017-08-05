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

var limit = 0;
var offset = 0;

var platterW = 1000;
var platterH = 500;
//var image = new Jimp( platterW, platterH );

var imageTracker = "";

var dbName = "roms.db"; //SQLite db file (in db folder)
var db = new sqlite3.Database('db\\' + dbName);



//synchronous read of our schema
var schema = JSON.parse( fs.readFileSync("data\\schema.json") );

//Jimp assets
var jimpFont;

//Lycos, fetch me my database, good boy!
var prepElements = function(callback){
    db.each("SELECT * FROM `p1i` WHERE `name` == 'asteroid'", function(err, row) {
        if(err) console.log(err);
        callback(err, row);        
    });
};

//callback from our database row row
Jimp.loadFont("data\\fonts\\lato.fnt").then(function(font){
    jimpFont = font;
}).then(function(){
    prepElements(function(err, row){
        var p1i = {}; //stores our row as a structured object
        p1i.totalElements = 0;  //how many total elements
        p1i.totalButtons = 0; //how many total buttons found
        p1i.elements = []; //records all our elements (obj-array)
        p1i.buttonIndexes = []; //records indexes of button entries (array)

        Object.keys(row).forEach(function(key){
            if(/element_/.test(key)) p1i = explodeElement( p1i, row[key].toString() );
            if(key == 'name') p1i.name = row[key];
            else if(key == 'version') p1i.version = row[key];
        });

        //we now have our preliminary object from the db row info
        //we can gather more info from each of these functions
        updateConsole("    Preparing image parts: " + p1i.name + "                               ");
        p1i = organiseButtonLayouts(p1i);
        p1i = organisePlacements(p1i);
        jimpImgObj = placeElements(p1i);
        if(p1i.version == '0') addBetaTag(jimpImgObj, p1i);
        //console.log(p1i);

    });
});

function explodeElement(el, csvGrp){
    var elementArray = csvGrp.split(',');
    //setup a template for our element
    var tempElement = {};
    tempElement.device = null;
    tempElement.design = null;
    tempElement.relX = null;
    tempElement.relY = null;
    tempElement.colour = null;
    tempElement.width = null;
    tempElement.height = null;
    tempElement.text = null;

    if(elementArray.length == 6){
        tempElement = {
            'device': elementArray[0],
            'design': elementArray[1],
            'relX': elementArray[2],
            'relY': elementArray[3],
            'colour': elementArray[4],
        };
        if(elementArray[0] == 'btn'){
            if(elementArray[5] != ''){
                tempElement.text = elementArray[5].replace(/[^A-Za-z0-9\-\.]/g, '');
                tempElement.text = tempElement.text.substring(0, 7);
                tempElement.text = tempElement.text.toUpperCase();
            }
            el.totalButtons += 1;
            el.buttonIndexes.push(el.totalElements);
            tempElement.width = schema.buttons.width;
            tempElement.height = schema.buttons.height;
            //we then need to use our first element to gather design info
            if(el.totalButtons == 1){
                //we need to check if it's a number... or replace this with 1 (default design in schema)
                if(elementArray[1] == parseInt(elementArray[1], 10)) el.buttonDesign = elementArray[1];
                else el.buttonDesign = '1';
            }
        }
        else if(elementArray[0] == 'joy' || elementArray[0] == 'stick' || elementArray[0] == 'positional'){
            tempElement.width = schema[ elementArray[0] ].width;
            tempElement.height = schema[ elementArray[0] ].height;
        }

        el.totalElements += 1;
    }
    el.elements.push( tempElement );
    return el;
}

function organisePlacements(p1i){
    //we now need to add all of the heights and widths up and see
    //what space we are left on the canvas. This is then distributed
    //across the total number of elements (button-sets) so we have
    //a nice alignment of elements.

    //The future of this function will be that of allowing for customised
    //placement with the condition that all elements must be given custom
    //arrangement co-ordinates. We can add options for (c)entralising elements
    //on the x and y axis which means we borrow from the functionality above
    //to find comfortable placements.
    var allWidths = 0;
    var groupCount = 0;
    for(var n = 0; n < p1i.totalElements; n++){
        if(p1i.elements[n].device != 'btn'){
            allWidths += p1i.elements[n].width;
            groupCount++;
        }
    }
    //add our button group width to the calculation
    if(p1i.totalButtons > 0){
        allWidths += p1i.buttonSet.width;
        groupCount++;
    }
    console.log('allWidths: ' + allWidths);
    p1i.groupCount = groupCount;
    //we should now have all part widths
    //(hopefully this is not greater than the width of canvas)
    if(allWidths < platterW){
        p1i.distroMarginWidth = Math.floor( ( platterW - allWidths ) / (groupCount + 1) );
        //TEMP NOTE -> note the default for placing elements on Y-Axis is going to be centred 
        //depending on each elements height. We don't need to do that here.
        //var startY = Math.floor( ( platterH - (maxYCoord + minYCoord) - schema.buttons.height ) / 2 );
    }
    else{
        //console.log('Error: (' + p1i.name + ') the total width of all elements is greater than the canvas: allWidths: ' + allWidths + ' Canvas Width: ' + platterW);
    }
    return p1i;
}

function organiseButtonLayouts(p1i){
    p1i.buttonSchema = p1i.totalButtons + '-' + p1i.buttonDesign;
    var maxXCoord = 0;
    var maxYCoord = 0;

    //we need to loop through and gather coord info
    for(n = 0; n < p1i.totalButtons; n++){
        var btnX = parseInt(schema.buttons[ p1i.buttonSchema ][n]['x']);
        var btnY = parseInt(schema.buttons[ p1i.buttonSchema ][n]['y']);
        var labelPos = parseInt(schema.buttons[ p1i.buttonSchema ][n]['labelPos']);
        console.log(p1i.elements[ p1i.buttonIndexes[n] ].relX);
        p1i.elements[ p1i.buttonIndexes[n] ].btnX = btnX + parseInt(p1i.elements[ p1i.buttonIndexes[n] ].relX);
        p1i.elements[ p1i.buttonIndexes[n] ].btnY = btnY + parseInt(p1i.elements[ p1i.buttonIndexes[n] ].relY);
        p1i.elements[ p1i.buttonIndexes[n] ].labelPos = labelPos;
        //find the surface area of all buttons (we don't include our relative x,y adjustments here)
        if(btnX > maxXCoord) maxXCoord = btnX;
        if(btnY > maxYCoord) maxYCoord = btnY;
    }

    //defines our working area for all buttons
    p1i.buttonSet = {
        "width": (maxXCoord + schema.buttons.width),
        "height": (maxYCoord + schema.buttons.height)
    };
    return p1i;
}

function placeElements(p1i){
    //we need to make a fresh instance for each new image
    var image = new Jimp( platterW, platterH );
    var marginCount = 1;
    var margin = 0;
    var buttonCount = 0;
    console.log('distroMargin: ' + p1i.distroMarginWidth);
    for(var n = 0; n < p1i.totalElements; n++){
        if(p1i.elements[n].device == 'btn'){
            buttonCount++;
            var asset = p1i.elements[n].device + '_' + p1i.elements[n].colour;
            //var xPos = ( (p1i.distroMarginWidth - (p1i.elements[n].width /2 ) ) + p1i.elements[n].btnX ) + margin;
            var xPos = (p1i.distroMarginWidth * marginCount) + p1i.elements[n].btnX + margin;
            
            var yPos = Math.floor( (platterH - p1i.buttonSet.height) / 2 );
            yPos += p1i.elements[n].btnY;

            if(buttonCount == p1i.totalButtons){
                margin += p1i.buttonSet.width;
                marginCount++;
            }
        }
        else if(p1i.elements[n].device == 'joy'){ 
            var asset = p1i.elements[n].device + '_' + p1i.elements[n].design + '_' + p1i.elements[n].colour;
            var xPos = p1i.distroMarginWidth + margin;
            marginCount++;
            margin += p1i.elements[n].width;
            var yPos = Math.floor( (platterH - p1i.elements[n].height)  / 2 ) - 40;
        }
        else continue; // we temporarily don't handle any other joy for now
        
        addPart({
            'image':    image,
            'saveAs':   p1i.name +'.png',
            'asset':    asset,
            'xPos':     xPos,
            'yPos':     yPos,
            'label':    p1i.elements[n].text,
            'labelPos':    p1i.elements[n].labelPos 
        });

    }
    return image;
}

function addBetaTag(imgObj, p1i){
    addPart({
            'image':    imgObj,
            'saveAs':   p1i.name +'.png',
            'asset':    '_beta',
            'xPos':     920,
            'yPos':     436
        });
}

//places parts on our image
var addPart = function(parts){
    console.log(parts);
    
    /*Jimp.read('images\\assets\\' + parts.asset + '.png', function( err, el) {
        //if (err) throw err;
        parts.image.composite( el, parts.xPos, parts.yPos );
        parts.image.write("set\\" + parts.saveAs) // save 
        console.log('write called within jimp');
    });*/

    Jimp.read('images\\assets\\' + parts.asset + '.png').then(function (el) {
        parts.image.composite( el, parts.xPos, parts.yPos );
        
        if(parts.label != null){
            console.log('Label: ' + parts.label);
            var labelX = parseInt(parts.xPos);

            if(parts.labelPos == 0) var labelY = parseInt(parts.yPos - 25); //label top
            else var labelY = parseInt(parts.yPos + 96); //label bottom

            var textWidth = measureMyText(jimpFont, parts.label);
            var textDiff  = 94 - textWidth;
            var centredTxt =  Math.floor( textDiff / 2 );
            labelX += centredTxt - 2;
            console.log('labelX: ' + labelX);
            console.log('textWidth: ' + textWidth);
            console.log('centredTxt: ' + centredTxt);
            
            parts.image.print( jimpFont, labelX, labelY, parts.label );
        }

        parts.image.write("set\\" + parts.saveAs); // save
        updateConsole("    Writing image: " + parts.saveAs + "                               ");
    }).catch(function (err) {
        console.error(err);
    });


};

function measureMyText(font, text){
    var x = 0;
    for (var i = 0; i < text.length; i++) {
      if (font.chars[text[i]]) {
          x += font.chars[text[i]].xoffset
            + (font.kernings[text[i]] && font.kernings[text[i]][text[i+1]] ? font.kernings[text[i]][text[i+1]] : 0)
            + (font.chars[text[i]].xadvance || 0);
      }
    }
  return x;
}

function updateConsole(text){
    //process.stdout.clearLine();  // clear current text
    process.stdout.cursorTo(0);  // move cursor to beginning of line
    process.stdout.write(text);  // write text
}
