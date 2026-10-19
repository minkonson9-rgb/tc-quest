/* LAST SIGNAL — original mobile 3D extraction shooter, v0.1
   MIT-style project code; 3D runtime: three.js (MIT).
   Built for mobile browsers; no user accounts, telemetry, or ads. */
let T;
const $ = (id) => document.getElementById(id);
const canvas = $("game");
const loading = $("loading");
const menu = $("menu");
const hud = $("hud");
const controls = $("controls");
const minimap = $("minimap");
const mctx = minimap.getContext("2d");
const isTouch = matchMedia("(pointer:coarse)").matches || navigator.maxTouchPoints > 0;
try {
  T = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js");
} catch (e) {
  try { T = await import("https://esm.sh/three@0.170.0"); }
  catch (err) {
    loading.textContent = "3D ENGINE UNAVAILABLE. CHECK YOUR INTERNET CONNECTION AND RELOAD.";
    loading.style.textAlign = "center";
    loading.style.padding = "20px";
    throw err;
  }
}
let renderer, scene, camera, player, char, groupWeapon, sun, evac;
let mode="menu", timeLeft=480, lastTime=0, elapsed=0, mapTick=0, frameAccum=0;
let hp=100, ammo=30, reserve=120, cores=0, collected=0, kills=0, shootTimer=0, reloadTimer=0;
let yaw=0.55, pitch=-0.06, camKick=0, hitFeedback=0, dustCloud, dustPositions, flashMesh;
const baddies=[], crates=[], bolts=[], decals=[], obstacles=[], effects=[];
const keys=Object.create(null);
const stick={x:0,y:0,pointer:null}, look={pointer:null,x:0,y:0};
const buttons={fire:false,sprint:false};
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const rnd=(min=0,max=1)=>min+Math.random()*(max-min);
const colors={iron:0x435258,steel:0x768388,rust:0x775348,black:0x202c30,accent:0xa6f7d3,enemy:0xff6c57};
const geo={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,12,8),cylinder:new T.CylinderGeometry(1,1,1,10)};
const mat=(col,metal=.15,rough=.82,emit=0)=>new T.MeshStandardMaterial({color:col,metalness:metal,roughness:rough,emissive:emit,emissiveIntensity:emit?1.3:0});
const mats={steel:mat(0x5e7275,.74,.43),edge:mat(0x17282c,.75,.4),armor:mat(0x324c4c,.7,.47),rust:mat(0x705446,.55,.79),rubber:mat(0x1c2627,.1,.94),black:mat(0x111d21,.8,.36),cloth:mat(0x4f665b,.08,.91),light:mat(0xb6ffe0,.4,.2,0x85e8b5),red:mat(0xff9987,.2,.3,0xff452d),gold:mat(0xffc886,.2,.37,0xb8782f),concrete:mat(0x737874,.05,.93)};
function box(parent,ma,w,h,d,x=0,y=0,z=0){const o=new T.Mesh(geo.box,ma);o.scale.set(w,h,d);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function ball(parent,ma,r,x,y,z){const o=new T.Mesh(geo.sphere,ma);o.scale.setScalar(r);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o}
function cyl(parent,ma,r1,r2,h,x,y,z,seg=10){const o=new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg),ma);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o}
function emissive(hex,intensity=1.5){return new T.MeshBasicMaterial({color:hex})}
function rayLine(a,b,col=0xffe0b0,opacity=.8){const g=new T.BufferGeometry().setFromPoints([a,b]);const m=new T.LineBasicMaterial({color:col,transparent:true,opacity});const o=new T.Line(g,m);scene.add(o);effects.push({obj:o,age:0,life:.14,material:m});}
function toast(txt,seconds=2){const e=$("message");e.textContent=txt;e.style.opacity="1";clearTimeout(toast.t);toast.t=setTimeout(()=>{e.style.opacity="0"},seconds*1000)}
let audio;
function sound(freq=300,dur=.09,typ="sawtooth",volume=.05,slide=0){
  try{
    audio ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audio.state==="suspended")audio.resume();
    const o=audio.createOscillator(),g=audio.createGain();
    o.type=typ;o.frequency.setValueAtTime(freq,audio.currentTime);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(50,freq+slide),audio.currentTime+dur);
    g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);
    o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur+.015);
  }catch(e){}
}
function noiseTex(base="#58615c",extra="#313f3b"){
 const can=document.createElement("canvas");can.width=256;can.height=256;
 const c=can.getContext("2d");c.fillStyle=base;c.fillRect(0,0,256,256);
 for(let i=0;i<4200;i++){const x=Math.random()*256,y=Math.random()*256;
 c.fillStyle=Math.random()<.53?"rgba(14,22,21,.12)":"rgba(227,230,202,.13)";
 c.fillRect(x,y,rnd(.3,4),rnd(.3,5))}
 for(let i=0;i<55;i++){c.strokeStyle="rgba(12,24,26,.13)";c.lineWidth=rnd(.3,1.5);c.beginPath();const x=rnd(0,256),y=rnd(0,256);c.moveTo(x,y);c.lineTo(x+rnd(-27,31),y+rnd(-28,25));c.stroke()}
 const t=new T.CanvasTexture(can);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
function terrain(){
 const groundTex=noiseTex("#68716b");groundTex.repeat.set(18,18);
 const groundMat=new T.MeshStandardMaterial({map:groundTex,roughness:1,color:0xc5d1c1});
 const ground=new T.Mesh(new T.PlaneGeometry(150,150),groundMat);
 ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const asphaltTex=noiseTex("#414c49");asphaltTex.repeat.set(2,18);
 const asphalt=new T.MeshStandardMaterial({map:asphaltTex,roughness:.92,metalness:.05});
 for(const [x,z,w,d] of [[0,0,12,126],[-1,-13,100,11],[21,26,70,10]]){
   const plane=new T.Mesh(new T.PlaneGeometry(w,d),asphalt);plane.rotation.x=-Math.PI/2;plane.position.set(x,.025,z);plane.receiveShadow=true;scene.add(plane);
 }
 const lineMat=new T.MeshBasicMaterial({color:0xb6aa85,transparent:true,opacity:.35});
 for(let z=-52;z<50;z+=9){const strip=new T.Mesh(new T.PlaneGeometry(.16,4),lineMat);strip.rotation.x=-Math.PI/2;strip.position.set(0,.035,z);scene.add(strip)}
 for(let i=0;i<290;i++){
   const x=rnd(-63,63),z=rnd(-63,63);
   if(Math.abs(x)<9 || Math.abs(z+13)<7)continue;
   const o=box(scene,i%4===0?mats.rust:mats.concrete,rnd(.13,.55),rnd(.07,.32),rnd(.2,.5),x,.06,z);o.rotation.y=rnd(0,Math.PI);
 }
 // Burned earth, sparse grass; deliberately restrained for mobile GPU.
 const tuft=mat(0x626f55,0,.95);
 for(let i=0;i<220;i++){
   const x=rnd(-58,58),z=rnd(-58,58);
   if(Math.abs(x)<8&&Math.abs(z)<48)continue;
   const height=rnd(.13,.65);
   const p=new T.Mesh(new T.ConeGeometry(rnd(.06,.18),height,3),tuft);
   p.position.set(x,height/2,z);p.rotation.z=rnd(-.2,.2);scene.add(p);
 }
}
function ob(x,z,w,d){obstacles.push({x,z,w,d})}
function factory(x,z,w,d,h,kind=0){
 const g=new T.Group();g.position.set(x,0,z);scene.add(g);
 const wall=mat(kind===0?0x69716e:0x5a6666,.18,.93);
 const body=box(g,wall,w,h,d,0,h/2,0);body.castShadow=true;
 box(g,mats.edge,w+.45,.36,d+.45,0,h+.14,0);
 for(let side of [-1,1]){
   for(let i=0;i<Math.floor(w/4);i++){
     const xx=-w/2+2.6+i*3.8;
     box(g,mats.edge,1.7,1.75,.08,xx,h*.62,side*(d/2+.05));
     box(g,new T.MeshBasicMaterial({color:(i%3===0)?0xa0a38e:0x293e45}),1.38,1.44,.09,xx,h*.62,side*(d/2+.105));
   }
 }
 for(let i=0;i<Math.floor(d/4);i++){
   const zz=-d/2+2.6+i*3.8;
   for(const side of [-1,1]){
    box(g,mats.edge,.09,1.7,1.5,side*(w/2+.07),h*.62,zz);
    box(g,mat(0x22383a,.3,.7),.10,1.4,1.23,side*(w/2+.13),h*.62,zz);
   }
 }
 if(kind){
  for(let i=0;i<4;i++){const v=box(g,mats.rust,rnd(1.5,2.6),rnd(1,1.8),rnd(1.5,2.5),-w/2+rnd(2,w-2),h+rnd(.5,1),-d/2+rnd(2,d-2));v.rotation.y=rnd(0,6.28)}
 }
 ob(x,z,w+.8,d+.8);
}
function containerObj(x,z,w=4.5,d=9,rot=0,col=0x72634e){
 const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
 const ma=mat(col,.55,.79);
 box(g,ma,w,2.85,d,0,1.43,0);
 for(let u=-w/2+.36;u<w/2;u+=.65)for(let s of [-1,1])box(g,mats.rust,.07,2.56,.11,u,1.43,s*d/2);
 for(let u=-d/2+.3;u<d/2;u+=.8)for(let s of [-1,1])box(g,mats.edge,.10,2.55,.07,s*w/2,1.43,u);
 box(g,mats.edge,w+.18,.15,d+.12,0,2.93,0);
 ob(x,z,Math.max(w,d)+1,Math.max(w,d)+1);
}
function junk(){
 const stack=[[ -40,10],[ -35,13],[ -32,10],[22,-40],[30,-42],[36,-29],[-20,42],[15,38]];
 for(const [x,z] of stack){let yy=0;for(let i=0;i<3;i++){const w=rnd(1,2.3),d=rnd(1,2);box(scene,i%2?mats.rust:mats.edge,w,1.35,d,x+rnd(-1.4,1.4),yy+.7,z+rnd(-1.4,1.4));yy+=1.38}}
 for(let i=0;i<24;i++){
   const x=rnd(-52,52),z=rnd(-52,52);
   if(Math.abs(x)<8||Math.abs(z+13)<7)continue;
   let c=box(scene,i%3?mats.rust:mats.edge,rnd(.9,2.2),rnd(.65,1.4),rnd(.7,2),x,.6,z);c.rotation.y=rnd(0,6.28);
 }
 // Railway tracks on east side, ending in industrial yard.
 for(let side of [-1,1]){
  box(scene,mats.edge,.13,.14,89,30+side*1.1,.12,-4);
 }
 for(let zz=-45;zz<42;zz+=1.7)box(scene,mats.rust,4.2,.12,.27,30,.06,zz);
 for(const [x,z] of [[-37,27],[-9,42],[39,-10]]){
   const g=new T.Group();g.position.set(x,0,z);scene.add(g);
   cyl(g,mats.edge,.24,.34,10,0,5,0);
   box(g,mats.rust,5,.22,.32,1,10.1,0);box(g,mats.edge,.65,.8,.65,-1,10.6,0);
   const lamp=ball(g,mats.gold,.21,3.25,9.92,0);lamp.castShadow=false;
 }
 // Distant structures fade into fog, keep geometry inexpensive.
 for(let i=0;i<34;i++){
   const a=i*Math.PI*2/34;
   let rad=rnd(79,108),x=Math.sin(a)*rad,z=Math.cos(a)*rad;
   const h=rnd(8,42);
   let p=box(scene,mat(0x485d61,.08,1),rnd(7,18),h,rnd(7,15),x,h/2,z);p.castShadow=false;
 }
}
function makePlayer(){
 char=new T.Group();player=new T.Group();player.position.set(-43,0,-39);scene.add(player);player.add(char);
 const torso=box(char,mats.armor,.94,1.13,.55,0,1.71,.05);torso.rotation.x=-.12;
 box(char,mats.cloth,.72,.78,.38,0,1.58,-.39);
 box(char,mats.edge,.76,.26,.68,0,1.28,0);
 const helmet=ball(char,mats.steel,.39,0,2.51,0);
 box(char,mats.edge,.72,.23,.33,0,2.48,.25);
 box(char,mats.light,.54,.095,.11,0,2.51,.43);
 const back=box(char,mats.edge,.83,.88,.28,0,1.72,-.49);
 box(char,mats.rust,.52,.36,.12,0,1.76,-.68);
 for(let s of [-1,1]){
   box(char,mats.steel,.3,.33,.6,s*.63,2.02,.12);
   box(char,mats.cloth,.28,.48,.3,s*.6,1.65,.15);
   box(char,mats.edge,.3,.42,.31,s*.25,.75,-.01);
   box(char,mats.cloth,.32,.54,.32,s*.26,.38,.04);
 }
 groupWeapon=new T.Group();groupWeapon.position.set(.46,1.66,.39);char.add(groupWeapon);
 box(groupWeapon,mats.edge,.17,.24,.88,0,0,.26);
 box(groupWeapon,mats.steel,.13,.17,.81,0,.05,.76);
 box(groupWeapon,mats.rubber,.23,.34,.35,0,-.21,.05);
 box(groupWeapon,mats.edge,.21,.14,.22,0,.19,.04);
 flashMesh=ball(groupWeapon,new T.MeshBasicMaterial({color:0xffe3ad,transparent:true,opacity:0}),.19,0,.07,1.22);flashMesh.visible=false;
 const ring=new T.Mesh(new T.RingGeometry(.55,.65,36),new T.MeshBasicMaterial({color:0x9cfbcd,transparent:true,opacity:.22,side:T.DoubleSide}));
 ring.rotation.x=-Math.PI/2;ring.position.y=.034;player.add(ring);
}
function mech(x,z,rank=0){
 const g=new T.Group();g.position.set(x,0,z);scene.add(g);
 const dark=rank?mats.rust:mats.edge;
 const body=box(g,dark,rank?1.75:1.35,.86,rank?1.85:1.4,0,1.68,0);
 body.rotation.x=.06;
 box(g,mats.steel,rank?1.28:1.02,.39,.99,0,2.18,-.06);
 ball(g,mats.red,.25,0,1.91,.83);
 box(g,mats.red,.51,.12,.12,0,1.9,.91);
 for(let side of [-1,1]){
   const x=side*(rank?1.03:.81);
   box(g,mats.rust,.4,.57,.55,x,1.6,0);
   const limb=box(g,mats.steel,.23,1.3,.23,x*1.14,.72,.26);
   limb.rotation.z=side*.16;
   ball(g,mats.edge,.22,x,1.28,.27);
   box(g,mats.edge,.47,.20,.77,x*1.25,.12,.43);
 }
 for(let side of [-1,1])box(g,mats.black,.28,.25,1.19,side*.69,1.56,-.6);
 const radar=ball(g,mats.red,.16,0,2.55,0);
 const e={g,rank,hp:rank?115:72,maxHp:rank?115:72,anchor:V(x,0,z),dir:rnd(-Math.PI,Math.PI),t:rnd(0,5),cool:rnd(1.5,3),alert:false,dead:false,speed:rank?1.65:2.45};
 baddies.push(e);return e;
}
function cache(x,z,index){
 const g=new T.Group();g.position.set(x,0,z);scene.add(g);
 box(g,mats.edge,2.0,1.05,1.18,0,.59,0);
 box(g,mats.steel,1.77,.18,1.3,0,1.16,0);
 box(g,mats.light,1.2,.10,.12,0,1.11,.68);
 for(let s of [-1,1])box(g,mats.rust,.22,1.2,.14,s*.78,.61,.68);
 const halo=new T.Mesh(new T.TorusGeometry(1.0,.033,6,48),new T.MeshBasicMaterial({color:0x9ffed7,transparent:true,opacity:.6}));
 halo.rotation.x=-Math.PI/2;halo.position.y=.08;g.add(halo);
 const v={g,x,z,opened:false,phase:index*1.3,halo};crates.push(v);
}
function extraction(){
 evac=new T.Group();evac.position.set(43,0,42);scene.add(evac);
 const ring=new T.Mesh(new T.RingGeometry(2.2,2.45,64),new T.MeshBasicMaterial({color:0x96f9cd,side:T.DoubleSide,transparent:true,opacity:.88}));
 ring.rotation.x=-Math.PI/2;ring.position.y=.05;evac.add(ring);evac.userData.ring=ring;
 const beacon=cyl(evac,mats.edge,.6,.8,4.2,0,2.1,0);
 const lamp=ball(evac,mats.light,.45,0,4.55,0);lamp.castShadow=false;
 const halo=new T.Mesh(new T.CylinderGeometry(1.3,2.6,8,28,1,true),new T.MeshBasicMaterial({color:0x8decc4,transparent:true,opacity:.07,side:T.DoubleSide,depthWrite:false}));
 halo.position.y=4.2;evac.add(halo);
}
function particles(){
 const arr=[];
 for(let i=0;i<170;i++)arr.push(rnd(-62,62),rnd(.3,10),rnd(-62,62));
 dustPositions=new Float32Array(arr);
 const g=new T.BufferGeometry();g.setAttribute("position",new T.BufferAttribute(dustPositions,3));
 dustCloud=new T.Points(g,new T.PointsMaterial({color:0xffebbd,size:.09,transparent:true,opacity:.46,depthWrite:false}));
 scene.add(dustCloud);
}
function init3d(){
 scene=new T.Scene();scene.background=new T.Color(0x718582);scene.fog=new T.FogExp2(0x85928a,.0102);
 camera=new T.PerspectiveCamera(68,innerWidth/innerHeight,.1,260);
 renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance",alpha:false,stencil:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,isTouch?1.45:1.8));
 renderer.setSize(innerWidth,innerHeight);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 scene.add(new T.HemisphereLight(0xcdece5,0x514b3b,2.1));
 sun=new T.DirectionalLight(0xffd8a3,2.6);sun.position.set(-35,57,-42);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;
 sun.shadow.camera.near=1;sun.shadow.camera.far=180;sun.shadow.bias=-.00035;scene.add(sun);
 const sunball=ball(scene,new T.MeshBasicMaterial({color:0xffdfaf,fog:false}),5,-110,70,-143);sunball.castShadow=false;
 terrain();
 factory(-37,-3,16,19,12,0);factory(-23,26,18,16,11,1);
 factory(16,-31,17,17,13,0);factory(42,-10,18,20,10,1);
 factory(-3,43,14,15,15,0);
 containerObj(-25,-39,4.3,8,.1,0x667066);containerObj(35,8,4.3,9,.15,0x8d6b4e);
 containerObj(-40,39,4.4,8,Math.PI/2,0x64736d);
 junk();makePlayer();
 for(const [x,z,r] of [[-19,-10,0],[14,-7,0],[14,17,1],[-31,35,0],[39,29,1],[-4,4,0],[35,-36,0]])mech(x,z,r);
 [[-29,-22],[-9,18],[24,-3],[25,27],[-22,45]].forEach((a,i)=>cache(a[0],a[1],i));
 extraction();particles();resize();
}
function resize(){
 if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight,false);
}
window.addEventListener("resize",resize);
function collision(x,z){
 if(Math.abs(x)>55||Math.abs(z)>55)return true;
 for(const o of obstacles){
  const dx=Math.max(Math.abs(x-o.x)-o.w/2,0),dz=Math.max(Math.abs(z-o.z)-o.d/2,0);
  if(dx*dx+dz*dz<.57*.57)return true;
 }
 return false;
}
function readInput(){
 let x=stick.x,y=stick.y;
 if(keys["KeyA"]||keys["ArrowLeft"])x-=1;
 if(keys["KeyD"]||keys["ArrowRight"])x+=1;
 if(keys["KeyW"]||keys["ArrowUp"])y+=1;
 if(keys["KeyS"]||keys["ArrowDown"])y-=1;
 const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}return{x,y,l:Math.min(1,l)};
}
function cameraUpdate(dt){
 const fw=V(Math.sin(yaw),0,Math.cos(yaw));
 const right=V(Math.cos(yaw),0,-Math.sin(yaw));
 const at=player.position.clone().add(V(0,1.75,0)).addScaledVector(fw,2.8);
 const target=player.position.clone().add(V(0,2.15,0)).addScaledVector(fw,-6.8).addScaledVector(right,1.25);
 target.y += 2.5 - pitch*5 + camKick;
 camera.position.lerp(target,clamp(dt*9,0,1));
 camera.lookAt(at.addScaledVector(fw,4.8).add(V(0,pitch*8,0)));
 camKick=mix(camKick,0,clamp(dt*10,0,1));
}
function updatePlayer(dt){
 const inp=readInput();
 const speed=((buttons.sprint||keys["ShiftLeft"]||keys["ShiftRight"])?10.5:6.3)*inp.l;
 const fw=V(Math.sin(yaw),0,Math.cos(yaw)),rt=V(Math.cos(yaw),0,-Math.sin(yaw));
 const delta=fw.multiplyScalar(inp.y*speed*dt).addScaledVector(rt,inp.x*speed*dt);
 const nx=player.position.x+delta.x,nz=player.position.z+delta.z;
 if(!collision(nx,player.position.z))player.position.x=nx;
 if(!collision(player.position.x,nz))player.position.z=nz;
 player.rotation.y=mix(player.rotation.y,yaw,clamp(dt*8,0,1));
 char.position.y=Math.sin(elapsed*(speed>0?12:2.1))* (speed>0?.065:.009);
 char.rotation.z=mix(char.rotation.z,-inp.x*.08,dt*6);
 groupWeapon.rotation.x=-pitch*.18;
 cameraUpdate(dt);
}
function shoot(){
 if(mode!=="playing"||reloadTimer>0||shootTimer>0)return;
 if(ammo<=0){reload();return}
 ammo--;shootTimer=.125;camKick=.12;flashMesh.visible=true;flashMesh.material.opacity=1;
 sound(165,.08,"sawtooth",.075,-110);sound(55,.13,"triangle",.08,-25);
 const origin=camera.position.clone(),aim=new T.Vector3();camera.getWorldDirection(aim);
 const from=groupWeapon.localToWorld(V(0,.05,1.22));
 let best=null,bestDist=100,bestAim=0;
 for(const e of baddies){
  if(e.dead)continue;
  const pos=e.g.position.clone().add(V(0,1.72,0)),to=pos.sub(origin);
  const dist=to.length(),dot=to.clone().normalize().dot(aim);
  const assist=isTouch?.965:.989;
  if(dot>assist&&dist<bestDist){best=e;bestDist=dist;bestAim=dot}
 }
 let end=origin.clone().addScaledVector(aim,80);
 if(best){
  const hitPos=best.g.position.clone().add(V(0,1.7,0));
  end=hitPos;best.hp-=(bestAim>.998?32:23);
  best.alert=true;best.cool=Math.min(best.cool,.6);
  hitFeedback=.15;$("crosshair").classList.add("hit");
  sound(500,.045,"square",.025,-180);
  if(best.hp<=0){best.dead=true;scene.remove(best.g);kills++;toast("HOSTILE NEUTRALIZED",1.3);sound(250,.35,"triangle",.05,-200)}
 }
 rayLine(from,end,best?0xfff1ba:0xffdb9c,.85);updateHUD();
}
function reload(){
 if(ammo===30||reserve<=0||reloadTimer>0||mode!=="playing")return;
 reloadTimer=1.65;toast("RELOADING...",1.5);sound(270,.14,"triangle",.03,-90);
}
function tryUse(){
 if(mode!=="playing")return;
 const p=player.position;
 for(const c of crates){
  if(!c.opened&&Math.hypot(c.x-p.x,c.z-p.z)<3.5){
   c.opened=true;c.g.children.forEach((o,i)=>{if(i<2)o.rotation.x=-.32});
   c.halo.visible=false;cores++;collected++;
   const mag=18+Math.round(rnd(0,12));reserve+=mag;
   hp=Math.min(100,hp+18);
   toast("SIGNAL CORE RECOVERED  + AMMO / ARMOR",2);
   sound(550,.28,"sine",.055,500);updateHUD();return;
  }
 }
 if(Math.hypot(p.x-43,p.z-42)<4.5){
  if(cores>=2){endGame(true);return}
  toast("EXTRACTION LOCKED — RECOVER 2 CORES",2);sound(130,.25,"square",.03,-60);return;
 }
}
function aiUpdate(dt){
 for(const e of baddies){
  if(e.dead)continue;
  e.t+=dt;e.cool-=dt;
  const p=player.position,ep=e.g.position;
  const dist=ep.distanceTo(p);
  if(dist<(e.rank?31:26))e.alert=true;
  if(e.alert&&dist<48){
    let dir=Math.atan2(p.x-ep.x,p.z-ep.z);
    e.dir=dir;
    if(dist>8.5){
      const v=e.speed*dt,x=ep.x+Math.sin(dir)*v,z=ep.z+Math.cos(dir)*v;
      if(!collision(x,z)){ep.x=x;ep.z=z}
    }
    if(dist<24&&e.cool<=0){
      e.cool=e.rank?1.6:2.3;
      rayLine(ep.clone().add(V(0,1.85,0)),p.clone().add(V(0,1.75,0)),0xff775d,.7);
      if(Math.random()<(dist<12?.86:.62)){
       const harm=(e.rank?15:9)*(buttons.sprint?.72:1);
       hp=Math.max(0,hp-harm);
       $("damageFlash").style.opacity=".8";setTimeout(()=>$("damageFlash").style.opacity="0",180);
       sound(105,.2,"sawtooth",.045,-70);
       if(hp<=0){endGame(false,"ARMOR INTEGRITY LOST");return}
      }
    }
  }else{
    if(e.t>3.5){e.t=0;e.dir=rnd(-3.14,3.14)}
    const v=e.speed*dt*.28,x=ep.x+Math.sin(e.dir)*v,z=ep.z+Math.cos(e.dir)*v;
    if(ep.distanceTo(e.anchor)<7&&!collision(x,z)){ep.x=x;ep.z=z}
  }
  e.g.rotation.y=e.dir;
  e.g.children[0].position.y=1.68+Math.sin(elapsed*6+e.t)*.045;
  e.g.children[2].material=mats.red;
 }
}
function updateHUD(){
 $("hpVal").textContent=Math.ceil(hp);
 $("hpFill").style.width=hp+"%";
 $("ammo").innerHTML=ammo+' <small>/ '+reserve+"</small>";
 $("resources").textContent="ENCRYPTED CORES: "+Math.min(cores,2)+" / 2";
 $("objective").textContent=cores<2?"RECOVER SIGNAL CORES":"REACH EXTRACTION BEACON";
}
function nearby(){
 const p=player.position;
 for(const c of crates)if(!c.opened&&Math.hypot(c.x-p.x,c.z-p.z)<3.5)return"USE · OPEN SUPPLY CACHE";
 if(Math.hypot(p.x-43,p.z-42)<4.5)return cores>=2?"USE · EXTRACT NOW":"BEACON LOCKED · NEED 2 CORES";
 return "";
}
function updateMinimap(){
 const m=mctx,w=180,h=180,s=180/112;
 m.clearRect(0,0,w,h);
 m.fillStyle="rgba(3,18,22,.93)";m.fillRect(0,0,w,h);
 m.strokeStyle="#769f8b44";m.lineWidth=1;
 for(let i=0;i<=180;i+=30){m.beginPath();m.moveTo(i,0);m.lineTo(i,180);m.moveTo(0,i);m.lineTo(180,i);m.stroke()}
 const px=x=>90+x*s,pz=z=>90-z*s;
 m.strokeStyle="#82c7a969";m.strokeRect(90-55*s,90-55*s,110*s,110*s);
 m.fillStyle="#a5f6d0";
 m.beginPath();m.arc(px(43),pz(42),5,0,Math.PI*2);m.fill();
 for(const c of crates)if(!c.opened){m.fillStyle="#e2c179";m.fillRect(px(c.x)-2.5,pz(c.z)-2.5,5,5)}
 for(const e of baddies)if(!e.dead){m.fillStyle=e.alert?"#ff655e":"#b06d5d";m.beginPath();m.arc(px(e.g.position.x),pz(e.g.position.z),3.2,0,Math.PI*2);m.fill()}
 const x=px(player.position.x),y=pz(player.position.z);
 m.save();m.translate(x,y);m.rotate(-yaw);
 m.fillStyle="#e5fff0";m.beginPath();m.moveTo(0,-8);m.lineTo(-5,5);m.lineTo(5,5);m.closePath();m.fill();m.restore();
}
function endGame(win,reason){
 mode="end";hud.classList.remove("active");controls.classList.remove("active");
 $("endScreen").style.display="flex";
 $("endTitle").textContent=win?"EXTRACTED":"SIGNAL LOST";
 $("endTitle").style.color=win?"#c1f9d5":"#ff927d";
 $("endDetail").textContent=win?"You recovered the encrypted signals and made it out alive. The next mission awaits.":(reason||"The extraction window has closed. Your equipment was lost in the zone.");
 $("endStats").textContent="CORES "+cores+"    /    ROBOTS "+kills+"    /    "+Math.floor((480-timeLeft)/60)+" MIN";
 sound(win?550:140,.5,win?"sine":"sawtooth",.07,win?320:-100);
}
function tick(now){
 requestAnimationFrame(tick);
 const dt=Math.min(.05,(now-(lastTime||now))/1000);lastTime=now;elapsed+=dt;
 if(mode==="playing"){
  timeLeft=Math.max(0,timeLeft-dt);
  if(timeLeft<=0)endGame(false,"THE EXTRACTION WINDOW HAS CLOSED");
  updatePlayer(dt);aiUpdate(dt);
  shootTimer=Math.max(0,shootTimer-dt);
  if(reloadTimer>0){
   reloadTimer-=dt;
   if(reloadTimer<=0){const n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;updateHUD();sound(400,.1,"triangle",.04,-80)}
  }
  if((keys["MouseFire"]||buttons.fire||keys["Space"])&&shootTimer<=0)shoot();
  hitFeedback-=dt;if(hitFeedback<=0)$("crosshair").classList.remove("hit");
  flashMesh.visible=shootTimer>.07&&shootTimer<.125;
  const text=nearby();$("interactHint").style.display=text?"block":"none";$("interactHint").textContent=text;
  $("timer").textContent=String(Math.floor(timeLeft/60)).padStart(2,"0")+":"+String(Math.floor(timeLeft%60)).padStart(2,"0");
  $("timer").classList.toggle("warning",timeLeft<60);
  for(const c of crates){c.halo.rotation.z+=dt*.5;if(!c.opened)c.halo.material.opacity=.40+Math.sin(elapsed*2+c.phase)*.18}
  evac.userData.ring.material.opacity=.35+Math.sin(elapsed*2)*.2;
  if(elapsed-mapTick>.1){updateMinimap();mapTick=elapsed}
 }else if(mode==="menu"){char.position.y=Math.sin(elapsed*2)*.013;cameraUpdate(dt)}
 for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.age+=dt;
   if(e.age>=e.life){scene.remove(e.obj);e.obj.geometry.dispose();e.material.dispose();effects.splice(i,1)}
   else e.material.opacity=1-e.age/e.life;
 }
 renderer.render(scene,camera);
 // Dynamic scaling avoids heavy mobile frame-time spirals.
 if(mode==="playing"&&isTouch){frameAccum+=dt;if(elapsed>7&&Math.floor(elapsed)%8===0&&frameAccum>4){
   frameAccum=0;
 }}
}
function bind(){
 document.addEventListener("keydown",e=>{
   if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();
   keys[e.code]=true;
   if(e.code==="KeyE")tryUse();
   if(e.code==="KeyR")reload();
 });
 document.addEventListener("keyup",e=>keys[e.code]=false);
 canvas.addEventListener("pointerdown",e=>{
   if(mode!=="playing"||isTouch)return;
   if(e.button===0){keys.MouseFire=true}
   look.pointer=e.pointerId;look.x=e.clientX;look.y=e.clientY;
 });
 window.addEventListener("pointerup",e=>{keys.MouseFire=false;if(look.pointer===e.pointerId)look.pointer=null});
 window.addEventListener("pointermove",e=>{
  if(mode!=="playing"||isTouch||look.pointer!==e.pointerId)return;
  yaw+=clamp(e.clientX-look.x,-50,50)*.005;
  pitch=clamp(pitch-(e.clientY-look.y)*.003,-.40,.38);
  look.x=e.clientX;look.y=e.clientY;
 });
 function padMove(e){
   const r=$("pad").getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
   const x=clamp((e.clientX-cx)/(r.width*.33),-1,1),y=clamp((cy-e.clientY)/(r.height*.33),-1,1);
   const n=Math.max(1,Math.hypot(x,y));stick.x=x/n;stick.y=y/n;
   $("stick").style.transform="translate("+(stick.x*34)+"px,"+(-stick.y*34)+"px)";
 }
 $("pad").addEventListener("pointerdown",e=>{e.preventDefault();stick.pointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);padMove(e)});
 $("pad").addEventListener("pointermove",e=>{if(stick.pointer===e.pointerId)padMove(e)});
 function releasePad(e){if(stick.pointer!==e.pointerId)return;stick.pointer=null;stick.x=stick.y=0;$("stick").style.transform="translate(0,0)"}
 $("pad").addEventListener("pointerup",releasePad);$("pad").addEventListener("pointercancel",releasePad);
 const l=$("lookArea");
 l.addEventListener("pointerdown",e=>{look.pointer=e.pointerId;look.x=e.clientX;look.y=e.clientY;l.setPointerCapture(e.pointerId)});
 l.addEventListener("pointermove",e=>{
   if(mode!=="playing"||look.pointer!==e.pointerId)return;
   yaw+=clamp(e.clientX-look.x,-50,50)*.007;
   pitch=clamp(pitch-(e.clientY-look.y)*.005,-.40,.36);
   look.x=e.clientX;look.y=e.clientY;
 });
 function releaseLook(e){if(look.pointer===e.pointerId)look.pointer=null}
 l.addEventListener("pointerup",releaseLook);l.addEventListener("pointercancel",releaseLook);
 function hold(id,key){
   const el=$(id);
   el.addEventListener("pointerdown",e=>{e.preventDefault();el.setPointerCapture(e.pointerId);buttons[key]=true;el.classList.add("pressed");if(key==="fire")shoot()});
   const stop=()=>{buttons[key]=false;el.classList.remove("pressed")};
   el.addEventListener("pointerup",stop);el.addEventListener("pointercancel",stop);
 }
 hold("fire","fire");hold("sprint","sprint");
 $("reload").addEventListener("pointerdown",e=>{e.preventDefault();reload()});
 $("use").addEventListener("pointerdown",e=>{e.preventDefault();tryUse()});
 $("startBtn").onclick=()=>{
   mode="playing";menu.style.display="none";hud.classList.add("active");
   if(isTouch)controls.classList.add("active");
   timeLeft=480;updateHUD();sound(380,.3,"triangle",.06,210);
   toast("LOCATE TWO CORES. REACH EXTRACTION.",3);
   try{if(isTouch&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})}catch(e){}
 };
 $("restartBtn").onclick=()=>location.reload();
 document.addEventListener("contextmenu",e=>e.preventDefault());
 document.addEventListener("visibilitychange",()=>{lastTime=performance.now()});
}
try{
 init3d();bind();loading.style.display="none";menu.style.display="flex";
 camera.position.set(-48,5,-47);cameraUpdate(1);
 requestAnimationFrame(tick);
}catch(e){loading.style.display="grid";loading.textContent="ERROR INITIALIZING 3D: "+String(e.message||e);console.error(e)}
