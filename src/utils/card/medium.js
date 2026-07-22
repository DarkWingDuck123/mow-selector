import DOMPurify from 'dompurify';
import { box, boxline, scaleStyle, exists, polarToCartesian, describeArc, drawBroadside, drawForeCannon, drawAftCannon, drawForeSpread, drawUnderTurrets, drawOverTurrets, drawShip, beastname, textRow, rowFive, setDynamicBoxes } from './cardUtility.js';

// A javascript that builds a medium man o war card. In the original game
// these are all sea beasts.

// These types are characterized lacking a to-hit locations, and only having
// to-hit number. Any hit has potential to cause wounds.

// Some useful css trickery:
// Centering a div vertically. In the parent's div's css: "display:-webkit-flex;display:flex;align-items:center;justify-contents:center".
// The child div needs to set it's width to 100%.

// Things to Do:
// + I've not been using dedicated css (because I think it's easier to change this
//   stuff on the fly for now), but at some
//   point I need to identify the common building blocks and do so.

function crewbox(w, h, x, y, num, crewTitle) {
  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>"
      + textRow(w, 20, 0, 30, crewTitle)
      + boxline(0, 0, 30, num, 1, 0)
    + "</div>";
  return s;
}

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
  var s = ""
    + "<div style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + (h-25) + "px;"
        + "left:0px;"
        + "bottom:0px;'>"
      + textRow(w, 25, 0, h-45, obj.type)
      + beastname(w, 40, 0, h-50-40, obj.name, meta);
  if (exists(obj.crew) && obj.crew != 0)
     s = s
      + box(0,0,50)
      + crewbox(w - 55, 60, 55, h-50-40-60, obj.crew, obj.crewTitle);
  s = s
    + "</div>";
  return s;
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

function rowThree(w, h, x, y, obj, meta) {
  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>"
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:55px;"
        + "left:0px;"
        + "bottom:" + (h-55) + "px;"
      + "'>"
      + damageTitle("", obj.criticalTitle, obj.criticalSave, meta)
      + boxline(0, 0, 30, obj.criticalBoxes, 1, 0)
    + "</div>"
  + "</div>";

  return s;
}

function damageTitle(zone, text, save, meta) {
  var saveColor = meta.accentColor;
  var saveTextColor = meta.reverseAccentColor;
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
        + DOMPurify.sanitize(text.value)
      + "</div>"
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
      + "</div>"
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
  var internal = internal + "<div style='position:absolute; width:" + boxW + "px; height:"+ dmgH + "px; top:20px; left:0px;'><div style='position:absolute;text-align:right;color:grey;font-size:60px;width:"+boxW+"px;'>"+dbox.zone+"</div>";
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
  var slidOverW = w - 150;
  obj.lowerNotes.forEach((note) => {
    var title = note.title;
    var contents = note.note;
    // calculate size of the box and then the new top (which will be the
    // bottom of the current note).
    var boxHeight = (realSpace * note.height) / 100;
    top = top - boxHeight;

    if (top <= 200) w = slidOverW;

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

// This is the svg part of the graphing.
function rowFourColTwo(w, h, x, y, meta, obj)
{
  if (typeof obj == 'undefined') {
    return "";
  }

  var broadside = "";
  var aftBattery = "";
  var foreSpread = "";
  var foreBattery = "";

  console.log("Diagram: " + obj);

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
export function mediumCard(meta, obj, inst)
{
  setDynamicBoxes(inst.dynamicBoxes);
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

  var rowFiveWidth = 490;
  if (exists(obj.diagram)) {
    rowFiveWidth = 490 - 150;
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
      + rowThree(490, 60, 5, 480 - rowTwoHeight(obj), obj, meta)
      + rowFour(490, 510 - 60 - rowTwoHeight(obj), 5, 30, meta, obj)
      + rowFive(rowFiveWidth, 20, 5, 5, meta, obj, inst)
      + rowFourColTwo(145, 195, 350, 5, meta, obj.diagram)
    + "</div>";
}
