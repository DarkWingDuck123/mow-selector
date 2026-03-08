// I don't know if this file is for tremendous ships, but I think it is (i.e. no
// crew).
//
// A javascript that builds a tremendous man o war card. Tremendous vessels
// These type are characterized lacking a to-hit locations, and only having
// to-hit number. Any hit has potential to cause wounds.

// Some useful css trickery:
// Centering a div vertically. In the parent's div's css: "display:-webkit-flex;display:flex;align-items:center;justify-contents:center".
// The child div needs to set it's width to 100%.

// Things to Do:
// + I've not been using dedicated css (because I think it's easier to change this stuff on the fly for now), but at some
//   point I need to identify the common building blocks and do so.

function box(x, y, size) {
  return ""
    + "<div "
      + "style='"
        + "border:1px solid black;"
        + "position:absolute;"
        + "width:" + size + "px;"
        + "height:" + size + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
        + "background-color:white"
      + "'>"
      + "<br>"
    + "</div>";
}

function boxline(x, y, size, num, rows, margin) {
  var i = 0;
  var boxes = "";
  console.log("Drawing boxline (rows: " + rows + "):")
  while (i < num) {
    var j = Math.floor(i / rows);
    var k = (i % rows);
    console.log("i: " + i + " j: " + j + " k: " + k);
    boxes += box(x + size * j + margin * j, y - size * k - margin * k, size);
    i++;
  }
  return boxes;
}

// Row One is the beast type, title, honors, pt value and movement box
// It has a fixed height & width.
function rowOne(w, h, x, y, meta, obj, inst) {
  var cost = obj.cost.value;
  var honors = obj.honors.value;

  return "<div id='rowOne' "
      + "style='"
        + "position:absolute;"
        + "width:295px;"
        + "height:20px;"
        + "top:0px;"
        + "left:5px'>"
    + "<div id='cost' "
        + "style='"
          + "position:absolute;"
          + "text-align:left;"
          + "font-size:18px;"
          + "color:" + meta.fgColor + ";"
          + scaleStyle(obj.cost) + "'>"
      + cost 
    + "</div>" 
    + "<div id='honors' "
        + "style='"
          + "position:absolute;"
          + "text-align:right;"
          + "font-size:18px;"
          + "color:" + meta.fgColor + ";"
          + scaleStyle(obj.honors) + "'>"
      + honors 
    + "</div>"
  + "</div>" 
  + "<div id='rowOneContents' " 
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;'>"
    + rowOneColOne(295, h, 0, 0, meta, obj)
    + rowOneColTwo(w-300, h, 300, 0, meta, obj)
  + "</div>";
}

// Scaling "centers" the scaling (so the center of the div doesn't move).
// This provides the style changes needed so the div doesn't change size
// or move position while the content of the div is scaled. Note: we don't
// really care about movement if the text is centered, so this function
// doesn't need to be used everywhere we use scale.
function scaleStyle(scaleObj) {
  var width = 100 / scaleObj.scale;
  var left = -(width - 100) / 2;

  return 'position:absolute;width:' + width + '%;left:' + left + '%;transform:scale(' + scaleObj.scale + ',1);-webkit-transform:scale(' + scaleObj.scale + ',1);';
}

// Column one has a fixed height/width and fixed position
function rowOneColOne(w, h, x, y, meta, obj) {
  return "<div style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + (h-25) + "px;"
        + "left:0px;"
        + "bottom:0px;'>"
      + textRow(w, 25, 0, h-45, obj.type)
      + beastname(w, 40, 0, h-50-40, obj.name, meta)
    + "</div>";
}

// CS rules for scaling horizontally and vertically
// transform:scale(4,1); 
// -webkit-transform:scale(4,1);

function beastname(w, h, x, y, name, meta) {
  return "<div "
    + "style='"
      + "position:absolute;"
      + "width:" + w + "px;"
      + "height:" + h + "px;"
      + "left:" + x + "px;"
      + "bottom:" + y + "px;"
      + "font-size:45px;"
      + "text-align:center;"
      + "color:" + meta.fgColor + ";"
      + "font-family: \"IM Fell English\", serif;"
      + "transform:scale(" + name.scale + ",1);"
      + "-webkit-transform:scale(" + name.scale + ",1);'>"
    + name.value
  + "</div>";
}

function textRow(w, h, x, y, text) {
  return "<div "
      + "style='"
        + "position:absolute;"
        + "border:1px solid black;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
        + "font-size:18px;"
        + "vertical-align:middle;"
        + "text-align:center;"
        + "color:white;"
        + "background-color:black;"
        + "font-family: \"IM Fell English\", serif;'>"
      + "<div style='" + scaleStyle(text) + "'>"
        + text.value 
      + "</div>"
    + "</div>";
}

// Column one has a fixed height/width and fixed position
function rowOneColTwo(w, h, x, y, meta, obj) {
  var contents = obj.move.value;
  var contentsScale = obj.move.scale;

  return "<div "
      + "style='"
        + "position:absolute;"
        + "border:1px solid black;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;'>" 
      + textRow(w, 25, 0, h-25, obj.moveTitle)
      + "<div "
          + "style='"
            + "display:-webkit-flex;"
            + "display:flex;"
            + "align-items:center;"
            + "justify-contents:center;"
            + "position:absolute;"
            + "width:" + w + "px;"
            + "height:" + (h-25) + "px;"
            + "left:0px;"
            + "bottom:0px;"
            + "background-color:" + meta.parchmentColor + ";"
            + "text-align:center;'>"
        + "<div "
            + "style='"
              + "font-family:\"IM Fell English\", serif;"
              + "width:100%;'>"
          + contents 
        + "</div>"
      + "</div>"
    + "</div>";
}

// Row two is optional, it's for general short notes (like movement
// specific rules) or maybe labels.
// When it's not set, this return an empty string "".
function rowTwo(w, h, x, y, meta, obj) {
  var internal = "";
  obj.upperNotes.forEach((note) => {
    internal = internal + textRow(w, h, x, y, note);
    y = y - 30;
  })
  return internal;
}

function rowTwoHeight(obj) {
  return obj.upperNotes.length * 30;
}

// Row three is the damage row. It contains the to hit/damage boxes in column two
// and instances & wounds in column one. This does not support anything like highLow
// or aftFore
function rowThreeRight(w, h, x, y, obj, meta) {
  return  ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:"+ w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
        + "background-color:green"
      + "'>"
      + damageBoxes(w, h, obj.dmgBoxes, meta)
    + "</div>";
}

function rowThree(w, h, x, y, obj, meta) {
  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>";
  var i = 0;
  console.log("i: " + i);
  var bottom = h - 55;
  s = s 
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:55px;"
        + "left:" + x + "px;"
        + "bottom:" + bottom + "px;"
      + "'>"
      + damageTitle("", obj.criticalTitle, obj.criticalSave, meta)
      + boxline(0, 0, 30, obj.criticalBoxes, 1, 0)
    + "</div>";
  s = s 
    + "</div>";

  return s; 
}

function damageTitle(zone, text, save, meta) {
  var saveColor = meta.accentColor; 
  return  ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "border:1px solid black;"
        + "width:100%;"
        + "height:20px;"
        + "left:0px;"
        + "top:0px;"
        + "background-color:black;"
      + "'>"
      + "<div "
        + "style='"
          + "height:20px;"
          + "top:0px;"
          + "font-size:18px;"
          + "vertical-align:middle;"
          + "text-align:center;"
          + "color:white;"
          + "background-color:black;"
          + "font-family: \"IM Fell English\", serif;"
          + scaleStyle(text)
        + "'>"
        + text.value
      + "</div>"
      //+ "<div "
      //  + "style='"
      //    + "position:absolute;"
      //    + "width:18px;"
      //    + "height:18px;"
      //    + "right:1px;"
      //    + "top:1px;"
      //    + "font-size:16px;"
      //    + "vertical-align:middle;"
      //    + "text-align:center;"
      //    + "color:white;"
      //    + "background-color:" + meta.accentColor + ";"
      //    + "border: 2px solid black;"
      //  + "'>"
      //  + save
      //+ "</div>"
    + "</div>";
}

// Draws the internals of a damage box, this is the "blue" part of the box (not the title area), where the damage boxes
// are drawn vertically and each box has the option of have text to the right of it.
function damageVerticalBoxes(w, h, dbox) {
  console.log("DBOX");
  console.log(dbox);
  var dmgRow = dbox.boxes;
  var dmgText = dbox.notes;

  var boxH = (h * dbox.height) / 100;
  var dmgH = boxH - 20;
  var boxW = (w * dbox.width) / 100;
  var internal = "" + "<div style='position:absolute; width:" + boxW + "px; height:"+ dmgH + "px; top:20px; left:0px;'><div style='position:absolute;text-align:right;color:grey;font-size:60px;width:"+boxW+"px;'>"+dbox.zone+"</div>";
  var next = 5; 
  dmgRow.forEach((row) => {
    internal = internal + "<div style='position:absolute; width:100%; height:20px; top:" + next + "px; left:0px;'>";
    internal = internal + box(5, 0, 20);
    internal = internal + "<div style='position:absolute;width:" + (boxW - 30) + "px; height:100%; left:30px;'>";
    internal = internal + "<div style='" + scaleStyle(row) + "font-family: \"IM Fell English\", serif;'>" + row.value + "</div>";
    internal = internal + "</div>";
    internal = internal + "</div>";
    next = next + 25;
  });
  if (typeof dmgText !== 'undefined') {
    internal = internal + "<div style='" + scaleStyle(dmgText) + "font-family: \"IM Fell English\", serif;display:flex; height:"+ (dmgH - next) + "px; top:" + next + "px;justify-content:center;align-items:flex-end'>" + dmgText.value + "</div>";
  }
  internal = internal + "</div>" 
  return internal;
}

// Draws the internals of a damage box, where the damage boxes are draw in a grid at the top (mostly horizontally). All the text is
// below these boxes.
function damageBox(w, h, dbox) {
  var dmgText = dbox.notes;

  var boxH = (h * dbox.height) / 100;
  var dmgH = boxH - 20;
  var boxW = (w * dbox.width) / 100;

  // The big zone indicator
  var internal = "" 
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + boxW + "px;"
        + "height:" + dmgH + "px;"
        + "top:20px;"
        + "left:0px;"
      + "'>"
      + "<div "
        + "style='"
          + "position:absolute;"
          + "text-align:right;"
          + "color:grey;"
          + "font-size:60px;"
          + "width:" + boxW + "px;"
        + "'>"
        + dbox.zone 
      + "</div>";

  // The text
  internal = internal 
    + "<div "
      + "style='"
        + "font-family: \"IM Fell English\", serif;"
        + "transform:scale(" + dmgText.scale + ",1);"
        + "-webkit-transform:scale(" + dmgText.scale + ",1);"
        + "position:absolute;"
        + "width:100%;"
        + "top:0px;"
        + "left:0px;"
        + "text-align:center;"
      + "'>"
      + dmgText.value
    + "</div>";
  internal = internal
    + "</div>" 
  return internal;
}

function damageBoxes(w, h, boxes, meta) {
  var s = ""

  boxes.forEach((dbox) => {
    console.log(dbox);
    var internal = damageTitle(dbox.zone, dbox.name, dbox.save, meta);
    // damageTitle is 20 px high
    internal = internal + damageBox(w, h, dbox);

    s += ""
      + "<div "
        + "style='"
          + "position:absolute;"
          + "border:solid 1px black;"
          + "width:" + ((w * dbox.width) / 100) + "px;"
          + "height:" + ((h * dbox.height) / 100) + "px;"
          + "left:" + ((w * dbox.left) / 100) + "px;"
          + "bottom:" + ((h * dbox.bottom) / 100) + "px;"
          + "background-color:" + meta.waterColor + ";"
        + "'>"
        + internal
      + "</div>";
  });

  return s;
}

// Row four is for Notes (Special Attacks, Close Combat, other Special Rules).
// The data structure it works over looks like:
//  "lowerNotes":[
//    {"height":50,
//     "title":{"value":"SPECIAL ATTACK", "scale":1.0},
//     "note":{"value":"None","scale":1.0}},
//    {"height":50,
//     "title":{"value":"CLOSE COMBAT", "scale":1.0},
//     "note":{"value":"None","scale":1.0}}]

function rowFour(w, h, x, y, meta, obj) {
  var s = ""
  var marginSpace = (obj.lowerNotes.length - 1) * 5;
  var realSpace = h - marginSpace;
  var top = y + h;
  obj.lowerNotes.forEach((note) => {
    var title = note.title;
    var contents = note.note;
    // calculate size of the box and then the new top (which will be the
    // bottom of the current note).
    var boxHeight = (realSpace * note.height) / 100;
    top = top - boxHeight;

    s = s + "<div "
        + "style='"
          + "position:absolute;"
          + "border:1px solid black;"
          + "width:" + w + "px;"
          + "height:" + boxHeight + "px;"
          + "left:" + x + "px;"
          + "bottom:" + top + "px;'>" 
        + textRow(w, 25, 0, boxHeight-25, title)
        + "<div "
            + "style='"
              + "display:-webkit-flex;"
              + "display:flex;"
              + "align-items:center;"
              + "justify-contents:center;"
              + "position:absolute;"
              + "width:" + w + "px;"
              + "height:" + (boxHeight-25) + "px;"
              + "left:0px;"
              + "bottom:0px;"
              + "background-color:" + meta.parchmentColor + ";"
              + "text-align:center;'>"
          + "<div "
              + "style='"
                 + "font-family:\"IM Fell English\", serif;"
                + "width:100%;'>"
            + contents.value
          + "</div>"
        + "</div>"
      + "</div>";

      // Take out the margin
      top = top - 5;
    })
  return s;
}

function rowFive(w, h, x, y, meta, obj, inst) {
  var name = {"name":"Melvin", "scale":"1.0"};
  if (typeof inst.name !== "undefined") {
    name = inst.name;
  }

  var s = 
    "<div "
      + "style='"
        + "border:1px solid black;"
        + "position:absolute;"
        + "height:" + h + "px;"
        + "width:" + w + "px;"
        + "background-color:" + meta.parchmentColor + ";"
        + "bottom:" + y + "px;"
        + "left:" + x + "px;"
        + "text-align:center;"
        + "font-size:15px;"
        + "font-family: \"Shadows Into Light\", cursive;"
      + "'>"
      + "<div "
        + "style:'" + scaleStyle(name) + "'"
      + ">" 
        + name 
      + "</div>"
    + "</div>";
  return s;
}

// Draws a broadside out either side of the ship
function drawBroadside(w, h, s, num, meta) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var t = cy - s + 10; // top (slightly less than the size of the ship)
  var b = cy + s - 10; // bottom
  var l = 15;
  var r = w - 15;
  var internal = '<rect x=' + l + ' y=' + t + ' width=' + (r - l) + ' height=' + (b - t) + ' style="fill:white;stroke:black;stroke-width:2"/>'
  internal = internal + '<text x=' + ((cx + l - (s/3)) / 2) + ' y=' + cy + ' fill="' + meta.accentColor + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  internal = internal + '<text x=' + ((cx + r + (s/3)) / 2) + ' y=' + cy + ' fill="' + meta.accentColor + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  return internal;
}

function drawForeCannon(w, h, s, num, meta) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var t = 20;
  var b = cy;
  var l = cx - (s / 3);
  var r = cx + (s / 3);

  var internal = '<rect x=' + l + ' y=' + t + ' width=' + (r - l) + ' height=' + (b - t) + ' style="fill:white;stroke:black;stroke-width:2"/>'
  internal = internal + '<text x=' + cx + ' y=' + ((t + b - s) / 2) + ' fill="' + meta.accentColor + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  return internal;
}

function drawAftCannon(w, h, s, num, meta) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var t = cy;
  var b = h-20;
  var l = cx - (s / 3);
  var r = cx + (s / 3);

  var internal = '<rect x=' + l + ' y=' + t + ' width=' + (r - l) + ' height=' + (b - t) + ' style="fill:white;stroke:black;stroke-width:2"/>'
  internal = internal + '<text x=' + cx + ' y=' + ((t + b + s) / 2) + ' fill="' + meta.accentColor + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  return internal;
}

function describeArc(x, y, radius, spread, startAngle, endAngle) {
    var innerStart = polarToCartesian(x, y, radius, endAngle);
  	var innerEnd = polarToCartesian(x, y, radius, startAngle);
    var outerStart = polarToCartesian(x, y, radius + spread, endAngle);
    var outerEnd = polarToCartesian(x, y, radius + spread, startAngle);

    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", outerStart.x, outerStart.y,
        "A", radius + spread, radius + spread, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
        "L", innerEnd.x, innerEnd.y, 
        "A", radius, radius, 0, largeArcFlag, 1, innerStart.x, innerStart.y, 
        "L", outerStart.x, outerStart.y, "Z"
    ].join(" ");

    return d;
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

//var path = describeArc(150, 150, 50, 0, 0, 50)
function drawForeSpread(w, h, s, num, meta) {
  var cx = w / 2; // center x
  var cy = (h / 2) - (s / 2); // center y
  var internal = '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx, cy, 0, 70, -45, 45) + '"/>';
  internal = internal + '<text x=' + cx + ' y=' + ((2 * cy - 70) / 2) + ' fill="' + meta.accentColor + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  return internal;
}

function drawUnderTurrets(w, h, s, meta, obj) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var internal = "";

  // middle center (radius should be slightly more than s, this one needs to be a circle)
  if (typeof obj.fullTurret !== 'undefined') {
    internal = internal + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (5 * s / 4) + '" fill="white" stroke="black" stroke-width="2" /></circle>';
  }

  // fore center
  if (typeof obj.foreTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx, cy - s/2, 0, 60, -90, 90) + '"/>';
    internal = internal + '<text x=' + cx + ' y=' + (cy - s - 15) + ' fill="' + meta.accentColor + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.foreTurret + '</text>';
  }

  // aft center
  if (typeof obj.aftTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx, cy + 3*s/4, 0, 60, 90, 270) + '"/>';
    internal = internal + '<text x=' + cx + ' y=' + (cy + s + 25) + ' fill="' + meta.accentColor + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.aftTurret + '</text>';
  }

  // middle port
  if (typeof obj.portTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx - s/3 + 5, cy + 5, 0, 55, 180, 360) + '"/>';
    internal = internal + '<text x=' + (cx - s/3 - 25) + ' y=' + (cy + 5) + ' fill="'+ meta.accentColor +'" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.portTurret + '</text>';
  }

  // middle starboard
  if (typeof obj.starboardTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx + s/3 - 5, cy + 5, 0, 55, 0, 180) + '"/>';
    internal = internal + '<text x=' + (cx + s/3 + 25) + ' y=' + (cy + 5) + ' fill="' + meta.accentColor + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.starboardTurret  + '</text>';
  }

  // fore port
  if (typeof obj.forePortTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx - s / 3, (cy - ((2*s)/3)), 0, 40, 270, 360) + '"/>';
    internal = internal + '<text x=' + (cx - s/3 - 15) + ' y=' + (cy - ((2*s)/3) - 15) + ' fill="' + meta.accentColor + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.forePortTurret + '</text>';
  }

  // aft port
  if (typeof obj.aftPortTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx - s/3, (cy + s), 0, 40, 180, 270) + '"/>';
    internal = internal + '<text x=' + (cx - s/3 - 15) + ' y=' + (cy + s + 15) + ' fill="' + meta.accentColor + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.aftPortTurret + '</text>';
  }

  // fore starboard
  if (typeof obj.foreStarboardTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx + s / 3, (cy - ((2*s)/3)), 0, 40, 0, 90) + '"/>';
    internal = internal + '<text x=' + (cx + s/3 + 15) + ' y=' + (cy - ((2*s)/3) - 15) + ' fill="' + meta.accentColor + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.foreStarboardTurret + '</text>';
  }

  // aft starboard
  if (typeof obj.aftStarboardTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx + s/3, (cy + s), 0, 40, 90, 180) + '"/>';
    internal = internal + '<text x=' + (cx + s/3 + 15) + ' y=' + (cy + s + 15) + ' fill="' + meta.accentColor + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.aftStarboardTurret + '</text>';
  }

  // Ammo Boxes
  if (typeof obj.ammo !== 'undefined') {
    internal = internal + "";
  }
  return internal;
}

function exists(obj) {
  return typeof obj !== 'undefined';
}

function drawOverTurrets(w, h, s, meta, obj) {
  var cx = w / 2;
  var cy = h / 2;
  var internal = "";
  // middle center
  if (exists(obj.fullTurret)) {
    internal = internal + '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
    // middle center turret is the only weapons that gets to draw it's number on the ship itself
    internal = internal + '<text x=' + cx + ' y=' + (cy + 16) + ' fill="' + meta.accentColor + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.fullTurret + '</text>';
  }

  // fore center
  if (exists(obj.foreTurret)) {
    internal = internal + '<circle cx="' + cx + '" cy="' + (cy - s / 2 ) + '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
  }

  // aft center
  if (exists(obj.aftTurret)) {
    internal = internal + '<circle cx="' + cx + '" cy="' + (cy + 3 * s / 4 ) + '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
  }

  // middle port
  if (exists(obj.portTurret)) {
    internal = internal + '<circle cx="' + (cx - s/3 + 5) + '" cy="' + (cy + 5) + '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
  }

  // middle starboard
  if (exists(obj.starboardTurret)) {
    internal = internal + '<circle cx="' + (cx + s/3 - 5) + '" cy="' + (cy + 5) + '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
  }

  // fore port
  if (exists(obj.forePortTurret)) {
    internal = internal + '<circle cx="' + (cx - s / 3) + '" cy="' + (cy - ((2 * s) / 3))+ '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
  }

  // aft port
  if (exists(obj.aftPortTurret)) {
    internal = internal + '<circle cx="' + (cx - s / 3) + '" cy="' + (cy + s) + '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
  }

  // fore starboard
  if (exists(obj.foreStarboardTurret)) {
    internal = internal + '<circle cx="' + (cx + s / 3) + '" cy="' + (cy - ((2 * s) / 3))+ '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
  }

  // aft starboard
  if (exists(obj.aftStarboardTurret)) {
    internal = internal + '<circle cx="' + (cx + s / 3) + '" cy="' + (cy + s) + '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
  }
  return internal;
}

// Draws a ship in the center of svg object
function drawShip(w, h, s, meta, obj) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var t = cy - s; // top
  var b = cy + s; // bottom
  var l = cx - (s/3); // left
  var r = cx + (s/3); // right

  return 
    '<path '
      + 'style="'
        + 'fill:lightgray;'
        + 'stroke:black;'
        + 'stroke-width:2'
      + '"'
      + 'd="'
        + 'M '
        + l + ' '
        + b + ' '
        + (l-10) + ' '
        + cy + ' '
        + l + ' '
        + (t+10) + ' '
        + cx + ' '
        + t + ' '
        + r + ' '
        + (t+10) + ' '
        + (r+10) + ' '
        + cy + ' '
        + r + ' '
        + b 
        + 'Z'
      + '">'
      + '</path>';
}

// This is the svg part of the graphing.
function rowFourColTwo(gw, gh, w, h, x, y, meta, obj)
{
  var broadside = "";
  var aftBattery = "";
  var foreSpread = "";
  var foreBattery = "";
  
  if (typeof obj.broadside !== 'undefined') {
    broadside = drawBroadside(w, h, 40, obj.broadside, meta);
  }
  if (typeof obj.aftBattery !== 'undefined') {
    aftBattery = drawAftCannon(w, h, 40, obj.aftBattery, meta);
  }
  if (typeof obj.foreSpread !== 'undefined') {
    foreSpread = drawForeSpread(w, h, 40, obj.foreSpread, meta);
  }
  if (typeof obj.foreBattery !== 'undefined') {
    foreBattery = drawForeCannon(w, h, 40, obj.foreBattery, meta);
  }

  var template = "<div style='position:absolute;border:1px solid black;width:{0}px; height:{1}px; left:{2}px; bottom:{3}px; background-color:{5};'>{4}</div>";

  var internal = "<svg style='position:absolute; left:0px; top:0px; height:"+h+"px; width:"+w+"px;'>"
  + broadside
  + aftBattery
  + foreSpread
  + foreBattery
  + drawUnderTurrets(w, h, 40, meta, obj)
  + drawShip(w, h, 40, meta, obj)
  + drawOverTurrets(w, h, 40, meta, obj)
  + "</svg>";
  if (typeof obj.ammo !== 'undefined') {
    var numRows = 1;
    if (typeof obj.ammoNumRows !== 'undefined') {
      numRows = obj.ammoNumRows;
    } 
    var ammoWidth = Math.ceil(obj.ammo / numRows) * 20 + (Math.ceil(obj.ammo / numRows) - 1) * 5
    internal = internal + boxline((w / 2) - (ammoWidth / 2), 5 + (numRows - 1) * 25, 20, obj.ammo, numRows, 5);
  }
  return ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "border:1px solid black;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
        + "background-color:" + meta.waterColor + ";"
      + "'>"
      + internal
    + "</div>";
}

// Create a basic ship card.
// parameters:
// meta: Meta information about the card. This is info that's true of all of the cards for that ship's faction. In example, background/foreground colors, whether the ship card should be rotated x degrees, etc.
// obj: Object information about the card. This is true of all of the cards of this type. In example, all of the info on how to draw a wargalley.
// inst: Instance informat about the card. This is information true about a specific card. In example, the ship name of the card.
function tremendousCard(meta, obj, inst)
{
  console.log("META:");
  console.log(meta);
  console.log("OBJ:");
  console.log(obj);
  console.log("INST:");
  console.log(inst);

  var rotate = 0;
  if (exists(meta.rotate)) {
    rotate = meta.rotate;
  }
  var zoom = 1.0;
  if (exists(inst.scale)) {
    zoom = inst.scale;
  }

  return "<div "
      + "style='"
        + "transform: rotate(" + rotate + "deg);"
        + "zoom:" + zoom + ";"
        + "position: relative;"
        + "border: 1px solid black;"
        + "width:500px;"
        + "height:700px;"
        + "background-color:" + meta.bgColor + ";'>"
      + rowOne(490, 150, 5, 545, meta, obj, inst)
      + rowTwo(490, 25, 5, 515, meta, obj)
      + rowThree(490, 60, 5, 500 - rowTwoHeight(obj), obj, meta)
      //+ rowThreeLeft(195, rowThreeHeight(obj), 5, 540 - rowTwoHeight(obj) - rowThreeHeight(obj), obj, meta)
      //+ rowThreeRight(285, rowThreeHeight(obj), 210, 540 - rowTwoHeight(obj) - rowThreeHeight(obj), obj, meta)
      + rowFour(490, 510 - 60 - rowTwoHeight(obj), 5, 30, meta, obj)
      + rowFive(490, 20, 5, 5, meta, obj, inst)
    + "</div>";
}
