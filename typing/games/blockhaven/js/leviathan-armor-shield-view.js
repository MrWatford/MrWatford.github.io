import * as THREE from "../lib/three.module.min.js";

const vertex = `varying vec3 vLocal;varying vec3 vWorld;varying vec3 vNormal;
void main(){vLocal=position;vec4 p=vec4(position,1.);vec3 n=normal;
#ifdef USE_INSTANCING
p=instanceMatrix*p;n=mat3(instanceMatrix)*n;
#endif
vWorld=(modelMatrix*p).xyz;vNormal=normalize(mat3(modelMatrix)*n);gl_Position=projectionMatrix*modelViewMatrix*p;}`;

// Three batches, no lights/textures/particle actors. All resources are local.
export function createArmorShieldView(scene, set, fast = false) {
  if (!["obsidian", "ancient"].includes(set)) throw Error("Unknown legendary shield style.");
  const ancient = set === "ancient", root = new THREE.Group(); scene.add(root);
  const tint = new THREE.Color(ancient ? 0x91cfff : 0xffb04b), dark = new THREE.Color(ancient ? 0xbeb4d8 : 0x251d29);
  if (!THREE.ColorManagement.enabled) { tint.convertSRGBToLinear(); dark.convertSRGBToLinear(); }
  const uniforms = () => ({ time: { value: 0 }, fade: { value: 0 }, tint: { value: tint.clone() }, dark: { value: dark.clone() }, ancient: { value: ancient ? 1 : 0 } });
  const plateMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: uniforms(), vertexShader: vertex,
    fragmentShader: `varying vec3 vLocal;varying vec3 vWorld;varying vec3 vNormal;uniform float time,fade,ancient;uniform vec3 tint,dark;
    void main(){vec2 p=floor(vLocal.xy*32.)/32.;float seam=min(abs(p.x+.09*sin(p.y*23.)),abs(p.y-.08*sin(p.x*19.)));
      float crack=(1.-smoothstep(.018,.04,seam))*(.65+.35*cos(p.y*32.));
      float glyph=min(abs(p.x),min(abs(p.y-.14),abs(p.y+.14)));
      float rune=mix(crack,(1.-smoothstep(.012,.03,glyph))*(1.-smoothstep(.23,.3,abs(p.x)))*(1.-smoothstep(.28,.35,abs(p.y))),ancient);
      float edge=smoothstep(.31,.45,length(p));float pulse=.85+.15*sin(time*2.);
      vec3 c=mix(dark,tint,max(edge*.75,rune)*pulse);float a=mix(.88,.6,ancient)*fade;gl_FragColor=vec4(c,a);}` });
  const plateGeometry = new THREE.CylinderGeometry(0.46, 0.46, 0.1, 6); plateGeometry.rotateX(Math.PI / 2);
  const count = fast ? 4 : 6, plates = new THREE.InstancedMesh(plateGeometry, plateMaterial, count); plates.frustumCulled = false; root.add(plates);
  const shellGeometry = new THREE.IcosahedronGeometry(1, fast ? 0 : 1);
  const shellMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: uniforms(), vertexShader: vertex,
    fragmentShader: `varying vec3 vLocal;varying vec3 vWorld;varying vec3 vNormal;uniform float time,fade,ancient;uniform vec3 tint,dark;
    void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(cameraPosition-vWorld))),2.5);
      float band=1.-smoothstep(.015,.055,abs(abs(vLocal.y)-.42));
      float marks=pow(.5+.5*cos(atan(vLocal.x,vLocal.z)*12.),12.)*band;
      float a=(.025+rim*.23+marks*.22)*fade;gl_FragColor=vec4(tint*(.88+.12*cos(time*2.)),a);}` });
  const shell = new THREE.Mesh(shellGeometry, shellMaterial); shell.position.y = 1.05; shell.scale.set(1.3, 1.35, 1.3); root.add(shell);
  const ringGeometry = new THREE.PlaneGeometry(6, 6);
  const ringMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: uniforms(),
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float time,fade,ancient;uniform vec3 tint,dark;
    void main(){vec2 p=(vUv-.5)*6.;float r=length(p);float a=atan(p.x,p.y);
      float ring=1.-smoothstep(.018,.055,abs(r-1.5));float inner=1.-smoothstep(.015,.04,abs(r-1.28));
      float marks=pow(.5+.5*cos(a*12.),16.)*(1.-smoothstep(.04,.12,abs(r-1.39)));
      float burst=(1.-smoothstep(.025,.1,abs(r-(.5+time*3.))))*(1.-smoothstep(.5,.8,time));
      float alpha=(ring*.7+inner*.3+marks*.8+burst*.6)*fade;if(alpha<.005)discard;gl_FragColor=vec4(tint,alpha);}` });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; root.add(ring);
  const transform = new THREE.Object3D(); let disposed = false;
  root.visible = false;
  return {
    update({ position, elapsed, remaining, thirdPerson, reducedMotion, yaw = 0, visible = true }) {
      if (disposed) return;
      const fade = Math.min(1, Math.max(0, elapsed / 0.2), Math.max(0, remaining / 0.5));
      root.visible = visible && remaining > 0 && fade > 0;
      root.position.set(position.x, position.y, position.z); root.rotation.y = yaw;
      const time = reducedMotion ? 1 : elapsed;
      for (const material of [plateMaterial, shellMaterial, ringMaterial]) { material.uniforms.time.value = time; material.uniforms.fade.value = fade; }
      plates.visible = thirdPerson;
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2 + (reducedMotion ? 0 : elapsed * (ancient ? -0.18 : 0.13));
        transform.position.set(Math.sin(angle) * 1.18, 1 + (reducedMotion ? 0 : Math.sin(elapsed * 1.6 + i) * 0.06), Math.cos(angle) * 1.18);
        transform.rotation.set(0, angle, ancient ? Math.PI / 6 : 0);
        transform.scale.set(ancient ? 0.75 : 0.9, ancient ? 1.3 : 1.1, 1); transform.updateMatrix(); plates.setMatrixAt(i, transform.matrix);
      }
      plates.instanceMatrix.needsUpdate = true;
    },
    dispose() { if (disposed) return; disposed = true; scene.remove(root); plates.dispose();
      for (const geo of [plateGeometry, shellGeometry, ringGeometry]) geo.dispose();
      for (const material of [plateMaterial, shellMaterial, ringMaterial]) material.dispose(); }
  };
}
