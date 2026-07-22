import DOMPurify from 'dompurify';

let _dynamicBoxes = false;
export function setDynamicBoxes(val) { _dynamicBoxes = !!val; }

function textBox(x, y, size) {
  return ""
    + "<div "
      + "contenteditable='true' "
      + "style='"
        + "border:1px solid black;"
        + "position:absolute;"
        + "width:" + size + "px;"
        + "height:" + size + "px;"
        + "left:" + x + "px;"
        + "bottom:" + y + "px;"
        + "background-color:white;"
        + "display:flex;"
        + "align-items:center;"
        + "justify-content:center;"
        + "font-size:" + size + "px;"
        + "line-height:1;"
        + "overflow:hidden;"
        + "cursor:text;"
      + "'>"
    + "</div>";
}

export function box(x, y, size) {
  if (_dynamicBoxes) return textBox(x, y, size);
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

export function boxline(x, y, size, num, rows, margin) {
  var i = 0;
  var boxes = "";
  while (i < num) {
    var j = Math.floor(i / rows);
    var k = (i % rows);
    console.log("i: " + i + " j: " + j + " k: " + k);
    boxes += box(x + size * j + margin * j, y - size * k - margin * k, size);
    i++;
  }
  return boxes;
}

// Scaling "centers" the scaling (so the center of the div doesn't move).
// This provides the style changes needed so the div doesn't change size
// or move position while the content of the div is scaled. Note: we don't
// really care about movement if the text is centered, so this function
// doesn't need to be used everywhere we use scale.
export function scaleStyle(scaleObj) {
  var width = 100 / scaleObj.scale;
  var left = -(width - 100) / 2;

  return 'position:absolute;width:' + width + '%;left:' + left + '%;transform:scale(' + scaleObj.scale + ',1);-webkit-transform:scale(' + scaleObj.scale + ',1);';
}

export function exists(obj) {
  return typeof obj !== 'undefined';
}

export function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

export function describeArc(x, y, radius, spread, startAngle, endAngle) {
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

// Draws a broadside out either side of the ship
export function drawBroadside(w, h, s, num, meta) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var t = cy - s + 10; // top (slightly less than the size of the ship)
  var b = cy + s - 10; // bottom
  var l = 15;
  var r = w - 15;
  var internal = '<rect x=' + l + ' y=' + t + ' width=' + (r - l) + ' height=' + (b - t) + ' style="fill:white;stroke:black;stroke-width:2"/>'
  internal = internal + '<text x=' + ((cx + l - (s/3)) / 2) + ' y=' + cy + ' fill="' + "black" + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  internal = internal + '<text x=' + ((cx + r + (s/3)) / 2) + ' y=' + cy + ' fill="' + "black" + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  return internal;
}

export function drawForeCannon(w, h, s, num, meta) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var t = 20;
  var b = cy;
  var l = cx - (s / 3);
  var r = cx + (s / 3);

  var internal = '<rect x=' + l + ' y=' + t + ' width=' + (r - l) + ' height=' + (b - t) + ' style="fill:white;stroke:black;stroke-width:2"/>'
  internal = internal + '<text x=' + cx + ' y=' + ((t + b - s) / 2) + ' fill="' + "black" + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  return internal;
}

export function drawAftCannon(w, h, s, num, meta) {
  var cx = w / 2; // center x
  var cy = h / 2; // center y
  var t = cy;
  var b = h-20;
  var l = cx - (s / 3);
  var r = cx + (s / 3);

  var internal = '<rect x=' + l + ' y=' + t + ' width=' + (r - l) + ' height=' + (b - t) + ' style="fill:white;stroke:black;stroke-width:2"/>'
  internal = internal + '<text x=' + cx + ' y=' + ((t + b + s) / 2) + ' fill="' + "black" + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  return internal;
}

//var path = describeArc(150, 150, 50, 0, 0, 50)
export function drawForeSpread(w, h, s, num, meta) {
  var cx = w / 2; // center x
  var cy = (h / 2) - (s / 2); // center y
  var internal = '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx, cy, 0, 70, -45, 45) + '"/>';
  internal = internal + '<text x=' + cx + ' y=' + ((2 * cy - 70) / 2) + ' fill="' + "black" + '" font-size="30px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + num + '</text>';
  return internal;
}

export function drawUnderTurrets(w, h, s, meta, obj) {
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
    internal = internal + '<text x=' + cx + ' y=' + (cy - s - 15) + ' fill="' + "black" + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.foreTurret + '</text>';
  }

  // aft center
  if (typeof obj.aftTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx, cy + 3*s/4, 0, 60, 90, 270) + '"/>';
    internal = internal + '<text x=' + cx + ' y=' + (cy + s + 25) + ' fill="' + "black" + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.aftTurret + '</text>';
  }

  // middle port
  if (typeof obj.portTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx - s/3 + 5, cy + 5, 0, 55, 180, 360) + '"/>';
    internal = internal + '<text x=' + (cx - s/3 - 25) + ' y=' + (cy + 5) + ' fill="'+ "black" +'" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.portTurret + '</text>';
  }

  // middle starboard
  if (typeof obj.starboardTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx + s/3 - 5, cy + 5, 0, 55, 0, 180) + '"/>';
    internal = internal + '<text x=' + (cx + s/3 + 25) + ' y=' + (cy + 5) + ' fill="' + "black" + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.starboardTurret  + '</text>';
  }

  // fore port
  if (typeof obj.forePortTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx - s / 3, (cy - ((2*s)/3)), 0, 40, 270, 360) + '"/>';
    internal = internal + '<text x=' + (cx - s/3 - 15) + ' y=' + (cy - ((2*s)/3) - 15) + ' fill="' + "black" + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.forePortTurret + '</text>';
  }

  // aft port
  if (typeof obj.aftPortTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx - s/3, (cy + s), 0, 40, 180, 270) + '"/>';
    internal = internal + '<text x=' + (cx - s/3 - 15) + ' y=' + (cy + s + 15) + ' fill="' + "black" + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.aftPortTurret + '</text>';
  }

  // fore starboard
  if (typeof obj.foreStarboardTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx + s / 3, (cy - ((2*s)/3)), 0, 40, 0, 90) + '"/>';
    internal = internal + '<text x=' + (cx + s/3 + 15) + ' y=' + (cy - ((2*s)/3) - 15) + ' fill="' + "black" + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.foreStarboardTurret + '</text>';
  }

  // aft starboard
  if (typeof obj.aftStarboardTurret !== 'undefined') {
    internal = internal + '<path style="fill:white; stroke:black; stroke-width:2" d="' + describeArc(cx + s/3, (cy + s), 0, 40, 90, 180) + '"/>';
    internal = internal + '<text x=' + (cx + s/3 + 15) + ' y=' + (cy + s + 15) + ' fill="' + "black" + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.aftStarboardTurret + '</text>';
  }

  // Ammo Boxes
  if (typeof obj.ammo !== 'undefined') {
    internal = internal + "";
  }
  return internal;
}

export function drawOverTurrets(w, h, s, meta, obj) {
  var cx = w / 2;
  var cy = h / 2;
  var internal = "";
  // middle center
  if (exists(obj.fullTurret)) {
    internal = internal + '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="lightgrey" stroke="black" stroke-width="2" /></circle>';
    // middle center turret is the only weapons that gets to draw it's number on the ship itself
    internal = internal + '<text x=' + cx + ' y=' + (cy + 16) + ' fill="' + "black" + '" font-size="20px" style=\'dominant-baseline:middle; text-anchor:middle;\'>' + obj.fullTurret + '</text>';
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
export function drawShip(w, h, s, meta, obj) {
  var cx = w / 2;
  var cy = h / 2;
  var t = cy - s;
  var b = cy + s;
  var l = cx - (s / 3);
  var r = cx + (s / 3);
  return '<path '
    + 'style="fill:lightgray; stroke:black; stroke-width:2;" '
    + 'd="'
    + 'M ' + l + ' ' + b + ' '
    + 'C ' + (l - 10) + ' ' + cy + ' ' + l + ' ' + (t + 10) + ' ' + cx + ' ' + t + ' '
    + 'C ' + r + ' ' + (t + 10) + ' ' + (r + 10) + ' ' + cy + ' ' + r + ' ' + b + ' '
    + 'Z'
    + '">'
    + '</path>';
}

export function beastname(w, h, x, y, name, meta) {
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
    + DOMPurify.sanitize(name.value)
  + "</div>";
}

export function textRow(w, h, x, y, text) {
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
        + DOMPurify.sanitize(text.value)
      + "</div>"
    + "</div>";
}

export function rowFive(w, h, x, y, meta, obj, inst) {
  var name = { value: "", scale: 1.0 };
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
        + "style='" + scaleStyle(name) + "'"
      + ">"
        + (name.value || "")
      + "</div>"
    + "</div>";
  return s;
}
