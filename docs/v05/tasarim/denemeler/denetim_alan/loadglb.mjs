import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

function stripImages(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  delete json.images; delete json.textures; delete json.samplers;
  for (const m of json.materials || []) {
    if (m.pbrMetallicRoughness) { delete m.pbrMetallicRoughness.baseColorTexture; delete m.pbrMetallicRoughness.metallicRoughnessTexture; }
    delete m.normalTexture; delete m.occlusionTexture; delete m.emissiveTexture;
    if (m.extensions) delete m.extensions;
  }
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  const pad = (4 - (js.length % 4)) % 4; js = Buffer.concat([js, Buffer.alloc(pad, 0x20)]);
  const rest = buf.slice(20 + jsonLen);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546C67, 0); header.writeUInt32LE(2, 4);
  const chunkHdr = Buffer.alloc(8); chunkHdr.writeUInt32LE(js.length, 0); chunkHdr.writeUInt32LE(0x4E4F534A, 4);
  const out = Buffer.concat([header, chunkHdr, js, rest]);
  out.writeUInt32LE(out.length, 8);
  return out;
}
export async function loadGLB(path) {
  await MeshoptDecoder.ready;
  const buf = stripImages(fs.readFileSync(path));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return await new Promise((res, rej) => loader.parse(ab, '', res, rej));
}
