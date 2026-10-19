# LAST SIGNAL — Mobile Web 3D Extraction Shooter

**Status:** V0.1 playable-code prototype (mobile visual/performance verification pending)

Play (if GitHub Pages is published from main/root):
https://minkonson9-rgb.github.io/tc-quest/last-signal/

## Objective
Recover at least **2 encrypted signal cores** from supply caches, then reach the glowing extraction beacon at the northeast corner of the level before 8 minutes expire. Fight or avoid the robots. You have one life.

## Controls
| Action | Mobile | Desktop |
| --- | --- | --- |
| Move | Left thumbstick | WASD / arrows |
| Look / aim | Drag right side | Mouse drag |
| Fire | Hold FIRE | Hold left click / Space |
| Run | Hold RUN | Shift |
| Reload | RLD | R |
| Open cache / extract | USE | E |

Rotate the phone to landscape orientation. The experience prefers a recent iOS/Android flagship and an up-to-date Safari/Chrome browser. Three.js is loaded from a public CDN; an internet connection is required.

## Implemented
- Third-person 3D world, procedural industrial depot, sunset lighting, fog, textures, and shadows
- Mobile touch controls and desktop keyboard / mouse
- Third-person character and weapon model with muzzle flash and visual bullet traces
- Robot enemies: patrol, detect, chase, shoot, take damage, die
- Ammo, reload, armor, health, timer, death and victory states
- Supply cache interaction, cores and resource rewards
- Extraction beacon gated behind collection of two cores
- Minimap, compass, mission HUD
- Responsive overlay, audio cues synthesized on the device

## Known limits
- Code and repository files were checked; actual render/input behavior on physical phones has not yet been validated.
- Models and environmental textures are generated procedurally; they are not photorealistic AAA art assets.
- This is a single-player prototype with no account, online PvP, persistent inventory, or backend.
- Performance depends on mobile hardware, browser, and CDN availability.
- No gameplay telemetry is collected.

## Next production milestone
Test the deployed version on flagship iPhone and Galaxy, fix actual input/camera and performance issues, then replace major models with licensed optimized glTF assets, upgrade character and enemy animations, add more sophisticated encounter and extraction design, and implement persistent progression.

This is an original game inspired by the extraction-shooter genre. No original ARC Raiders IP or game assets are used.
