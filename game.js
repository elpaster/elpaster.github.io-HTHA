// Matter.js aliases
const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

let engine, render, runner, player, enemyInterval, currentLevel;
let canvas, ctx;
let draggingShape = null, dragOffset = {x:0,y:0};
let currentMouse = {x:0,y:0};
const SKYLINE = 100;
let cloudX = -100; // Cloud position
let cloudActive = false;

function startLevel(level) {
  console.log("Starting level:", level); // Debug log
  
  if (!level) {
    console.error("No level data provided!");
    return;
  }
  
  currentLevel = level;

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameCanvas").classList.remove("hidden");
  document.getElementById("gameUI").classList.remove("hidden");
  document.getElementById("levelDisplay").innerText = `Level ${level.id}: ${level.name}`;

  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  engine = Engine.create({
    enableSleeping: false,
    positionIterations: 12,
    velocityIterations: 12,
    constraintIterations: 6
  });
  engine.gravity.y = 0.8; // Increased from 0.5 for faster falling
  Composite.clear(engine.world);

  render = Render.create({ canvas, engine, options:{width:800,height:500,wireframes:false,background:"#cbdfbd"} });
  Render.run(render);

  runner = Runner.create({
    delta: 1000 / 60,
    isFixed: true
  });
  Runner.run(runner, engine);

  // Create the scene based on level configuration
  createScene(level);

  setupCollisionDetection();
  setupShapePalette();
  startRenderLoop();
  showCountdown();
}

// Render loop with sprites
function startRenderLoop(){
  (function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    
    // Sky background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, SKYLINE);
    skyGradient.addColorStop(0, "#a8d5e2");
    skyGradient.addColorStop(1, "#d4e9f0");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0,0,canvas.width,SKYLINE);

    // Ground background
    const groundGradient = ctx.createLinearGradient(0, SKYLINE, 0, canvas.height);
    groundGradient.addColorStop(0, "#cbdfbd");
    groundGradient.addColorStop(1, "#b8c9a8");
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0,SKYLINE,canvas.width,canvas.height-SKYLINE);

    // Draw cloud if active
    if(cloudActive) {
      drawCloud(ctx, cloudX, 50);
    }

    Composite.allBodies(engine.world).forEach(body=>{
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      
      // Custom rendering based on label
      if (body.label === "player") {
        drawEgg(ctx, body.circleRadius);
      } else if (body.label === "hail") {
        drawHail(ctx, body.circleRadius);
      } else if (body.label === "bee") {
        drawBee(ctx, body.circleRadius);
      } else {
        // Default rendering for boxes and other shapes
        ctx.fillStyle = body.render.fillStyle || "#8b7355";
        ctx.strokeStyle = "#5a4a3a";
        ctx.lineWidth = 2;
        
        if(body.circleRadius){
          ctx.beginPath();
          ctx.arc(0,0,body.circleRadius,0,Math.PI*2);
          ctx.fill();
          ctx.stroke();
        } else if(body.vertices){
          ctx.beginPath();
          ctx.moveTo(body.vertices[0].x - body.position.x, body.vertices[0].y - body.position.y);
          for(let i=1;i<body.vertices.length;i++){
            ctx.lineTo(body.vertices[i].x - body.position.x, body.vertices[i].y - body.position.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    });

    // Draw ghost shape being dragged
    if(draggingShape){
      // Center the ghost on the cursor (no offset)
      const x = Math.min(Math.max(currentMouse.x, 40), canvas.width - 40);
      const y = Math.min(Math.max(currentMouse.y, 20), SKYLINE);

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#8b7355";
      ctx.strokeStyle = "#5a4a3a";
      ctx.lineWidth = 2;
      
      if(draggingShape.type === "box") {
        ctx.fillRect(x - draggingShape.width/2, y - draggingShape.height/2, draggingShape.width, draggingShape.height);
        ctx.strokeRect(x - draggingShape.width/2, y - draggingShape.height/2, draggingShape.width, draggingShape.height);
      } else if(draggingShape.type === "circle") {
        ctx.beginPath();
        ctx.arc(x, y, draggingShape.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // Draw trajectory from center of canvas top (where it will actually drop)
      drawTrajectory(currentMouse.x, SKYLINE, draggingShape);
    }

    requestAnimationFrame(loop);
  })();
}

function drawTrajectory(startX, startY, shape){
  let simX = startX;
  let simY = startY;
  let velocityY = 0;
  const g = engine.gravity.y; // Now 0.8

  ctx.strokeStyle = "rgba(139, 115, 85, 0.4)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(simX, simY);

  for(let i = 0; i < 60; i++){
    velocityY += g; 
    simY += velocityY;
    if(simY > 460 - (shape.height/2 || shape.radius)) break; // Stop before ground
    ctx.lineTo(simX, simY);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ===============================
   SCENE CREATION
================================*/
function createScene(level) {
  // Always add walls with better collision properties
  Composite.add(engine.world, [
    Bodies.rectangle(0,250,40,500,{isStatic:true,label:"wall",render:{fillStyle:"#6b5b4f"}, slop: 0}),
    Bodies.rectangle(800,250,40,500,{isStatic:true,label:"wall",render:{fillStyle:"#6b5b4f"}, slop: 0})
  ]);

  // Scene configurations based on level ID
  const scenes = {
    // HAIL LEVELS
    1: () => {
      // Pit with trees on sides - egg at bottom
      Composite.add(engine.world, [
        Bodies.rectangle(400,495,800,70,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}, slop: 0, friction: 1}),
        // Left pit wall
        Bodies.rectangle(250,400,25,200,{isStatic:true, render:{fillStyle:"#6b5b4f"}, slop: 0, friction: 1}),
        // Right pit wall
        Bodies.rectangle(550,400,25,200,{isStatic:true, render:{fillStyle:"#6b5b4f"}, slop: 0, friction: 1}),
        // Tree trunks
        Bodies.rectangle(150,380,35,140,{isStatic:true, render:{fillStyle:"#4a3c2b"}, slop: 0, friction: 1}),
        Bodies.rectangle(650,380,35,140,{isStatic:true, render:{fillStyle:"#4a3c2b"}, slop: 0, friction: 1})
      ]);
      player = Bodies.circle(400,445,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}, slop: 0});
      level.sceneType = "pit";
    },
    
    2: () => {
      // Egg on a tree branch
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Tree trunk
        Bodies.rectangle(200,350,40,300,{isStatic:true, render:{fillStyle:"#4a3c2b"}}),
        // Branch
        Bodies.rectangle(300,300,200,15,{isStatic:true, render:{fillStyle:"#4a3c2b"}})
      ]);
      player = Bodies.circle(380,280,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "branch";
    },
    
    3: () => {
      // Egg on elevated platform with gaps
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Platform
        Bodies.rectangle(400,380,150,20,{isStatic:true, render:{fillStyle:"#6b5b4f"}})
      ]);
      player = Bodies.circle(400,350,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "platform";
    },
    
    4: () => {
      // Egg in valley between two hills
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Left hill
        Bodies.rectangle(150,420,100,120,{isStatic:true, render:{fillStyle:"#8b9a6b"}}),
        // Right hill  
        Bodies.rectangle(650,420,100,120,{isStatic:true, render:{fillStyle:"#8b9a6b"}})
      ]);
      player = Bodies.circle(400,440,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "valley";
    },
    
    5: () => {
      // Egg on narrow pedestal
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Pedestal
        Bodies.rectangle(400,420,40,120,{isStatic:true, render:{fillStyle:"#6b5b4f"}})
      ]);
      player = Bodies.circle(400,370,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "pedestal";
    },
    
    // BEE LEVELS
    6: () => {
      // Egg in nest (small bowl)
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Nest walls
        Bodies.rectangle(330,440,15,80,{isStatic:true, angle:0.3, render:{fillStyle:"#8b7355"}}),
        Bodies.rectangle(470,440,15,80,{isStatic:true, angle:-0.3, render:{fillStyle:"#8b7355"}})
      ]);
      player = Bodies.circle(400,430,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "nest";
    },
    
    7: () => {
      // Egg between two tree branches
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Left branch
        Bodies.rectangle(250,350,150,15,{isStatic:true, render:{fillStyle:"#4a3c2b"}}),
        // Right branch
        Bodies.rectangle(550,350,150,15,{isStatic:true, render:{fillStyle:"#4a3c2b"}})
      ]);
      player = Bodies.circle(400,440,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "branches";
    },
    
    8: () => {
      // Egg on swinging platform (suspended)
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Platform
        Bodies.rectangle(400,350,120,15,{isStatic:true, render:{fillStyle:"#8b7355"}})
      ]);
      player = Bodies.circle(400,330,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "suspended";
    },
    
    9: () => {
      // Egg in flower (petals around)
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Petals
        Bodies.rectangle(350,420,60,10,{isStatic:true, angle:0.5, render:{fillStyle:"#f19c79"}}),
        Bodies.rectangle(450,420,60,10,{isStatic:true, angle:-0.5, render:{fillStyle:"#f19c79"}}),
        Bodies.rectangle(400,380,60,10,{isStatic:true, angle:1.57, render:{fillStyle:"#f19c79"}})
      ]);
      player = Bodies.circle(400,430,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "flower";
    },
    
    10: () => {
      // Egg on top of beehive structure
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Hive layers
        Bodies.rectangle(400,450,120,20,{isStatic:true, render:{fillStyle:"#d4a574"}}),
        Bodies.rectangle(400,420,100,20,{isStatic:true, render:{fillStyle:"#d4a574"}}),
        Bodies.rectangle(400,390,80,20,{isStatic:true, render:{fillStyle:"#d4a574"}})
      ]);
      player = Bodies.circle(400,360,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "hive";
    },
    
    // BOULDER LEVELS
    11: () => {
      // Egg in corner formed by rocks
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Rock walls
        Bodies.rectangle(250,440,60,80,{isStatic:true, render:{fillStyle:"#8b8b8b"}}),
        Bodies.rectangle(300,460,60,40,{isStatic:true, render:{fillStyle:"#8b8b8b"}})
      ]);
      player = Bodies.circle(320,430,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "rocks";
    },
    
    12: () => {
      // Egg on slanted rock face
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Slanted platform
        Bodies.rectangle(350,400,180,20,{isStatic:true, angle:0.3, render:{fillStyle:"#8b8b8b"}})
      ]);
      player = Bodies.circle(370,370,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "slope";
    },
    
    13: () => {
      // Egg in rocky ravine
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Ravine walls
        Bodies.rectangle(280,400,30,200,{isStatic:true, angle:0.2, render:{fillStyle:"#8b8b8b"}}),
        Bodies.rectangle(520,400,30,200,{isStatic:true, angle:-0.2, render:{fillStyle:"#8b8b8b"}})
      ]);
      player = Bodies.circle(400,440,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "ravine";
    },
    
    14: () => {
      // Egg on mountain peak
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Mountain peak (triangle-ish)
        Bodies.rectangle(400,430,100,100,{isStatic:true, render:{fillStyle:"#8b8b8b"}})
      ]);
      player = Bodies.circle(400,370,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "peak";
    },
    
    15: () => {
      // Egg in cave opening
      Composite.add(engine.world, [
        Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}}),
        // Cave walls
        Bodies.rectangle(300,380,40,200,{isStatic:true, render:{fillStyle:"#4a4a4a"}}),
        Bodies.rectangle(500,380,40,200,{isStatic:true, render:{fillStyle:"#4a4a4a"}}),
        Bodies.rectangle(400,300,240,40,{isStatic:true, render:{fillStyle:"#4a4a4a"}})
      ]);
      player = Bodies.circle(400,440,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
      level.sceneType = "cave";
    }
  };

  // Execute scene setup or use default
  if (scenes[level.id]) {
    scenes[level.id]();
  } else {
    // Default scene for levels without custom setup
    Composite.add(engine.world, [
      Bodies.rectangle(400,480,800,40,{isStatic:true, label:"ground", render:{fillStyle:"#6b5b4f"}})
    ]);
    player = Bodies.circle(400,400,20,{label:"player", restitution:0.3, friction:0.7, render:{fillStyle:"#FFA200"}});
    level.sceneType = "default";
  }

  Composite.add(engine.world, player);
}

/* ===============================
   SPRITE DRAWING FUNCTIONS
================================*/
function drawEgg(ctx, radius) {
  ctx.save();
  
  // Egg body
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.85, radius, 0, 0, Math.PI * 2);
  
  // Gradient for 3D effect
  const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
  gradient.addColorStop(0, "#FFF5E6");
  gradient.addColorStop(0.6, "#FFE4B5");
  gradient.addColorStop(1, "#D4A574");
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Outline
  ctx.strokeStyle = "#C89968";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Highlight
  ctx.beginPath();
  ctx.ellipse(-radius * 0.3, -radius * 0.4, radius * 0.3, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fill();
  
  ctx.restore();
}

function drawHail(ctx, radius) {
  ctx.save();
  
  // Main hail body
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  
  // Ice gradient
  const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
  gradient.addColorStop(0, "#E8F4FF");
  gradient.addColorStop(0.5, "#B8D8F0");
  gradient.addColorStop(1, "#7AB8E8");
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Outline
  ctx.strokeStyle = "#5A9FC8";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Shine spots
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(radius * 0.2, radius * 0.2, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fill();
  
  ctx.restore();
}

function drawBee(ctx, radius) {
  ctx.save();
  
  // Body (yellow and black stripes)
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.2, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#FFD700";
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Black stripes
  ctx.fillStyle = "#000";
  ctx.fillRect(-radius * 0.4, -radius * 0.8, radius * 0.3, radius * 1.6);
  ctx.fillRect(radius * 0.4, -radius * 0.8, radius * 0.3, radius * 1.6);
  
  // Wings
  ctx.fillStyle = "rgba(200, 230, 255, 0.6)";
  ctx.strokeStyle = "rgba(150, 200, 230, 0.8)";
  
  ctx.beginPath();
  ctx.ellipse(-radius * 0.8, -radius * 0.5, radius * 0.8, radius * 0.5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.ellipse(radius * 0.8, -radius * 0.5, radius * 0.8, radius * 0.5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Eyes
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  // Stinger
  ctx.fillStyle = "#8B4513";
  ctx.beginPath();
  ctx.moveTo(radius * 1.2, 0);
  ctx.lineTo(radius * 1.6, -radius * 0.2);
  ctx.lineTo(radius * 1.6, radius * 0.2);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/* ===============================
   CLOUD DRAWING
================================*/
function drawCloud(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = "#d4e4f7";
  ctx.strokeStyle = "#a8c9e8";
  ctx.lineWidth = 2;
  
  // Draw fluffy cloud shape
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.arc(x + 25, y - 10, 35, 0, Math.PI * 2);
  ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
  ctx.arc(x + 70, y + 10, 28, 0, Math.PI * 2);
  ctx.arc(x + 35, y + 15, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Dark bottom for rain effect
  ctx.fillStyle = "rgba(160, 180, 200, 0.5)";
  ctx.fillRect(x - 10, y + 25, 90, 15);
  
  ctx.restore();
}

// Mouse tracking
document.addEventListener("mousemove", e=>{
  const rect = canvas.getBoundingClientRect();
  currentMouse.x = e.clientX - rect.left;
  currentMouse.y = e.clientY - rect.top;
});

// Shape palette
function setupShapePalette(){
  const palette = document.getElementById("shapePalette");
  
  if (!palette) {
    console.error("shapePalette element not found!");
    return;
  }
  
  if (!currentLevel.shapes) {
    console.error("No shapes defined for this level!");
    return;
  }
  
  palette.innerHTML = ""; 
  palette.classList.remove("hidden");
  currentLevel.remainingShapes = [];

  currentLevel.shapes.forEach(shapeObj=>{
    for(let i=0;i<shapeObj.count;i++){
      const div = document.createElement("div");
      div.classList.add("shapeItem");
      div.innerText = shapeObj.type[0].toUpperCase();
      div.dataset.type = shapeObj.type;
      div.dataset.width = shapeObj.width;
      div.dataset.height = shapeObj.height;
      div.dataset.radius = shapeObj.radius||25;
      div.dataset.index = currentLevel.remainingShapes.length;
      div.onmousedown=startDragShape;
      palette.appendChild(div);

      currentLevel.remainingShapes.push({ used:false, element:div, ...shapeObj });
    }
  });
}

function startDragShape(e){
  const index = e.target.dataset.index;
  const shapeInfo = currentLevel.remainingShapes[index];
  if(shapeInfo.used) return;
  draggingShape={...shapeInfo};
  
  // Calculate offset from center of shape, not from click position
  dragOffset.x = 0;
  dragOffset.y = 0;

  document.onmouseup=()=>dropShape(index);
}

function dropShape(index){
  if(!draggingShape) return;

  // Use current mouse position directly (no offset since we centered it)
  const x = Math.min(Math.max(currentMouse.x, 40), canvas.width - 40);
  const y = SKYLINE;

  let body;
  if(draggingShape.type==="box") {
    body = Bodies.rectangle(x, y, draggingShape.width, draggingShape.height, {
      restitution:0.2, 
      friction:1.2,
      density: 0.002, // Slightly heavier for better stability
      frictionAir: 0.005,
      slop: 0,
      chamfer: { radius: 2 }, // Slightly rounded corners help with collision
      render:{fillStyle:"#8b7355"}
    });
  } else if(draggingShape.type==="circle") {
    body = Bodies.circle(x, y, draggingShape.radius, {
      restitution:0.2, 
      friction:1.2,
      density: 0.002,
      frictionAir: 0.005,
      slop: 0,
      render:{fillStyle:"#8b7355"}
    });
  }

  Composite.add(engine.world, body);
  currentLevel.remainingShapes[index].used = true;
  currentLevel.remainingShapes[index].element.style.display = "none";

  draggingShape = null;
  document.onmouseup = null;
}

// Enemies - Cloud-based hail system
function spawnHail(){ 
  cloudX = -100;
  cloudActive = true;
  
  enemyInterval = setInterval(() => {
    // Move cloud across screen
    cloudX += 5; // Cloud speed
    
    // Spawn hail from cloud position
    if(cloudX > 0 && cloudX < 800) {
      const x = cloudX + 35 + (Math.random() * 40 - 20); // Drop from cloud center with some spread
      const hail = Bodies.circle(x, 80, 6, {
        label: "hail",
        render: {fillStyle: "#b0d0ff"}, 
        restitution: 0.6,
        friction: 0.3,
        density: 0.0005,
        frictionAir: 0.005,
        slop: 0
      });
      Composite.add(engine.world, hail);
      setTimeout(() => Composite.remove(engine.world, hail), 10000);
    }
    
    // Level complete when cloud exits screen
    if(cloudX > 850) {
      clearInterval(enemyInterval);
      cloudActive = false;
      winLevel();
    }
  }, 150); // Spawn rate
}

// Countdown
function showCountdown() {
  let countdown = 10;
  const display = document.getElementById("countdownDisplay") || (() => {
    const d = document.createElement("div");
    d.id = "countdownDisplay";
    d.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:72px;font-weight:bold;color:#f19c79;text-shadow:3px 3px 8px rgba(0,0,0,0.3);z-index:1000";
    document.body.appendChild(d);
    return d;
  })();

  display.style.display = "block";
  display.innerText = countdown;

  const interval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      display.innerText = countdown;
    } else if (countdown === 0) {
      display.innerText = "GO!";
    } else {
      display.style.display = "none";
      clearInterval(interval);
      if (currentLevel.enemies === "hail") spawnHail();
    }
  }, 1000);
}

// Collisions
function setupCollisionDetection(){
  Events.on(engine,"collisionStart",event=>{
    event.pairs.forEach(pair=>{
      if((pair.bodyA.label==="player" && pair.bodyB.label==="hail")||
         (pair.bodyB.label==="player" && pair.bodyA.label==="hail")) lose();
    });
  });
}

// Lose & menu
function lose(){
  if(enemyInterval) clearInterval(enemyInterval);
  Runner.stop(runner);
  cloudActive = false;
  alert("You lost! The egg was hit!");
  goToMenu();
}

function winLevel(){
  if(enemyInterval) clearInterval(enemyInterval);
  Runner.stop(runner);
  cloudActive = false;
  alert("Level Complete! You protected the egg!");
  goToMenu();
}

function goToMenu(){
  if(enemyInterval) clearInterval(enemyInterval);
  if(runner) Runner.stop(runner);
  cloudActive = false;
  const cd=document.getElementById("countdownDisplay"); 
  if(cd) cd.style.display="none";
  document.getElementById("menu").classList.remove("hidden");
  document.getElementById("gameCanvas").classList.add("hidden");
  document.getElementById("gameUI").classList.add("hidden");
  document.getElementById("shapePalette").classList.add("hidden");
}

function restartLevel(){
  if(enemyInterval) clearInterval(enemyInterval);
  if(runner) Runner.stop(runner);
  cloudActive = false;
  const cd=document.getElementById("countdownDisplay"); 
  if(cd) cd.style.display="none";
  
  // Restart the same level
  startLevel(currentLevel);
}