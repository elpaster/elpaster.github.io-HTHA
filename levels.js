const LEVELS = [
    {
      category: "Hail",
      levels: [
        { id: 1, name: "Pit Shelter", enemies: "hail", shapes: [{type:"box", count:1, width:320, height:20}], duration: 8000 },
        { id: 2, name: "Branch Protection", enemies: "hail", shapes: [{type:"box", count:2, width:25, height:120},{type:"box", count:1, width:150, height:25}], duration: 10000 },
        { id: 3, name: "Platform Defense", enemies: "hail", shapes: [{type:"box", count:2, width:120, height:25},{type:"box", count:1, width:25, height:100}], duration: 12000 },
        { id: 4, name: "Valley Cover", enemies: "hail", shapes: [{type:"box", count:2, width:100, height:25},{type:"box", count:2, width:25, height:80}], duration: 15000 },
        { id: 5, name: "Pedestal Shield", enemies: "hail", shapes: [{type:"box", count:3, width:80, height:25},{type:"box", count:2, width:25, height:60}], duration: 20000 }
      ]
    },
    {
      category: "Bees",
      levels: [
        { id: 6, name: "Nest Guard", enemies: "bees", shapes: [{type:"box", count:2, width:100, height:25},{type:"box", count:1, width:25, height:80}], duration: 10000 },
        { id: 7, name: "Between Branches", enemies: "bees", shapes: [{type:"box", count:2, width:120, height:25},{type:"box", count:1, width:25, height:100}], duration: 12000 },
        { id: 8, name: "Suspended Safety", enemies: "bees", shapes: [{type:"box", count:2, width:90, height:25},{type:"box", count:2, width:25, height:70}], duration: 15000 },
        { id: 9, name: "Flower Fortress", enemies: "bees", shapes: [{type:"box", count:3, width:80, height:25},{type:"box", count:2, width:25, height:60}], duration: 18000 },
        { id: 10, name: "Hive Defense", enemies: "bees", shapes: [{type:"box", count:4, width:70, height:25},{type:"box", count:2, width:25, height:80}], duration: 25000 }
      ]
    },
    {
      category: "Boulders",
      levels: [
        { id: 11, name: "Rock Corner", enemies: "boulders", shapes: [{type:"box", count:2, width:100, height:25},{type:"box", count:1, width:25, height:90}], duration: 8000 },
        { id: 12, name: "Sloped Stand", enemies: "boulders", shapes: [{type:"box", count:2, width:110, height:25},{type:"box", count:1, width:25, height:100}], duration: 10000 },
        { id: 13, name: "Ravine Rescue", enemies: "boulders", shapes: [{type:"box", count:2, width:120, height:25},{type:"box", count:2, width:25, height:80}], duration: 12000 },
        { id: 14, name: "Peak Protection", enemies: "boulders", shapes: [{type:"box", count:3, width:90, height:25},{type:"box", count:2, width:25, height:70}], duration: 15000 },
        { id: 15, name: "Cave Ceiling", enemies: "boulders", shapes: [{type:"box", count:3, width:80, height:25},{type:"box", count:2, width:25, height:90}], duration: 20000 }
      ]
    },
    {
      category: "Lasers",
      levels: [
        { id: 16, name: "Laser Lite", enemies: "lasers", shapes: [{type:"box", count:2, width:60, height:30},{type:"circle", count:1, radius:25}], duration: 10000 },
        { id: 17, name: "Beam Barrage", enemies: "lasers", shapes: [{type:"box", count:3, width:50, height:25},{type:"circle", count:1, radius:25}], duration: 12000 },
        { id: 18, name: "Laser Grid", enemies: "lasers", shapes: [{type:"box", count:3, width:60, height:30},{type:"circle", count:2, radius:25}], duration: 15000 },
        { id: 19, name: "Death Ray", enemies: "lasers", shapes: [{type:"box", count:4, width:50, height:30},{type:"circle", count:2, radius:25}], duration: 18000 },
        { id: 20, name: "Laser Hell", enemies: "lasers", shapes: [{type:"box", count:5, width:50, height:25},{type:"circle", count:3, radius:25}], duration: 25000 }
      ]
    },
    {
      category: "Mixed Chaos",
      levels: [
        { id: 21, name: "Hail & Bees", enemies: "hail+bees", shapes: [{type:"box", count:3, width:60, height:30},{type:"circle", count:2, radius:25}], duration: 15000 },
        { id: 22, name: "Rocks & Lasers", enemies: "boulders+lasers", shapes: [{type:"box", count:4, width:50, height:30},{type:"circle", count:2, radius:25}], duration: 18000 },
        { id: 23, name: "Triple Threat", enemies: "hail+bees+boulders", shapes: [{type:"box", count:5, width:50, height:30},{type:"circle", count:3, radius:25}], duration: 20000 },
        { id: 24, name: "Everything Everywhere", enemies: "hail+bees+boulders+lasers", shapes: [{type:"box", count:6, width:50, height:30},{type:"circle", count:3, radius:25}], duration: 25000 },
        { id: 25, name: "Ultimate Chaos", enemies: "hail+bees+boulders+lasers", shapes: [{type:"box", count:7, width:50, height:25},{type:"circle", count:4, radius:25}], duration: 30000 }
      ]
    }
];