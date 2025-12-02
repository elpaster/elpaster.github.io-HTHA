console.log("Loaded:", document.currentScript.src);

function strokeToBounds(stroke) {
  const xs = stroke.map(p => p.x);
  const ys = stroke.map(p => p.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys)
  };
}

function classifyStroke(stroke) {
  const b = strokeToBounds(stroke);
  const aspect = b.w / b.h;

  if (b.w * b.h > 25000) return "building"; // big blob
  if (Math.abs(aspect - 1) < 0.3) return "tree"; // circle-ish
  return "path";
}

function convertStrokesToObjects(strokes) {
  const objects = [];

  for (let s of strokes) {
    const type = classifyStroke(s);
    const b = strokeToBounds(s);

    // Map canvas coords → world coords
    const worldX = (b.x - 200) / 40;
    const worldZ = (b.y - 200) / 40;

    if (type === "building") {
      objects.push({
        type: "box",
        x: worldX,
        z: worldZ,
        w: b.w / 40,
        h: 1,
        d: b.h / 40
      });
    }

    if (type === "tree") {
      objects.push({
        type: "tree",
        x: worldX,
        z: worldZ
      });
    }

    if (type === "path") {
      objects.push({
        type: "path",
        x: worldX,
        z: worldZ,
        w: b.w / 60
      });
    }
  }

  return objects;
}
