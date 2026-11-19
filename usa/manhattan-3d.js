import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const clamp=THREE.MathUtils.clamp;

export function createManhattan3D(host){
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.prepend(renderer.domElement);
  const help=host.querySelector('#flight-help');
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x98abc7,.0045);
  const camera=new THREE.PerspectiveCamera(55,1,.25,650);
  const ambient=new THREE.HemisphereLight(0xe1ecff,0x827080,2.15);
  const sun=new THREE.DirectionalLight(0xffdfae,2.1);
  sun.position.set(-40,65,35);
  scene.add(ambient,sun);

  const cube=new THREE.BoxGeometry(1,1,1);
  const materials=new Map();
  function material(color){
    if(!materials.has(color)) materials.set(color,new THREE.MeshLambertMaterial({color}));
    return materials.get(color);
  }
  function box(parent,x,y,z,w,h,d,color){
    const mesh=new THREE.Mesh(cube,typeof color==='number'?material(color):color);
    mesh.position.set(x,y,z);
    mesh.scale.set(w,h,d);
    parent.add(mesh);
    return mesh;
  }

  const water=material(0x3b657d);
  box(scene,0,-2,0,550,2,550,water);
  box(scene,0,0,-17,150,2,67,0x677c70);
  const road=0x4a5064;
  for(let x=-70;x<=70;x+=10) box(scene,x,1.03,-17,.9,.06,66,road);
  for(let z=-47;z<=15;z+=9) box(scene,0,1.04,z,149,.06,1.35,road);
  box(scene,0,1.07,15,148,.08,2.6,0xa38b83);

  // One batched set of lit windows serves both the background and landmark towers.
  const windows=[];
  function tower(x,z,w,d,height,color,base=1){
    box(scene,x,base+height/2,z,w,height,d,color);
    box(scene,x,base+height,z,w+.25,.5,d+.25,0xb2a4ab);
    for(let y=base+2;y<base+height-1;y+=2.45){
      for(let column=x-w/2+1.15;column<x+w/2-.7;column+=1.55){
        windows.push([column,y,z+d/2+.04,.62,.86,.11]);
      }
      for(let column=z-d/2+1.15;column<z+d/2-.7;column+=1.55){
        windows.push([x+w/2+.04,y,column,.11,.86,.62]);
      }
    }
  }
  const palette=[0x756c81,0x9c8c95,0x777c98,0xb0a0a1,0x746a80];
  for(let row=0;row<6;row++) for(let col=0;col<14;col++){
    const x=col*10-65,z=row*9-43;
    if((row<=2 && col<4) || (row===4 && [3,7,9].includes(col))) continue;
    const seed=(col*73+row*53)%107;
    tower(x,z,5+seed%3,5,6+seed%13+Math.max(0,10-Math.abs(x)*.15),palette[seed%5]);
  }
  // Empire State Building, Chrysler Building and One World Trade Center.
  tower(5,-7,9,7,26,0xc1aaa9); tower(5,-7,6,5,8,0xd9c4b8,27);
  tower(5,-7,3,3,5,0xe9d8c7,35); box(scene,5,43,-7,.23,8,.23,0xffe3b8);
  tower(25,-7,7,6,26,0x9597aa);
  for(let i=0;i<5;i++) box(scene,25,27+i*1.4,-7,7-i*1.25,1.7,6-i*1.05,0xd9dceb);
  box(scene,25,37,-7,.22,7,.22,0xe2e8f5);
  tower(-35,-7,8,8,33,0x7394af);
  const crown=new THREE.Mesh(new THREE.CylinderGeometry(2.5,5.2,8,4),material(0x9eb9c9));
  crown.position.set(-35,38,-7); crown.rotation.y=Math.PI/4; scene.add(crown);
  box(scene,-35,46,-7,.3,9,.3,0xeaf4ff);
  const pane=new THREE.MeshBasicMaterial({color:0xa0b4c6});
  const windowMesh=new THREE.InstancedMesh(cube,pane,windows.length);
  const dummy=new THREE.Object3D();
  windows.forEach(([x,y,z,w,h,d],index)=>{
    dummy.position.set(x,y,z); dummy.scale.set(w,h,d); dummy.updateMatrix();
    windowMesh.setMatrixAt(index,dummy.matrix);
    windowMesh.setColorAt(index,new THREE.Color(index%5===0?0x665678:index%3===0?0xffdfaa:0xbad2e6));
  });
  scene.add(windowMesh);

  // East River crossing with a stone bridge, suspension cables and the 7 train.
  const bridgeX=49;
  box(scene,bridgeX,4,35,6,.8,54,0x6d6578);
  for(const z of [24,48]){
    for(const x of [46,52]) box(scene,x,6,z,1.7,15,1.9,0xa29098);
    box(scene,49,12,z,7,.8,1.9,0xb1a2a7);
  }
  for(const x of [46,52]){
    const points=[];
    for(let z=13;z<=60;z+=1){
      const y=z<24?5+(z-13)*.72:z>48?13-(z-48)*.69:8+5*((z-36)/12)**2;
      points.push(new THREE.Vector3(x,y,z));
      if(z%3===0) box(scene,x,(y+4.4)/2,z,.1,Math.max(.1,y-4.4),.1,0x9585a0);
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xd0bec7})));
  }
  box(scene,0,3,12,155,.43,2,0x4d5668);
  for(let x=-72;x<75;x+=9) box(scene,x,2.1,12,.5,2,.6,0x777c8d);
  const train=new THREE.Group();
  for(let car=0;car<3;car++){
    box(train,-car*5.4,3.9,12,5,1.3,1.35,0xb9c5d6);
    for(let x=-2;x<=2;x++) box(train,x-car*5.4,4.13,12.69,.55,.39,.07,0xffc688);
  }
  scene.add(train);

  const plane=new THREE.Group();
  box(plane,0,0,0,1.05,.62,4.7,0xf1e9db);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.53,1.15,12),material(0xf1e9db));
  nose.rotation.x=-Math.PI/2; nose.position.z=-2.85; plane.add(nose);
  box(plane,0,.34,-.88,.8,.36,1.25,0x304b66);
  box(plane,0,-.11,.04,7.8,.13,1.08,0xe2ac66);
  box(plane,0,.75,1.77,.16,1.18,.85,0xe2ac66);
  box(plane,0,.22,1.7,2.4,.13,.58,0xf1e9db);
  scene.add(plane);

  const checkpoints=[
    {name:'Lower Manhattan',x:-33,y:24,z:28},
    {name:'Midtown',x:8,y:29,z:5},
    {name:'East River',x:56,y:20,z:39}
  ];
  const ring=new THREE.Mesh(new THREE.TorusGeometry(6,.23,8,48),new THREE.MeshBasicMaterial({color:0xffce78}));
  scene.add(ring);
  const position=new THREE.Vector3(-57,26,67);
  const look=new THREE.Vector3();
  const sky=new THREE.Color(), day=new THREE.Color(0x9bbcdc), night=new THREE.Color(0x131d3c);
  const sunset=new THREE.Color(0xe5a495);
  const litWindows=new THREE.Color(0xffd993);
  let heading=.54,pitch=0,bank=0,speed=18,lastTime=null,next=0,completed=false;
  const keys=new Set();
  let pointer=null,dragX=0,dragY=0;
  const controls=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d','+','=','-','r']);
  function reset(){
    position.set(-57,26,67); heading=.54; pitch=bank=0; speed=18; next=0; completed=false;
  }
  host.addEventListener('keydown',event=>{
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(!controls.has(key)) return;
    event.preventDefault();
    if(key==='r') reset();
    else if(key==='+' || key==='=') speed=Math.min(34,speed+2);
    else if(key==='-') speed=Math.max(9,speed-2);
    else keys.add(key);
  });
  host.addEventListener('keyup',event=>keys.delete(event.key.length===1?event.key.toLowerCase():event.key));
  host.addEventListener('blur',()=>{keys.clear();pointer=null;dragX=dragY=0;});
  host.addEventListener('pointerdown',event=>{
    host.focus({preventScroll:true});
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY};
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove',event=>{
    if(!pointer || pointer.id!==event.pointerId) return;
    dragX=clamp((event.clientX-pointer.x)/70,-1,1);
    dragY=clamp((pointer.y-event.clientY)/70,-1,1);
  });
  host.addEventListener('lostpointercapture',()=>{pointer=null;dragX=dragY=0;});

  let width=0,height=0;
  return {draw(time,phase,blend){
    const nextWidth=host.clientWidth,nextHeight=host.clientHeight;
    if(!nextWidth||!nextHeight) return;
    if(width!==nextWidth||height!==nextHeight){
      width=nextWidth; height=nextHeight;
      renderer.setSize(width,height,false);
      camera.aspect=width/height; camera.updateProjectionMatrix();
    }
    const dt=lastTime===null?0:clamp(time-lastTime,0,.055);
    lastTime=time;
    const steer=clamp(dragX+Number(keys.has('ArrowRight')||keys.has('d'))-Number(keys.has('ArrowLeft')||keys.has('a')),-1,1);
    const climb=clamp(dragY+Number(keys.has('ArrowUp')||keys.has('w'))-Number(keys.has('ArrowDown')||keys.has('s')),-1,1);
    heading+=steer*dt*1.2;
    pitch=THREE.MathUtils.lerp(pitch,climb*.42,Math.min(1,dt*5));
    bank=THREE.MathUtils.lerp(bank,-steer*.48,Math.min(1,dt*5));
    position.x+=Math.sin(heading)*Math.cos(pitch)*speed*dt;
    position.z-=Math.cos(heading)*Math.cos(pitch)*speed*dt;
    position.y=clamp(position.y+Math.sin(pitch)*speed*dt,9,78);
    // Keep Manhattan within reach with a gradual turn near the edge of the map.
    const distance=Math.hypot(position.x,position.z);
    if(distance>115){
      const inward=Math.atan2(-position.x,position.z);
      heading+=Math.atan2(Math.sin(inward-heading),Math.cos(inward-heading))*dt*.9;
    }
    plane.position.copy(position);
    plane.rotation.set(pitch,-heading,bank,'YXZ');
    camera.position.set(position.x-Math.sin(heading)*13,position.y+5,position.z+Math.cos(heading)*13);
    look.set(position.x+Math.sin(heading)*15,position.y-.4,position.z-Math.cos(heading)*15);
    camera.lookAt(look);
    const checkpoint=checkpoints[next];
    ring.visible=!completed;
    if(!completed){
      ring.position.set(checkpoint.x,checkpoint.y,checkpoint.z);
      ring.rotation.y=-heading;
      if(ring.position.distanceTo(position)<6){
        if(next===checkpoints.length-1) completed=true;
        else next++;
      }
    }
    const instruction='Drag or use arrows to fly · + / − throttle';
    const status=completed?'Tour complete · R to restart':`Fly through the gold ring · ${checkpoints[next].name} (${next+1}/${checkpoints.length})`;
    const label=`${status}  |  ${instruction}`;
    if(help.textContent!==label) help.textContent=label;
    train.position.x=(time*7)%174-82;
    sky.copy(day).lerp(sunset,(1-Math.abs(Math.sin(phase*Math.PI*2)))*.7).lerp(night,blend);
    scene.background=sky; scene.fog.color.copy(sky);
    ambient.intensity=2.15-.95*blend; sun.intensity=2.1*(1-blend);
    pane.color.set(0x98aabc).lerp(litWindows,blend);
    renderer.render(scene,camera);
  }};
}
