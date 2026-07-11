import DOMPurify from 'dompurify';
import { box, boxline, scaleStyle, exists, polarToCartesian, describeArc, drawBroadside, drawForeCannon, drawAftCannon, drawForeSpread, drawUnderTurrets, drawOverTurrets, drawShip } from './cardUtility.js';

// A javascript that builds a man o war card.

// Some useful css trickery:
// Centering a div vertically. In the parent's div's css: "display:-webkit-flex;display:flex;align-items:center;justify-contents:center".
// The child div needs to set it's width to 100%.

// Things to Do:
// + I've not been using dedicated css (because I think it's easier to change this stuff on the fly for now), but at some
//   point I need to identify the common building blocks and do so.

// Row One is the ship type & title, crew, and movement boxes
// It has a fixed height & width. I'd also like to put point cost here
// somewhere (maybe move honors and point in the upper right and left
// corners respectively).
function rowOne(gw, gh, w, h, x, y, meta, obj, inst) {
  console.log(obj);
  var cost = DOMPurify.sanitize(obj.cost.value);
  var honors = DOMPurify.sanitize(obj.honors.value);

  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:295px;"
        + "height:20px;"
        + "top:0px;"
        + "left:5px"
      + "'>"
      + "<div "
        + "style='"
          + "position:absolute;"
          + "text-align:left;"
          + "font-size:18px;"
          + "color:" + meta.fgColor + ";"
          + scaleStyle(obj.cost)
        + "'>"
        + cost
      + "</div>"
      + "<div "
        + "style='"
          + "position:absolute;"
          + "text-align:right;"
          + "font-size:18px;"
          + "color:" + meta.fgColor + ";"
          + scaleStyle(obj.honors)
        + "'>"
        + honors
      + "</div>"
    + "</div>"
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>"
      + rowOneColOne(gw, gh, 295, h, 0, 0, meta, obj)
      + rowOneColTwo(gw, gh, w-300, h, 300, 0, meta, obj)
    + "</div>";
  return s;
}

// CS rules for scaling horizontally and vertically
// transform:scale(4,1);
// -webkit-transform:scale(4,1);

// Column one has a fixed height/width and fixed position
function rowOneColOne(gw, gh, w, h, x, y, meta, obj) {
  var numCrew = obj.crew;

  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + (h-25) + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>"
      + textRow(gw, gh, w, 25, 0, h-45, obj.type)
      + shipname(gw, gh, w, 40, 0, h-90, obj.name, meta)
      + box(0,0,50)
      + crewbox(gw, gh, w-55, 50, 55, 0, numCrew, obj.crewTitle)
    + "</div>";
  return s;
}

function shipname(gw, gh, w, h, x, y, name, meta) {
  var s = ""
    + "<div "
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
      + "'>"
      + "<div "
        + "style='"
          + scaleStyle(name)
        + "'>"
        + DOMPurify.sanitize(name.value)
      + "</div>"
    + "</div>";
  return s;
}

function crewbox(gw, gh, w, h, x, y, num, crewTitle) {
  if (!exists(crewTitle)) return "";
  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>"
      + textRow(gw, gh, w, 20, 0, 30, crewTitle)
      + boxline(0, 0, 30, num, 1, 0)
    + "</div>";
  return s;
}

function textRow(gw, gh, w, h, x, y, text) {
  console.log("textRow: ");
  console.log(text);

  var s = ""
    + "<div "
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
        + "font-family: \"IM Fell English\", serif;"
      + "'>"
      + "<div "
        + "style='"
          + scaleStyle(text)
        + "'>"
        + DOMPurify.sanitize(text.value)
      + "</div>"
    + "</div>";
  console.log("textRow->s: " + s);
  return s;
}

// Column one has a fixed height/width and fixed position
function rowOneColTwo(gw, gh, w, h, x, y, meta, obj) {
  var contents = DOMPurify.sanitize(obj.move.value);
  // this scale is not used currently
  var contentsScale = obj.move.scale;

  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "border:1px solid black;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>"
      + textRow(gw, gh, w, 25, 0, h-25, obj.moveTitle)
      + "<div "
        + "style='"
          + "display:-webkit-flex;"
          + "display:flex;"
          + "align-items:center;"
          + "justify-contents:center;"
          + "position:absolute;"
          + "width:" + w + "px;"
          + "height:" + (h-25) + "px;"
          + "left:" + 0 + "px;"
          + "bottom:" + 0 + "px;"
          + "background-color:" + meta.parchmentColor + ";"
          + "text-align:center;"
        + "'>"
        + "<div "
          + "style='"
            + "font-family:\"IM Fell English\",serif;"
            + "width:100%;"
          + "'>"
          + contents
        + "</div>"
      + "</div>"
    + "</div>";
  return s;
}

// Row two is optional, it's for general short notes (like movement
// specific rules). I'm debating dropping row two in favor of row four.
// When it's not set, this return an empty string "".

// rewrite so it can have multiple notes
function rowTwo(gw, gh, w, h, x, y, meta, obj) {
  if (!obj.upperNotes) return "";
  var internal = "";
  obj.upperNotes.forEach((note) => {
    internal = internal + textRow(gh, gh, w, h, x, y, note);
    y = y - 30;
  })
  return internal;
}

function rowTwoHeight(obj) {
  return (obj.upperNotes?.length ?? 0) * 30;
}

// Row three is the damage row. It contains the to hit/damange boxes.
function rowThree(gw, gh, w, h, x, y, obj, meta) {
  var foreaft = "";
  console.log("foreAft: " + obj.foreAft);
  if (typeof obj.foreAft !== 'undefined') {
    console.log("HERE!!");
    var offset = 0;
    if (typeof obj.highLow !== 'undefined') {
      offset = 25;
    }
    foreaft = foreAftBox(w-offset, 21, x+offset, y+h-21, obj);
    h = h - 22;
  }

  var left = "0px"
  var wid = w;
  var hilo = "";

  console.log("highLow: " + obj.highLow);
  if (typeof obj.highLow !== 'undefined') {
    console.log("HERE!!!!");
    hilo = highLowBox(25, h, 0, 0, obj);
    left = "25px"
    wid = w - 25;
  }

  // the div that hold the damage track. From this point on, everything
  // is based on percents for this object.

  var s = ""
    + foreaft
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
        + "background-color:green"
      + "'>"
      + hilo
      + "<div "
        + "style='"
          + "position:absolute;"
          + "left:" + left + ";"
          + "bottom:0px;"
          + "width:" + wid + "px;"
          + "height:" + h + "px;"
          + "background-color:blue;"
        + "'>"
        + damageBoxes(wid, h, obj.dmgBoxes, meta)
      + "</div>"
    + "</div>"
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:345px;"
        + "height:50px;"
        + "bottom:155px;"
        + "left:5px;"
      + "'>"
      + damageTitle("", obj.criticalTitle, obj.criticalSave, meta)
      + boxline(0, 0, 30, obj.criticalBoxes, 1, 0)
    + "</div>";

  return s;
}

function damageTitle(zone, text, save, meta) {
  var saveColor = meta.accentColor;

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
         + scaleStyle(text)
         + "height:20px;"
         + "top:0px;"
         + "font-size:18px;"
         + "vertical-align:middle;"
         + "text-align:center;"
         + "color:white;"
         + "background-color:black;"
         + "font-family: \"IM Fell English\", serif;"
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
         + "color:white;"
         + "background-color:" + saveColor + ";"
         + "border: 2px solid black"
       + "'>"
       + DOMPurify.sanitize(save)
     + "</div>"
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
  var internal = internal
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + boxW + "px;"
        + "height:"+ dmgH + "px;"
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
        +  dbox.zone
      + "</div>";
  var next = 5;
  dmgRow.forEach((row) => {
    internal += ""
      + "<div "
        + "style='"
          + "position:absolute;"
          + "width:100%;"
          + "height:20px;"
          + "top:" + next + "px;"
          + "left:0px;"
        + "'>"
        + box(5, 0, 20)
        + "<div "
          + "style='"
            + "position:absolute;"
            + "width:" + (boxW - 30) + "px;"
            + "height:100%;"
            + "left:30px;"
          + "'>"
          + "<div "
            + "style='"
              + scaleStyle(row)
              + "font-family: \"IM Fell English\", serif;"
            + "'>"
            + DOMPurify.sanitize(row.value)
          + "</div>"
        + "</div>"
      + "</div>";
    next = next + 25;
  });
  if (typeof dmgText !== 'undefined') {
    internal += ""
      + "<div "
        + "style='"
          + scaleStyle(dmgText)
          + "font-family: \"IM Fell English\", serif;"
          + "display:flex;"
          + "height:" + (dmgH - next) + "px;"
          + "top:" + next + "px;"
          + "justify-content:center;"
          + "align-items:flex-end;"
        + "'>"
        + DOMPurify.sanitize(dmgText.value)
      + "</div>";
  }
  internal += "</div>"
  return internal;
}

// Draws the internals of a damage box, where the damage boxes are draw in a grid at the top (mostly horizontally). All the text is
// below these boxes.
function damageHorizontalBoxes(w, h, dbox) {
  var dmgNumBoxes = dbox.numBoxes;
  var dmgNumRows = dbox.numRows;
  var dmgText = dbox.notes;

  var boxH = (h * dbox.height) / 100;
  var dmgH = boxH - 20;
  var boxW = (w * dbox.width) / 100;

  // The big zone indicator
  // And the row of damage boxes (last line).
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
      + "</div>"
      + boxline(5, dmgH - 25, 20, dmgNumBoxes, dmgNumRows, 5);

  var next = dmgNumRows * 20 + 5; // I don't know if this is right.

  internal += ""
    + "<div "
      + "style='"
        + "font-family: \"IM Fell English\", serif;"
        + "transform:scale(" + dmgText.scale + ",1);"
        + "-webkit-transform:scale(" + dmgText.scale + ",1);"
        + "position:absolute;"
        + "width:100%;"
        + "bottom:0px;"
        + "left:0px;"
        + "text-align:center;"
      + "'>"
      + DOMPurify.sanitize(dmgText.value)
    + "</div>";
  internal += "</div>";
  return internal;
}

function damageBoxes(w, h, boxes, meta) {
  var s = ""
  console.log(boxes);
  var dmgText = "No Critical Hits"
  boxes.forEach((dbox) => {
    console.log(dbox);
    var internal = damageTitle(dbox.zone, dbox.name, dbox.save, meta); // damageTitle is 20 px high
    if (dbox.isHorizontal) {
      internal += damageHorizontalBoxes(w, h, dbox);
    } else {
      internal += damageVerticalBoxes(w, h, dbox);
    }
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

function foreAftBox(w, h, x, y, obj) {
  console.log("HERE: " + obj);
  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "background-color:white;"
        + "width:" + w +"px;"
        + "height:" + h +"px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>";

  var left = 0;
  var i = 0;
  obj.foreAft.forEach((b) => {
    var width = w * b.width / 100;
    var wid = width;
    if (i != obj.foreAft.length - 1) {
      wid = wid - 1;
    }
    s += ""
      + "<div "
        + "style='"
          + "position:absolute;"
          + "background-color:black;"
          + "color:white;"
          + "text-align:center;"
          + "width:" + wid + "px;"
          + "left:" + left + "px;"
          + "bottom:2px;"
          + "height:" + (h-2) + "px;"
        + "'>"
        + DOMPurify.sanitize(b.title)
      + "</div>";
   left += width;
   i = i + 1;
  });
  s += "</div>";
  console.log("HERE2: " + s);
  return s;
}

// Known bug: I can't get the text to center in these boxes. It's centering based
// off the horizontal (instead of the vertical) and vertical centering of
// text is "hard" (the normal way I've been doing it with a a flex display
// isn't working). It's not an issue if you keep the text "short".
function highLowBox(w, h, x, y, obj) {
  var s = ""
    + "<div "
      + "style='"
        + "background-color:white;"
        + "width:25px;"
        + "height:100%;"
        + "left:0px;"
        + "bottom:0px;"
      + "'>";

  var bottom = 0;
  var i = 0;
  obj.highLow.forEach((b) => {
    var height = h * b.height / 100;
    var hei = height;
    if (i != obj.highLow.length - 1) {
      hei = hei - 1;
    }
    s += ""
        + "<div "
          + "style='"
            + "position:absolute;"
            + "display:-webkit-flex;"
            + "display:flex;"
            + "align-items:center;"
            + "justify-contents:center;"
            + "width:23px;"
            + "height:" + hei + "px;"
            + "left:0px;"
            + "bottom:" + bottom + "px;"
            + "background-color:black;"
          + "'>"
          + "<div "
            + "style='"
              + "transform: rotate(-90deg);"
              + "text-align:center;"
              + "width:100%;"
              + "color:white;"
            + "'>"
            + "<div "
              + "style='"
                + "text-align:center;"
              + "'>"
              + DOMPurify.sanitize(b.title)
            + "</div>"
          + "</div>"
        + "</div>";
    bottom = bottom + height;
    i = i + 1;
  });
  s += "</div>";
  return s;
}

// Row four is for Notes (weapons, special rules, etc), firing template
// and honor value?.
function rowFour(gw, gh, w, h, x, y, meta, obj, inst) {
  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>"
      + rowFourColOne(gw, gh, w-145, h, 0, 0, meta, obj, inst)
      + rowFourColTwo(gw, gh, 140, h, w-140, 0, meta, obj)
    + "</div>";
  return s;
}

function rowFourColOne(gw, gh, w, h, x, y, meta, obj, inst) {
  var name = { "value": "", "scale": 1.0 };
  if (typeof inst.name !== "undefined") {
    name = inst.name;
  }

  var s = ""
    + "<div "
      + "style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + h + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
      + "'>"
      + textRow(gw, gh, w, 25, 0, h-75, obj.lowerNotesTitle)
      + "<div "
        + "style='"
          + "border:1px solid black;"
          + "font-family: \"IM Fell English\", serif;"
          + "position:absolute;"
          + "width:" + w + "px;"
          + "height:" + (h-100) + "px;"
          + "left:" + 0 + "px;"
          + "bottom:" + 25 + "px;"
          + "background-color:" + meta.parchmentColor + ";"
          + "text-align:left;"
        + "'>"
        + "<div "
          + "style='"
            + scaleStyle(obj.lowerNotes)
          + "'>"
          + DOMPurify.sanitize(obj.lowerNotes.value)
        + "</div>"
      + "</div>"
    + "</div>"
    + "<div "
      + "style='"
        + "border:1px solid black;"
        + "position:absolute;"
        + "height:20px;"
        + "width:345px;"
        + "background-color:" + meta.parchmentColor + ";"
        + "bottom:0px;"
        + "left:0px;"
        + "text-align:center;"
        + "font-size:15px;"
        + "font-family: \"Shadows Into Light\", cursive;"
      + "'>"
      + "<div "
        + "style:'"
          + scaleStyle(name)
        + "'>"
        + DOMPurify.sanitize(name.value)
      + "</div>"
    + "</div>";

  return s;
}

// This is the svg part of the graphing.
function rowFourColTwo(gw, gh, w, h, x, y, meta, obj)
{
  var broadside = "";
  var aftBattery = "";
  var foreSpread = "";
  var foreBattery = "";

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

  var internal = ""
    + "<svg "
      + "style='"
        + "position:absolute;"
        + "left:0px;"
        + "top:0px;"
        + "height:" + h + "px;"
        + "width:" + w + "px;"
      + "'>"
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
    internal += boxline(
        (w / 2) - (ammoWidth / 2),
        5 + (numRows - 1) * 25,
        20,
        obj.ammo,
        numRows,
        5);
  }
  var s = ""
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
  return s;
}

// Create a basic ship card.
// parameters:
// meta: Meta information about the card. This is info that's true of all of the cards for that ship's faction. In example, background/foreground colors, whether the ship card should be rotated x degrees, etc.
// obj: Object information about the card. This is true of all of the cards of this type. In example, all of the info on how to draw a wargalley.
// inst: Instance informat about the card. This is information true about a specific card. In example, the ship name of the card.
export function heavyCard(meta, obj, inst)
{
  var template = "<div style='transform: rotate({7}deg);zoom:{8}; position: relative; border: 1px solid black; width:{1}px; height:{2}px; background-color:{0};'>{3}{4}{5}{6}</div>"

  console.log("META: ");
  console.log(meta);
  console.log(meta.bgColor);
  console.log("OBJ: ");
  console.log(obj);
  console.log("INST: " + inst);
  console.log(inst);
  var rotate = 0;
  if (exists(meta.rotate)) {
    rotate = meta.rotate;
  }
  var zoom = 1.0;
  if (exists(inst.scale)) {
    zoom = inst.scale;
  }
  var s = ""
    + "<div "
      + "style='"
        + "transform: rotate(" + rotate + "deg);"
        + "zoom:" + zoom + ";"
        + "position:relative;"
        + "border: 1px solid black;"
        + "width:" + 500 + "px;"
        + "height:" + 700 + "px;"
        + "background-color:" + meta.bgColor + ";"
      + "'>"
      + rowOne(500, 700, 490, 150, 5, 545, meta, obj, inst)
      + rowTwo(500, 700, 490, 25, 5, 515, meta, obj)
      + rowThree(500, 700, 490, 335 - rowTwoHeight(obj), 5, 205, obj, meta)
      + rowFour(500, 700, 490, 195, 5, 5, meta, obj, inst)
    + "</div>";
  return s;
}
