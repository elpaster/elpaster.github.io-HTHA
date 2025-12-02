console.log("Loaded:", document.currentScript.src);

document.getElementById("generateBtn").onclick = () => {
  const objs = convertStrokesToObjects(strokes);
  renderWorld(objs);
};

function renderWorld(objects) {
  const container = document.getElementById("sceneContainer");

  container.innerHTML = `
    <a-scene>
      <a-entity position="0 1.6 3" camera look-controls wasd-controls></a-entity>
      <a-plane rotation="-90 0 0" width="50" height="50" color="#7ec850"></a-plane>
      <a-sky color="#d0eaff"></a-sky>
    </a-scene>
  `;

  const scene = container.querySelector("a-scene");

  for (let obj of objects) {
    if (obj.type === "box") {
      const el = document.createElement("a-box");
      el.setAttribute("position", `${obj.x} 0 ${obj.z}`);
      el.setAttribute("width", obj.w);
      el.setAttribute("depth", obj.d);
      el.setAttribute("height", obj.h);
      el.setAttribute("color", "#999");
      scene.appendChild(el);
    }

    if (obj.type === "tree") {
      const t = document.createElement("a-sphere");
      t.setAttribute("position", `${obj.x} 1 ${obj.z}`);
      t.setAttribute("radius", "0.5");
      t.setAttribute("color", "#3a7f1a");
      scene.appendChild(t);
    }

    if (obj.type === "path") {
      const p = document.createElement("a-plane");
      p.setAttribute("rotation", "-90 0 0");
      p.setAttribute("position", `${obj.x} 0.01 ${obj.z}`);
      p.setAttribute("width", obj.w);
      p.setAttribute("height", "0.2");
      p.setAttribute("color", "#bbb");
      scene.appendChild(p);
    }
  }
}
