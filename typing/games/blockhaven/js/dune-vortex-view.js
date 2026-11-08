import * as THREE from '../lib/three.module.min.js';
import { createDuneWarningView } from './dune-warning-view.js';
import { DUNE_VORTEX_RADIUS, DUNE_VORTEX_DURATION } from './dune-vortex.js';

// Three batches, at most 402 Fast / 642 Fancy triangles, eight resources.
export function createDuneVortexView(scene, world, site, fast) {
  const ground = createDuneWarningView(scene, world, { ...site, radius: DUNE_VORTEX_RADIUS, type: 'vortex' }, fast);
  if (!ground) return null;
  const group = new THREE.Group(); group.position.set(site.x, site.y, site.z); scene.add(group);
  const ribbonGeometry = new THREE.BufferGeometry(), positions = [], uv = [];
  // Curved dust arcs with soft edges avoid opaque billboard rectangles.
  for (let i = 0; i < 6; i++) for (const [u, v] of [[i/6,0],[i/6,1],[(i+1)/6,1],[i/6,0],[(i+1)/6,1],[(i+1)/6,0]]) {
    const angle = (u - 0.5) * 1.35;
    positions.push(Math.sin(angle), v - 0.5 + angle * 0.35, Math.cos(angle) - 1); uv.push(u, v);
  }
  ribbonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  ribbonGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const ribbonMaterial = new THREE.ShaderMaterial({ side: THREE.DoubleSide, transparent: true, depthWrite: false,
    uniforms: { opacity: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vUv;uniform float opacity;void main(){float edges=smoothstep(0.,.18,vUv.x)*smoothstep(0.,.18,1.-vUv.x)*smoothstep(0.,.3,vUv.y)*smoothstep(0.,.3,1.-vUv.y);gl_FragColor=vec4(0.91,0.72,0.43,edges*opacity);}' });
  const grainGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  const grainMaterial = new THREE.MeshBasicMaterial({ color: 0xbe8b48, transparent: true, opacity: 0.8, depthWrite: false });
  const ribbons = new THREE.InstancedMesh(ribbonGeometry, ribbonMaterial, fast ? 12 : 24);
  const grains = new THREE.InstancedMesh(grainGeometry, grainMaterial, fast ? 8 : 16);
  ribbons.frustumCulled = grains.frustumCulled = false;
  ribbons.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grains.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(ribbons, grains);
  const pose = new THREE.Object3D(); let disposed = false;
  return {
    update(age, reduced) {
      if (disposed) return;
      ground.update(1, reduced);
      const time = reduced ? 0 : age, fade = Math.min(1, age / 0.2, (DUNE_VORTEX_DURATION - age) / 0.35);
      ribbonMaterial.uniforms.opacity.value = Math.max(0, fade) * (fast ? 0.45 : 0.32);
      grainMaterial.opacity = Math.max(0, fade) * 0.8;
      const perTier = ribbons.count / 3;
      for (let i = 0; i < ribbons.count; i++) {
        const tier = Math.floor(i / perTier), angle = i * Math.PI * 2 / perTier + tier * 0.7 + time * (2.3 - tier * 0.3), radius = 0.8 + tier * 0.65;
        pose.position.set(Math.cos(angle) * radius, 0.6 + tier * 1.05 + Math.sin(angle * 2) * 0.12, Math.sin(angle) * radius);
        pose.rotation.set(0, -angle + Math.PI / 2, 0.12); pose.scale.set(radius, 0.32 + tier * 0.09, radius); pose.updateMatrix(); ribbons.setMatrixAt(i, pose.matrix);
      }
      for (let i = 0; i < grains.count; i++) {
        const height = ((i * 0.618 + time * 0.45) % 1) * 3.6, angle = i * 2.4 + time * 2.8, radius = 0.65 + height * 0.48;
        pose.position.set(Math.cos(angle) * radius, 0.2 + height, Math.sin(angle) * radius);
        pose.rotation.set(time * 1.2, angle, i); pose.scale.setScalar(0.7 + i % 3 * 0.2); pose.updateMatrix(); grains.setMatrixAt(i, pose.matrix);
      }
      ribbons.instanceMatrix.needsUpdate = grains.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      if (disposed) return; disposed = true;
      ground.dispose(); scene.remove(group); ribbons.dispose(); grains.dispose();
      ribbonGeometry.dispose(); ribbonMaterial.dispose(); grainGeometry.dispose(); grainMaterial.dispose();
    }
  };
}
