// object.js
const availableObjects = [
    
    {
      id: "goal",
      label: "Goal",
      defaultSize: 10, // Standaardgrootte
      svgPath: "img/goals/goal.svg",
      sizePercentage: 100,
      resizable: false, // Grootte kan worden aangepast
    },
    {
        id: "goal-back",
        label: "Goal Achterkant",
        defaultSize: 10, // Standaardgrootte
        svgPath: "img/goals/goal-back.svg",
        sizePercentage: 100,
        resizable: false, // Grootte kan worden aangepast
      },
    {
      id: "minigoal",
      label: "Mini Goal",
      sizePercentage: 100,
      svgPath: "img/goals/mini-goal.svg",
      resizable: false, // Grootte kan worden aangepast
    },
    {
        id: "minigoal-back",
        label: "Mini Goal Achterkant",
        sizePercentage: 100,
        svgPath: "img/goals/mini-goal-back.svg",
        resizable: false, // Grootte kan worden aangepast
      },
    {
        id: "bal",
        label: "Bal",
        sizePercentage: 100,
        svgPath: "img/material/ball.svg",
        resizable: true, // Grootte kan worden aangepast
      },
      {
        id: "ladder",
        label: "Ladder",
        sizePercentage: 100,
        svgPath: "img/ladder.svg",
        resizable: true, // Grootte kan worden aangepast
      },
      {
        id: "hoedje",
        label: "Hoedje",
        sizePercentage: 100,
        svgPath: "img/material/hoedje.svg",
        resizable: true, // Grootte kan worden aangepast
      },
      {
        id: "pion",
        label: "Pion",
        sizePercentage: 100,
        svgPath: "img/material/pion.svg",
        resizable: true, // Grootte kan worden aangepast
      },
      {
        id: "dummy",
        label: "Dummy",
        sizePercentage: 100,
        svgPath: "img/material/dummy.svg",
        resizable: false, // Grootte kan worden aangepast
      },
      {
        id: "stang",
        label: "stang",
        sizePercentage: 100,
        svgPath: "img/material/stang.svg",
        resizable: false, // Grootte kan worden aangepast
      },
      {
        id: "ring",
        label: "Ring",
        sizePercentage: 100,
        svgPath: "img/material/ring.svg",
        resizable: false, // Grootte kan worden aangepast
      },
      {
        id: "speler front",
        label: "Speler-front",
        sizePercentage: 50,
        svgPath: "img/spelers/speler-front_left.svg",
        resizable: false, // Grootte kan worden aangepast
      },
      {
        id: "speler back",
        label: "Speler-back",
        sizePercentage: 50,
        svgPath: "img/spelers/speler-back_left.svg",
        resizable: false, // Grootte kan worden aangepast
      },
      {
        id: "Keeper front",
        label: "keeper-front",
        sizePercentage: 50,
        svgPath: "img/spelers/keeper-front_left.svg",
        resizable: false, // Grootte kan worden aangepast
      },
      {
        id: "Keeper Back",
        label: "keeper-back",
        sizePercentage: 50,
        svgPath: "img/spelers/keeper-back_left_f.svg",
        resizable: false, // Grootte kan worden aangepast
      },
      {
        id: "Coach",
        label: "Coach",
        sizePercentage: 50,
        svgPath: "img/spelers/coach-front_left.svg",
        resizable: false, // Grootte kan worden aangepast
      },
  ];
  