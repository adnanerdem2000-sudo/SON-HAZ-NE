import * as THREE from 'three';
const { terrain } = await import('./js/world/terrain.js');
const { ocean } = await import('./js/world/ocean.js');
const { physics } = await import('./js/world/physics.js');
const { tpCamera } = await import('./js/player/camera.js');
console.log('imports ok', typeof terrain.heightAt, typeof ocean.heightAt);
