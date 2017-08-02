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

var platterW = 1000;
var platterH = 500;
//var image = new Jimp( platterW, platterH );

var imageTracker = "";

var dbName = "roms.db"; //SQLite db file (in db folder)
var db = new sqlite3.Database('db\\' + dbName);

//synchronous read of our schema
var schema = JSON.parse( fs.readFileSync("data\\schema.json") );

//Lycos, fetch me my database, good boy!
var prepElements = function(callback){
    db.each("SELECT * FROM `p1i` WHERE `element_1` != ''", function(err, row) {
        if(err) console.log(err);
        callback(err, row);        
    });
};

//places parts on our image
var addPart = function(parts){
    //console.log(parts);
    
    /*Jimp.read('images\\assets\\' + parts.asset + '.png', function( err, el) {
        if (err) throw err;
        parts.image.composite( el, parts.xPos, parts.yPos );
        parts.image.write("set\\" + parts.saveAs) // save 
        console.log('write called within jimp');
    });*/

    Jimp.read('images\\assets\\' + parts.asset + '.png').then(function (el) {
        parts.image.composite( el, parts.xPos, parts.yPos );
        parts.image.write("set\\" + parts.saveAs) // save 
        updateConsole("    Writing image: " + parts.saveAs + "                               ");
    }).catch(function (err) {
        console.error(err);
    });
};


//callback from our database row row
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

function addBetaTag(imgObj, p1i){
    addPart({
            'image':    imgObj,
            'saveAs':   p1i.name +'.png',
            'asset':    '_beta',
            'xPos':     920,
            'yPos':     436
        });
}

function placeElements(p1i){
    //we need to make a fresh instance for each new image
    var image = new Jimp( platterW, platterH );
    var margin = 0;
    for(var n = 0; n < p1i.totalElements; n++){
        
        if(p1i.elements[n].device == 'btn'){
            var asset = p1i.elements[n].device + '_' + p1i.elements[n].colour;
            var xPos = ( (p1i.distroMarginWidth - (p1i.elements[n].width /2 ) ) + p1i.elements[n].btnX ) + margin;
            var yPos = Math.floor( (platterH - p1i.buttonSet.height) / 2 );
            yPos += p1i.elements[n].btnY;
        }
        else if(p1i.elements[n].device == 'joy'){ 
            var asset = p1i.elements[n].device + '_' + p1i.elements[n].design + '_' + p1i.elements[n].colour;
            var xPos = (p1i.distroMarginWidth - (p1i.elements[n].width /2 ) ) + margin;
            margin += p1i.distroMarginWidth;
            var yPos = Math.floor( (platterH - p1i.elements[n].height)  / 2 );
        }
        else continue; // we temporarily don't handle any other joy for now
        
        addPart({
            'image':    image,
            'saveAs':   p1i.name +'.png',
            'asset':    asset,
            'xPos':     xPos,
            'yPos':     yPos    
        });

    }
    return image;
}

function organisePlacements(p1i){
    //we now need to add all of the heights and widths up and see
    //what space we are left on the canvas. This is then distributed
    //across the total number of elements (button-sets) so we have
    //a nice alignment of elements.
    //
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
    p1i.groupCount = groupCount;
    //we should now have all part widths
    //(hopefully this is not greater than the width of canvas)
    if(allWidths < platterW){
        p1i.distroMarginWidth = Math.floor( ( platterW - allWidths ) / groupCount );
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
        
        p1i.elements[ p1i.buttonIndexes[n] ].btnX = btnX;
        p1i.elements[ p1i.buttonIndexes[n] ].btnY = btnY;

        //find the surface area of all buttons
        if(btnX > maxXCoord) maxXCoord = btnX;
        if(btnY > maxYCoord) maxYCoord = btnY;
    }

    //defines our working area for all buttons
    p1i.buttonSet = {
        "width": (maxXCoord + schema.buttons.width),
        "height": (maxYCoord + schema.buttons.height)
    };

    
        //find centre - this needs to be done as a whole somehow?
        //var startX = Math.floor( ( platterW - (maxXCoord + minXCoord) - schema.buttons.width ) / 2 );
        //var startY = Math.floor( ( platterH - (maxYCoord + minYCoord) - schema.buttons.height ) / 2 );
        /*
        for(var bc = 0; bc < buttonColours.length; bc++){
            var buttonAsset = 'images\\assets\\button_' + buttonColours[bc];
            var btnX = schema.buttons[ totalButtons + '-' + layoutID ][bc]['x'];
            var btnY = schema.buttons[ totalButtons + '-' + layoutID ][bc]['y'];
            addPart({
                'image': image,
                'saveAs': row.name +'.png',
                'asset': 'button_' + buttonColours[bc],
                'xPos': btnX + startX,
                'yPos': btnY + startY    
            });
        }
        */
    return p1i;
}

function explodeElement(el, csvGrp){
    var elementArray = csvGrp.split(',');
    //setup a template for our element
    var tempElement = {};
    tempElement.device = null;
    tempElement.design = null;
    tempElement.canvasX = null;
    tempElement.canvasY = null;
    tempElement.colour = null;
    tempElement.width = null;
    tempElement.height = null;

    if(elementArray.length == 6){
        tempElement = {
            'device': elementArray[0],
            'design': elementArray[1],
            'canvasX': elementArray[2],
            'canvasY': elementArray[3],
            'colour': elementArray[4]
        };
        if(elementArray[0] == 'btn'){
            el.totalButtons += 1;
            el.buttonIndexes.push(el.totalElements);
            tempElement.width = schema.buttons.width;
            tempElement.height = schema.buttons.height;
            //we then need to use our first element to gather design info
            if(el.totalButtons == 1){
                //we need to check if it's a number... or replace this with 1 (default design in schema)
                if(elementArray[1] === parseInt(elementArray[1], 10)) el.buttonDesign = elementArray[1];
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

function updateConsole(text){
    //process.stdout.clearLine();  // clear current text
    process.stdout.cursorTo(0);  // move cursor to beginning of line
    process.stdout.write(text);  // write text
}
