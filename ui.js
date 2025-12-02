window.onload = () => {
    const container = document.getElementById("categoriesContainer");
  
    LEVELS.forEach(categoryObj => {
      const catDiv = document.createElement("div");
      catDiv.classList.add("category");
  
      const catTitle = document.createElement("h2");
      catTitle.innerText = categoryObj.category;
      catDiv.appendChild(catTitle);
  
      const levelContainer = document.createElement("div");
      levelContainer.classList.add("levelContainer");
  
      categoryObj.levels.forEach(level => {
        const btn = document.createElement("button");
        btn.innerText = "Level " + level.id + ": " + level.name;
        btn.onclick = () => startLevel(level);
        levelContainer.appendChild(btn);
      });
  
      catDiv.appendChild(levelContainer);
      container.appendChild(catDiv);
    });
  
    // Setup buttons
    document.getElementById("backBtn").onclick = () => {
      goToMenu();
    };
    
    document.getElementById("restartBtn").onclick = () => {
      restartLevel();
    };
};