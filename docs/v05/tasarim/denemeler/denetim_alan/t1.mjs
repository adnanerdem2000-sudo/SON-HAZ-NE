import * as THREE from 'three';
import { loadGLB } from './loadglb.mjs';
const g = await loadGLB('/home/user/SON-HAZ-NE-w2/assets/models/chest.glb');
const b = new THREE.Box3().setFromObject(g.scene);
console.log('chest bbox', b.min.toArray().map(v=>+v.toFixed(3)), b.max.toArray().map(v=>+v.toFixed(3)));
