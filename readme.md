# VarunChaaras

3D portfolio site built with Three.js. Walk around, check out some projects, listen to music.

[Live Site](https://varunchaaras.art)

## What's This

Interactive 3D environment where you can explore my work. It's like a video game but for browsing a portfolio. Works on desktop and mobile.

## Features

- Walk around a 3D room
- Spatial audio from the record player
- Click paintings to view projects
- Interactive objects link to resume and GitHub
- Mobile joystick controls
- Animated pixel art characters

## Controls

**Desktop:**
- WASD or Arrow Keys to move
- E to interact
- F for fullscreen
- Click paintings to view

**Mobile:**
- Joystick appears when you touch
- Tap to interact

## Screenshots

![Main Room](./assets/s1.png)

![Interactions](./assets/s2.png)

![Gallery](./assets/s3.png)

![Menu](./assets/s4.png)

## Tech

Three.js, Vite, Web Audio API, vanilla JavaScript.

## Setup

```bash
git clone https://github.com/slugoguls/VarunChaaras.git
cd VarunChaaras
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Structure

```
src/
├── script.js       - main logic
├── player.js       - character movement
├── menu.js         - start screen
├── joystick.js     - mobile controls
└── ...

assets/
├── Models/         - 3D models
├── paintings/      - project images
├── sounds/         - audio
└── ...
```

## License

MIT

---

Built by [@slugoguls](https://github.com/slugoguls)

