import DOMPurify from 'dompurify';
import { box, boxline, scaleStyle, exists, polarToCartesian, describeArc, drawBroadside, drawForeCannon, drawAftCannon, drawForeSpread, drawUnderTurrets, drawOverTurrets, drawShip, beastname, textRow, rowFive } from './cardUtility.js';

// A javascript that builds a man o war flyer and sea beast cards.
// These type of ships are characterized by their ability to turn on a dime,
// having no wounds in their to-hit locations.

// I'm going to move away from using this code for anything. I'm finding it
// easier to read code that just builds the strings directly.
// This code was "stolen" from stackoverflow.
/*
String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};
*/

// Some useful css trickery:
// Centering a div vertically. In the parent's div's css: "display:-webkit-flex;display:flex;align-items:center;justify-contents:center".
// The child div needs to set it's width to 100%.

// Things to Do:
// + I've not been using dedicated css (because I think it's easier to change this stuff on the fly for now), but at some
//   point I need to identify the common building blocks and do so.
// + Currently it's not driven from json, need to define the json needed and drive the card creation off that.

// Row One is the beast type, title, honors, pt value and movement box
// It has a fixed height & width.
function rowOne(w, h, x, y, meta, obj, inst) {
  var cost = DOMPurify.sanitize(obj.cost.value);
  var honors = DOMPurify.sanitize(obj.honors.value);

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

// Column one has a fixed height/width and fixed position
function rowOneColTwo(w, h, x, y, meta, obj) {
  var contents = DOMPurify.sanitize(obj.move.value);
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

function rowThreeHeight(obj) {
  return Math.max(235, (obj.numberOf * 60) - 5);
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

function rowThreeLeft(w, h, x, y, obj, meta) {
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
  while (i < obj.numberOf) {
    console.log("i: " + i);
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
    bottom = bottom - 60;
    i = i + 1;
    console.log("numberOf: " + obj.numberOf);
    console.log("i: " + i);
  }
  s = s
    + "</div>";

  return s;
}

function damageTitle(zone, text, save, meta) {
  var saveColor = meta.accentColor;
  var saveTextColor = meta.reverseAccentColor;
  var s = ""
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
        + DOMPurify.sanitize(text.value)
      + "</div>";
  if (exists(save)) {
    s = s
      + "<div "
        + "style='"
          + "position:absolute;"
          + "width:18px;"
          + "height:18px;"
          + "right:1px;"
          + "top:1px;"
          + "font-size:16px;"
          + "vertical-align:middle;"
          + "text-align:center;"
          + "color:" + DOMPurify.sanitize(saveTextColor) + ";"
          + "background-color:" + DOMPurify.sanitize(saveColor) + ";"
          + "border: 2px solid black;"
        + "'>"
        + DOMPurify.sanitize(save)
      + "</div>";
  }
  s = s 
    + "</div>";
  return s;
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
    internal = internal + "<div style='" + scaleStyle(row) + "font-family: \"IM Fell English\", serif;'>" + DOMPurify.sanitize(row.value) + "</div>";
    internal = internal + "</div>";
    internal = internal + "</div>";
    next = next + 25;
  });
  if (typeof dmgText !== 'undefined') {
    internal = internal + "<div style='" + scaleStyle(dmgText) + "font-family: \"IM Fell English\", serif;display:flex; height:"+ (dmgH - next) + "px; top:" + next + "px;justify-content:center;align-items:flex-end'>" + DOMPurify.sanitize(dmgText.value) + "</div>";
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
      + DOMPurify.sanitize(dmgText.value)
    + "</div>";
  internal = internal
    + "</div>"
  return internal;
}

function damageBoxes(w, h, boxes, meta) {
  var s = "";

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
/*
// A damage box that has
// values here are percents of the parent div anchored off the lower left
function horizDamageBox(wper, hper, xper, yper, obj) {
  // Title & Save (anchored off the top of the div)
  // Damage Boxes & Text (anchored off the top of the div)
  // lower text (anchored off the bottom of the div)
  obj.box.forEach((box) => {
  });
  var template = "<div style='border: 1px solid black;position:absolute;width:{0}%; height:{1}%;left:{2}%;bottom:{3}%;background-color:lightblue'><span style='justify-contents:right;color:cyan'>2,3</span>{4}</div>";
  var template_title = "<div style='position:absolute;width:100%; height:{1}px;left:{2}px;top:{3}px;background-color:black;color:white'><div style:'text-align:left'>{4}</div><div style='position:absolute;width:100%;top:0%;text-align:right'>{5}</div></div>";
  return template.formatUnicorn(wper, hper, xper, yper,
     template_title.formatUnicorn(wper, 25, 0, 0, "CANNON DECK", "4+"));
}
*/

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
            + DOMPurify.sanitize(contents.value)
          + "</div>"
        + "</div>"
      + "</div>";

      // Take out the margin
      top = top - 5;
    })
  return s;
}

/*
function rowFourColOne(gw, gh, w, h, x, y, meta, obj, inst) {
  var name = "";
  if (typeof inst.name !== "undefined") {
    name = inst.name;
  }
  var template = "<div style='position:absolute;width:{0}px; height:{1}px; left:{2}px; bottom:{3}px;'>{4}{5}</div>";
  var text_template = "<div style='border:1px solid black;font-family: \"IM Fell English\", serif;position:absolute;width:{0}px; height:{1}px; left:{2}px; bottom:{3}px; background-color:{6}; text-align:left;'><div style='{5}'>{4}</div></div>";
  return template.formatUnicorn(w, h, x, y,
    textRow(w, 25, 0, h-75, obj.lowerNotesTitle),
    text_template.formatUnicorn(w, h-100, 0, 25, obj.lowerNotes.value, scaleStyle(obj.lowerNotes), meta.parchmentColor))
  + "<div style='border:1px solid black;position:absolute;height:20px;width:345px;background-color:" + meta.parchmentColor + "; bottom:0px; left:0px; text-align:center; font-size:15px; font-family: \"Shadows Into Light\", cursive;'><div style:'" + scaleStyle(name) + "'>" + name.value + "</div></div>";
}
*/

/*
// Draws a ship in the center of svg object
function drawShip(w, h, s, meta, obj) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var t = cy - s; // top
  var b = cy + s; // bottom
  var l = cx - (s/3); // left
  var r = cx + (s/3); // right

  var full_curve_template = '<path style="fill:lightgray; stroke:black; stroke-width:2" d="M {0} {1} C {2} {3} {4} {5} {6} {7} C {8} {9} {10} {11} {12} {13} Z"></path>';
  return full_curve_template.formatUnicorn(l, b, l-10, cy, l, t+10, cx, t, r, t+10, r+10, cy, r, b);
}
*/
/*
// This is the svg part of the graphing.
function rowFourColTwo(gw, gh, w, h, x, y, meta, obj)
{
  broadside = "";
  aftBattery = "";
  foreSpread = "";
  foreBattery = "";

  if (typeof obj.broadsideBattery !== 'undefined') {
    broadside = drawBroadside(w, h, 40, obj.broadsideBattery, meta);
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
  internal = "<svg style='position:absolute; left:0px; top:0px; height:"+h+"px; width:"+w+"px;'>"
  + broadside
  + aftBattery
  + foreSpread
  + foreBattery
  + drawUnderTurrets(w, h, 40, meta, obj)
  + drawShip(w, h, 40, meta, obj)
  + drawOverTurrets(w, h, 40, meta, obj)
  + "</svg>";
  if (typeof obj.ammo !== 'undefined') {
    numRows = 1;
    if (typeof obj.ammoNumRows !== 'undefined') {
      numRows = obj.ammoNumRows;
    }
    ammoWidth = Math.ceil(obj.ammo / numRows) * 20 + (Math.ceil(obj.ammo / numRows) - 1) * 5
    internal = internal + boxline((w / 2) - (ammoWidth / 2), 5 + (numRows - 1) * 25, 20, obj.ammo, numRows, 5);
  }
  return template.formatUnicorn(w, h, x, y, internal, meta.waterColor);
}
*/

// Create a basic ship card.
// parameters:
// meta: Meta information about the card. This is info that's true of all of the cards for that ship's faction. In example, background/foreground colors, whether the ship card should be rotated x degrees, etc.
// obj: Object information about the card. This is true of all of the cards of this type. In example, all of the info on how to draw a wargalley.
// inst: Instance informat about the card. This is information true about a specific card. In example, the ship name of the card.
export function lightCard(meta, obj, inst)
{
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
      + rowThreeLeft(195, rowThreeHeight(obj), 5, 540 - rowTwoHeight(obj) - rowThreeHeight(obj), obj, meta)
      + rowThreeRight(285, rowThreeHeight(obj), 210, 540 - rowTwoHeight(obj) - rowThreeHeight(obj), obj, meta)
      + rowFour(490, 505 - rowTwoHeight(obj) - rowThreeHeight(obj), 5, 30, meta, obj)
      + rowFive(490, 20, 5, 5, meta, obj, inst)
    + "</div>";
}
