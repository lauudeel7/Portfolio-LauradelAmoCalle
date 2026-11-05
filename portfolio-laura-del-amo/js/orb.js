(() => {
  const canvas = document.getElementById('orb'), stage = document.querySelector('.hero__stage');
  if (!canvas || !stage || !window.THREE) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, .1, 50);
  cam.position.z = 7;
  const group = new THREE.Group(); scene.add(group);

  const NOISE = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 perm(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 nm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

  const U = {uT:{value:0}, uM:{value:new THREE.Vector2()}, uAmp:{value:.3}};
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.6, 128, 128), new THREE.ShaderMaterial({
    uniforms:U, transparent:true, depthWrite:false,
    vertexShader: NOISE + `
    uniform float uT,uAmp;uniform vec2 uM;varying vec3 vN,vV;varying float vD;
    float disp(vec3 d){vec3 q=d+vec3(uM*.5,0.);return snoise(q*.9+uT*.35)*.6+snoise(q*1.9-uT*.5)*.25;}
    vec3 F(vec3 d){return d*(1.6+uAmp*disp(d));}
    void main(){vec3 d=normalize(position),n=d;vec3 t1=normalize(cross(n,vec3(0.,1.,.001))),t2=cross(n,t1);
      vec3 f0=F(d),fa=F(normalize(d+t1*.02)),fb=F(normalize(d+t2*.02));
      vec3 nn=normalize(cross(fa-f0,fb-f0));if(dot(nn,n)<0.)nn=-nn;
      vN=normalize(normalMatrix*nn);vD=disp(d);vec4 mv=modelViewMatrix*vec4(f0,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `
    uniform float uT;varying vec3 vN,vV;varying float vD;
    vec3 pal(float t){vec3 c=vec3(.14,.06,.38),a=vec3(.545,.361,.965),b=vec3(.769,.710,.992);return mix(mix(c,a,smoothstep(0.,.5,t)),b,smoothstep(.5,1.,t));}
    void main(){vec3 n=normalize(vN),v=normalize(vV);float nv=clamp(dot(n,v),0.,1.),fr=pow(1.-nv,2.4);
      vec3 L1=normalize(vec3(.6,.8,.7)),L2=normalize(vec3(-.8,-.3,.5));
      float s1=pow(max(dot(reflect(-L1,n),v),0.),70.),s2=pow(max(dot(reflect(-L2,n),v),0.),28.);
      float band=.5+.5*sin(vD*7.+uT*.6+n.y*3.);
      vec3 col=pal(band*.65+fr*.5);col+=vec3(.15,.0,.22)*sin(n.x*9.+uT)*fr;
      col=col*(.3+.7*nv)+vec3(.95,.9,1.)*s1+vec3(.55,.4,1.)*s2*.6+vec3(.77,.71,.99)*fr*.9;
      gl_FragColor=vec4(col,clamp(.3+fr*.8+s1,0.,1.));}`
  }));
  group.add(orb);

  // halo
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), rg = g.createRadialGradient(64,64,0,64,64,64);
  rg.addColorStop(0,'rgba(139,92,246,.55)'); rg.addColorStop(.5,'rgba(139,92,246,.15)'); rg.addColorStop(1,'rgba(139,92,246,0)');
  g.fillStyle = rg; g.fillRect(0,0,128,128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c), blending:THREE.AdditiveBlending, depthWrite:false}));
  halo.scale.setScalar(8); halo.renderOrder = -1; group.add(halo);

  // anillos orbitales con cuentas
  const rings = [[2.5,.5,.2],[2.9,-.7,1.1]].map(([r,rx,rz],i) => {
    const p = new THREE.Group(); p.rotation.set(rx,0,rz);
    p.add(new THREE.Mesh(new THREE.TorusGeometry(r,.005,8,220), new THREE.MeshBasicMaterial({color:0xC4B5FD,transparent:true,opacity:.35})));
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.06,16,16), new THREE.MeshBasicMaterial({color:0xffffff}));
    p.add(bead); p.userData = {r, bead, s:i?-.5:.4}; group.add(p); return p;
  });

  // partículas
  const N = 900, pos = new Float32Array(N*3);
  for (let i=0;i<N;i++){const r=2.8+Math.random()*7,t=Math.random()*6.283,p=Math.acos(2*Math.random()-1);
    pos.set([r*Math.sin(p)*Math.cos(t), r*Math.sin(p)*Math.sin(t)*.7, r*Math.cos(p)-1], i*3);}
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({color:0xC4B5FD,size:.035,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));
  group.add(pts);

  const mouse = {x:0,y:0,tx:0,ty:0,v:0};
  addEventListener('pointermove', e => { mouse.tx = e.clientX/innerWidth*2-1; mouse.ty = -(e.clientY/innerHeight*2-1); });

  let perPx = 1, ph = 1;
  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    R.setSize(w,h,false); cam.aspect = w/h; cam.updateProjectionMatrix();
    ph = Math.tan(20*Math.PI/180)*7; perPx = 2*ph/h;
  }
  addEventListener('resize', resize); resize();
  function place(){
    const r = stage.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
    const cx = (r.left+r.width/2-cr.left)/cr.width*2-1, cy = -((r.top+r.height*.5-cr.top)/cr.height*2-1);
    group.position.set(cx*ph*cam.aspect, cy*ph, 0);
    group.scale.setScalar(Math.min(r.width*.5+r.height*.18, r.height*.62) * perPx / 1.6);
  }
  let visible = true;
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(canvas);
  const clock = new THREE.Clock();
  (function frame(){
    requestAnimationFrame(frame);
    if (!visible) return;
    place();
    const t = reduced ? 3 : clock.getElapsedTime();
    const px = mouse.x, py = mouse.y;
    mouse.x += (mouse.tx-mouse.x)*.05; mouse.y += (mouse.ty-mouse.y)*.05;
    mouse.v += (Math.hypot(mouse.x-px, mouse.y-py)*30 - mouse.v)*.08;
    U.uT.value = t; U.uM.value.set(mouse.x, mouse.y); U.uAmp.value = .3 + Math.min(mouse.v,.5)*.3;
    if (!reduced){
      group.rotation.y = mouse.x*.25; group.rotation.x = -mouse.y*.15;
      pts.rotation.y = t*.03; pts.rotation.x = t*.01;
      rings.forEach(p => { const a = t*p.userData.s; p.userData.bead.position.set(Math.cos(a)*p.userData.r, Math.sin(a)*p.userData.r, 0); p.rotation.y = t*.08*(p.userData.s>0?1:-1); });
    }
    R.render(scene, cam);
  })();
})();
