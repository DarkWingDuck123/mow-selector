import DOMPurify from 'dompurify';
import { box, boxline, scaleStyle, exists, polarToCartesian, describeArc, drawBroadside, drawForeCannon, drawAftCannon, drawForeSpread, drawUnderTurrets, drawOverTurrets, drawShip, beastname, textRow, rowFive } from './cardUtility.js';

// A javascript that builds a negligible man o war card. In the original game
// these would be things like anti-flyer cards and/or other note cards.

// These types are characterized by only have title (maybe with cost/honors),
// optional movement, and a large note section for the specific rules for this
// item.

// Some useful css trickery:
// Centering a div vertically. In the parent's div's css: "display:-webkit-flex;display:flex;align-items:center;justify-contents:center".
// The child div needs to set it's width to 100%.

// Things to Do:
// + I've not been using dedicated css (because I think it's easier to change this
//   stuff on the fly for now), but at some point I need to identify the common
//   building blocks and do so.

// Row One is the type, title, honors, pt value and (optional) movement box
// It has a fixed height & width.
function rowOne(w, h, x, y, meta, obj, inst) {
  var cost = DOMPurify.sanitize(obj.cost.value);
  var honors = DOMPurify.sanitize(obj.honors.value);

  var colOneWidth = w;
  if (exists(obj.move) && exists(obj.moveTitle)) {
    colOneWidth = 295;
  }

  var s = ""
  s = "<div id='rowOne' "
      + "style='"
        + "position:absolute;"
        + "width:" + colOneWidth + "px;"
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
  if (exists(obj.move) && exists(obj.moveTitle)) {
    console.log("It exists");
    s = s
      + rowOneColOne(colOneWidth, h, 0, 0, meta, obj)
      + rowOneColTwo(w-300, h, 300, 0, meta, obj);
  } else {
    console.log("doesn't exists " + colOneWidth);
    s = s + rowOneColOne(colOneWidth, h, 0, 0, meta, obj);
  }
  s = s 
    + "</div>";
  return s;
}

// Column one has a fixed height/width and fixed position
function rowOneColOne(w, h, x, y, meta, obj) {
  console.log("rowOneColOne: " + w);
  var s = ""
    + "<div style='"
        + "position:absolute;"
        + "width:" + w + "px;"
        + "height:" + (h-25) + "px;"
        + "left:0px;"
        + "bottom:0px;'>"
      + textRow(w, 25, 0, h-45, obj.type)
      + beastname(w, 40, 0, h-50-40, obj.name, meta)
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

function rowTwo(w, h, x, y, meta, obj) {
  var s = ""
  console.log("rowTwo obj:");
  console.log(obj);
  var marginSpace = (obj.notes.length - 1) * 5;
  var realSpace = h - marginSpace;
  var top = y + h;
  obj.notes.forEach((note) => {
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

// Create a note or negiligible card.
// parameters:
// meta: Meta information about the card. This is info that's true of all of the cards for that ship's faction. In example, background/foreground colors, whether the ship card should be rotated x degrees, etc.
// obj: Object information about the card. This is true of all of the cards of this type. In example, all of the info on how to draw a wargalley.
// inst: Instance informat about the card. This is information true about a specific card. In example, the ship name of the card.
export function negligibleCard(meta, obj, inst)
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
      + rowTwo(490, 690 - 150 - 5, 5, 5, meta, obj)
    + "</div>";
}
