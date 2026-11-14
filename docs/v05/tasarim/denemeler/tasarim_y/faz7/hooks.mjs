// 'three' ve 'three/addons/' çıplak adlarını depo içi vendor dosyasına çevirir (salt-okur deneme)
const ROOT = process.env.DK_ROOT;
export async function resolve(specifier, context, next) {
  if (specifier === 'three') return { url: 'file://' + ROOT + '/vendor/three/three.module.js', shortCircuit: true };
  if (specifier.startsWith('three/addons/')) return { url: 'file://' + ROOT + '/vendor/three/addons/' + specifier.slice(13), shortCircuit: true };
  return next(specifier, context);
}
