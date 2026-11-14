export async function resolve(spec, ctx, next) {
  if (spec === 'three') return { url: 'file:///home/user/SON-HAZ-NE-w2/vendor/three/three.module.js', shortCircuit: true };
  if (spec.startsWith('three/addons/')) return { url: 'file:///home/user/SON-HAZ-NE-w2/vendor/three/addons/' + spec.slice(13), shortCircuit: true };
  return next(spec, ctx);
}
