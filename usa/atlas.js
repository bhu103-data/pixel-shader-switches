'use strict';

const foliage = [['#50734b','#78975b','#bed17d'],['#245447','#367951','#76a459'],['#703d47','#ae5945','#e1a055'],['#43596d','#708ba2','#cddcea']];
const state = {region:'ny',season:0,night:false};
const $ = selector => document.querySelector(selector);
const canvas = $('#twilight');
const nightCanvas = $('#night');
let ctx;

function rect(x,y,w,h,color){
  ctx.fillStyle=color;
  ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}
function pixels(points,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
  ctx.fill();
}
function line(x,y,xx,yy,color){
  const steps=Math.max(Math.abs(xx-x),Math.abs(yy-y),1);
  for(let i=0;i<=steps;i++) rect(x+(xx-x)*i/steps,y+(yy-y)*i/steps,1,1,color);
}
function rng(seed){
  return () => {
    seed = (Math.imul(seed,1664525)+1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function mix(a,b,t){
  const rgb=(n,shift)=>(n>>shift)&255;
  return 'rgb('+[16,8,0].map(shift=>Math.round(rgb(a,shift)*(1-t)+rgb(b,shift)*t)).join(',')+')';
}
const twilightPalettes={
  ny:[[0x494d7b,0xe9a9a5],[0x455490,0xffbf7f],[0x3b3d69,0xf0a370],[0x354772,0xb595b8]],
  ak:[[0x334c77,0xa0c0cc],[0x364d7b,0xe8b6a5],[0x243b68,0xbca1b6],[0x2c426b,0x93b6d1]],
  lv:[[0x4e4a79,0xf1ad91],[0x4c426e,0xffb777],[0x563b65,0xe4a07d],[0x41436b,0xdeb1ac]]
};
const daylightPalettes={ny:['#467db4','#f8d6ba'],ak:['#477fae','#c8e4e4'],lv:['#557cad','#f9cca7']};
function sky(){
  const alaska=state.region==='ak';
  const nightHorizon = [0x3d3b59,0x393153,0x343453,0x38506c];
  const palettes = state.night ? [0x0a1029,nightHorizon[state.season]] : twilightPalettes[state.region][state.season];
  for(let y=0;y<100;y+=2) rect(0,y,320,2,mix(...palettes,y/100));
  const random=rng(86);
  if(state.night){
    for(let i=0;i<120;i++) rect(random()*319,random()*73,1,1,i%6===0?'#e7eeeb':'#777c9c');
  }else{
    for(let i=0;i<26;i++){
      const x=random()*320,y=10+random()*59;
      rect(x,y,7+random()*24,1,alaska?'#7b83a1':'#9b6c80');
      rect(x+8,y+2,12+random()*26,1,alaska?'#8987a2':'#bc8188');
    }
  }
}
function daylight(offset){
  const top=-offset/2;
  const gradient=ctx.createLinearGradient(0,top,0,96);
  const [zenith,horizon]=daylightPalettes[state.region];
  gradient.addColorStop(0,zenith);
  gradient.addColorStop(1,horizon);
  ctx.save();
  ctx.globalAlpha=.86*smooth(Math.sin(skyPhase*2*Math.PI));
  rect(0,top,320,144-top,gradient);
  ctx.restore();
}
function celestialBody(phase){
  const moon=phase>=.5;
  const crossing=(phase%.5)*2;
  // East is on the right. The arc starts and ends below the visible horizon.
  const cx=Math.round(285-250*crossing);
  const cy=Math.round(108-(moon?86:88)*Math.sin(Math.PI*crossing));
  const radius=moon?10:14;
  for(let row=-radius;row<radius;row++){
    const y=row+.5;
    const edge=Math.sqrt(radius*radius-y*y);
    let left=-edge;
    // An offset round shadow leaves the Moon's lit limb and curved inner edge.
    const shadowY=y+2;
    if(moon && Math.abs(shadowY)<radius){
      left=Math.max(left,-4+Math.sqrt(radius*radius-shadowY*shadowY));
    }
    const first=Math.ceil(left-.5),last=Math.floor(edge-.5);
    const color=moon?mix(0xf7f6e5,0xc5d9eb,(row+radius)/(2*radius))
      :mix(0xfff4c0,0xffb876,(row+radius)/(2*radius));
    if(first<=last) rect(cx+first,cy+row,last-first+1,1,color);
  }
}
function aurora(time){
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(320,0);
  for(const [x,y] of reversedMountainRidge) ctx.lineTo(x,y);
  ctx.closePath();
  ctx.clip();
  for(let x=0;x<320;x+=2){
    const wave=x/51+time*.24;
    const y=19+9*Math.sin(wave)+4*Math.sin(x/17-time*.37);
    const height=8+7*Math.sin(x/34+time*.17)**2;
    ctx.globalAlpha=.13+.23*Math.sin(wave)**2;
    rect(x,y+2,2,height,'#4ddab3');
    ctx.globalAlpha*=.55;
    rect(x,y+height,2,7,'#8f83e9');
    ctx.globalAlpha=.42+.23*Math.sin(wave)**2;
    rect(x,y,2,2,'#a2f5c8');
  }
  ctx.restore();
}
function skyline(y,seed,front){
  const random=rng(seed);
  for(let x=-6;x<320;){
    const w=6+Math.floor(random()*13),h=8+Math.floor(random()*(front?40:26));
    const color=front?(state.night?'#192239':'#37354a'):(state.night?'#252e49':'#605069');
    rect(x,y-h,w,h,color);
    if(w>14){rect(x+3,y-h-4,w-6,4,color);rect(x+Math.floor(w/2),y-h-10,1,6,color);}
    for(let wy=y-h+3;wy<y-1;wy+=4) for(let wx=x+2;wx<x+w-1;wx+=3){
      if(random()>.54) rect(wx,wy,1,2,state.night?(random()>.4?'#ffd187':'#67b8d3'):'#876276');
    }
    x+=w+2;
  }
}
function water(y,ice=false){
  const random=rng(28);
  for(let row=y;row<144;row++){
    rect(0,row,320,1,mix(state.night?0x333451:0x756174,0x172735,(row-y)/(144-y)));
  }
  for(let i=0;i<410;i++){
    const x=random()*320,row=y+random()*(144-y),width=2+random()*14;
    const reflect=Math.abs(x-246)<(row-y)*1.7 && i%3===0;
    rect(x,row,width,1,ice?(i%4===0?'#9dcdd2':'#557986'):reflect?(state.night?'#978675':'#bb8b76'):(i%3===0?'#51526a':'#3e4359'));
  }
}
function tree(x,y,h,random,pine=false){
  const tones=foliage[state.season];
  rect(x-1,y-h+3,2,h,'#463e44');
  if(pine){
    for(let dy=3;dy<h-2;dy+=2){
      const w=Math.ceil(dy*.33);
      rect(x-w,y-h+dy,w*2+1,3,tones[0]);
      rect(x-w,y-h+dy,Math.ceil(w*.85),1,state.season===3?tones[2]:tones[1]);
    }
  }else{
    const r=h*.36;
    for(let i=0;i<24;i++){
      const angle=random()*Math.PI*2,d=random()*r;
      rect(x+Math.cos(angle)*d-r*.28,y-h*.69+Math.sin(angle)*d-r*.28,r*.75,r*.65,tones[i%3]);
    }
  }
}
const mountainRidge=[[0,88],[19,66],[39,56],[53,63],[82,43],[105,58],[144,25],[165,31],[179,49],[198,57],[214,39],[244,67],[280,50],[320,71]];
const reversedMountainRidge=[...mountainRidge].reverse();
function mountains(glacier){
  pixels([...mountainRidge,[320,101],[0,101]],state.night?'#4b5d7c':'#78859a');
  pixels([[39,56],[53,63],[82,43],[105,58],[144,25],[165,31],[179,49],[198,57],[214,39],[228,52],[213,48],[202,66],[171,57],[156,56],[151,45],[133,52],[119,70],[107,66],[93,73],[79,57],[63,67]],state.night?'#94adc3':'#e6edf0');
  pixels([[144,25],[165,31],[179,49],[198,57],[169,56],[154,44],[152,58],[139,50]],state.night?'#718faa':'#acc5d3');
  if(glacier){
    pixels([[102,89],[125,68],[146,57],[160,56],[169,68],[196,81],[210,104],[99,105]],'#81becb');
    const random=rng(51);
    for(let i=0;i<75;i++){
      const y=62+random()*42,x=149+(random()-.48)*(y-58)*2;
      rect(x,y,2+random()*5,1,i%3===0?'#d1f4ee':'#4d96ad');
    }
  }else{
    pixels([[0,96],[49,81],[84,90],[119,80],[143,89],[199,83],[245,93],[285,77],[320,84],[320,144],[0,144]],foliage[state.season][0]);
  }
}
function train(offset, night){
  const metal = night ? '#8498b1' : '#c7cbd0';
  const edge = night ? '#414f68' : '#82818d';
  const glass = night ? '#f9c982' : '#41576d';
  for(const x of [offset,offset+85,offset+170]){
    rect(x+3,54,76,3,edge);
    rect(x,57,81,26,metal);
    rect(x,80,81,3,edge);
    for(let door=x+10;door<x+70;door+=18){
      rect(door,62,12,14,edge);
      rect(door+1,64,10,7,glass);
    }
    rect(x+1,59,79,2,'#dee0df');
    rect(x+33,58,15,1,night?'#d6b5a0':'#aeb4bc');
    rect(x+39,59,5,1,night?'#ffe3a2':'#5e6572');
    rect(x+43,60,1,3,night?'#ffe3a2':'#5e6572');
    rect(x+7,83,12,3,'#151922');
    rect(x+59,83,12,3,'#151922');
    rect(x+4,58,3,1,night?'#ffd889':'#e7b76e');
    rect(x+73,58,3,1,night?'#ffd889':'#e7b76e');
    for(const wheel of [x+15,x+66]){
      rect(wheel,84,5,2,'#222432');
      rect(wheel+1,84,2,1,night?'#7489a4':'#6d7180');
    }
  }
  rect(offset+237,60,11,16,'#304567');
  rect(offset+240,63,5,4,'#7ea5e2');
  rect(offset+241,76,4,3,'#fff1ad');
}

function moose(step,drink,moving){
  const coat='#754836';
  const antler='#c0a084';
  rect(120,95,54,22,coat);
  for(const [i,x] of [124,136,158,170].entries()){
    const stride=Math.round(Math.sin(step+i*Math.PI/2)*4*moving);
    pixels([[x,112],[x+5,112],[x+stride+4,128],[x+stride-1,128]],i%2?'#583b32':coat);
    rect(x+stride-1,127,5,2,'#382b33');
  }
  ctx.save();
  ctx.translate(158,99);
  ctx.rotate(drink*.71);
  ctx.translate(-158,-99);
  pixels([[154,99],[161,79],[173,74],[181,79],[176,91],[174,114]],coat);
  rect(172,77,18,10,coat);
  rect(185,83,9,8,coat);
  rect(187,86,8,4,'#48353c');
  rect(182,80,2,2,'#1e1820');
  rect(161,72,9,4,coat);
  line(174,78,173,60,antler);
  line(179,78,188,59,antler);
  pixels([[173,68],[163,62],[154,52],[159,51],[167,58],[165,48],[170,50],[174,60],[179,51],[181,56],[177,69]],antler);
  pixels([[182,65],[186,54],[190,43],[193,45],[190,54],[199,47],[201,49],[195,57],[201,56],[199,60],[192,65]],antler);
  ctx.restore();
}

function bear(reach){
  const fur='#805743';
  pixels([[124,101],[132,86],[152,82],[162,88],[172,91],[171,104],[164,113],[130,113]],fur);
  rect(137,108,6,12,fur);
  rect(154,106,6,13,fur);
  limb([167,106],[174-reach*7,118-reach*8],6,fur);
  const dip=reach*5;
  pixels([[161,90],[169,82+dip],[180,85+dip],[191,94+dip],[185,103+dip],[172,102+dip],[168,107]],fur);
  rect(175,81+dip,5,6,fur);
  rect(183,91+dip,2,2,'#282331');
  rect(188,94+dip,5,3,'#392c35');
}

function transformed(x,y,scale,draw) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  draw();
  ctx.restore();
}

function liberty(){
  const copper=state.night?'#63a88f':'#87bca0';
  const light=state.night?'#9fd5ad':'#c1d3ac';
  const shade=state.night?'#2a625e':'#477f70';
  const stone=state.night?'#777588':'#aaa29e';
  const stoneLight=state.night?'#a5a5b4':'#c9bbb7';
  pixels([[17,114],[22,109],[55,109],[61,114]],'#524f63');
  rect(21,108,36,3,stone);
  rect(25,104,28,4,'#746b77');
  pixels([[29,95],[49,95],[51,104],[27,104]],stone);
  pixels([[46,96],[49,96],[51,104],[46,104]],'#676471');
  rect(29,102,5,1,stoneLight);
  rect(29,106,22,1,stoneLight);
  rect(22,108,34,1,stoneLight);
  rect(25,112,31,1,'#8a8391');
  rect(36,97,6,7,'#686575');
  rect(37,98,4,6,'#514b60');
  rect(26,94,26,2,stoneLight);
  if(state.season===3){
    rect(26,94,5,1,'#f0f4f3');
    rect(49,94,3,1,'#f0f4f3');
    rect(22,108,10,1,'#dbe8ee');
    rect(45,108,11,1,'#dbe8ee');
  }
  // The heavy robe hangs to the ankles, with one foot showing beside the chain.
  rect(33,92,6,2,shade);
  rect(44,92,5,2,copper);
  rect(49,93,2,1,'#5c6770');
  rect(52,92,2,1,'#5c6770');
  pixels([[34,64],[41,62],[46,64],[48,68],[46,77],[48,85],[51,92],[45,93],[40,92],[36,93],[28,92],[32,83],[33,73]],shade);
  pixels([[35,65],[40,63],[44,64],[46,68],[43,76],[43,82],[46,90],[43,92],[39,90],[36,92],[30,91],[34,82]],copper);
  // A broad fold crosses the torso then drops into long, uneven pleats.
  pixels([[35,65],[39,64],[39,68],[43,71],[46,71],[44,74],[40,73],[35,70]],light);
  pixels([[35,71],[40,74],[44,75],[42,77],[38,76],[34,74]],shade);
  pixels([[38,75],[40,76],[38,82],[37,88],[35,91],[33,91],[35,85]],light);
  pixels([[40,77],[42,77],[41,85],[42,91],[39,90],[39,84]],shade);
  pixels([[44,77],[45,81],[46,86],[49,91],[47,92],[44,88],[43,83]],light);
  line(33,86,31,91,shade);
  // Her raised right arm holds the torch, the other supports the tablet.
  pixels([[35,69],[29,60],[25,48],[22,43],[23,38],[26,39],[28,47],[31,53],[39,63]],shade);
  pixels([[24,42],[26,45],[30,55],[37,64],[34,66],[29,59],[26,50]],copper);
  rect(22,34,4,7,copper);
  rect(23,36,2,4,light);
  rect(20,32,8,2,shade);
  rect(21,34,6,1,light);
  pixels([[21,32],[19,27],[21,25],[22,28],[24,22],[26,26],[29,28],[27,31],[26,32]],'#da8d43');
  pixels([[22,31],[23,27],[24,24],[25,27],[27,29],[25,32]],'#ffcd74');
  rect(24,28,1,3,'#fff3c3');
  rect(38,58,6,7,copper);
  pixels([[36,55],[38,51],[43,51],[46,54],[45,60],[42,62],[38,60]],shade);
  pixels([[38,54],[44,54],[44,58],[42,60],[39,59]],copper);
  rect(39,55,1,1,shade);
  rect(42,55,1,1,shade);
  rect(41,56,1,2,light);
  rect(40,59,3,1,shade);
  const rays=[[30,50],[32,45],[36,43],[40,41],[44,43],[48,45],[51,50]];
  rays.forEach(([x,y],i)=>line(35+i*1.8,52,x,y,light));
  rect(34,51,13,3,shade);
  rect(35,51,11,1,light);
  for(let x=36;x<46;x+=3) rect(x,52,1,1,copper);
  pixels([[42,67],[48,64],[52,76],[45,81]],shade);
  pixels([[44,68],[48,66],[51,76],[46,78]],copper);
  line(44,68,48,66,light);
  line(45,70,46,74,shade);
  line(47,70,48,73,shade);
  pixels([[48,75],[50,77],[46,80],[42,77]],light);
}

function bridgeTower(x,bottom){
  rect(x,64,9,bottom-64,'#a295a3');
  rect(x+3,71,3,bottom-71,'#413d53');
  rect(x-1,64,11,3,'#bbb0b4');
}

function nyLandscape(){
  skyline(95,172,false);
  skyline(97,110,true);
  const tower=state.night?'#252b42':'#51495d';
  const limestone=state.night?'#62637c':'#b19398';
  const steel=state.night?'#9baaca':'#e3c9c2';
  const window=state.night?'#ffce87':'#76596e';
  // Empire State Building: setbacks, observation deck and broadcast mast.
  rect(141,48,24,48,tower);
  rect(145,39,17,54,limestone);
  rect(149,32,9,10,limestone);
  rect(150,28,6,5,steel);
  rect(152,21,1,8,steel);
  rect(147,37,13,2,steel);
  for(let y=43;y<93;y+=4) for(const x of [147,151,155,159]){
    rect(x,y,1,2,(x+y)%7===0?tower:window);
  }
  // Chrysler Building: stainless-steel crown and dark triangular insets.
  rect(174,54,15,41,tower);
  pixels([[174,54],[175,49],[178,46],[180,41],[181,36],[183,41],[185,46],[188,49],[189,54]],steel);
  rect(181,30,1,8,steel);
  for(const [x,y] of [[181,42],[178,48],[183,48],[176,52],[181,52],[186,52]]) rect(x,y,2,1,tower);
  for(let y=57;y<92;y+=4) for(const x of [177,181,185]) rect(x,y,1,2,window);
  // One World Trade Center: tapered glass faces and antenna.
  pixels([[248,95],[251,45],[263,45],[268,95]],state.night?'#374863':'#728ca0');
  pixels([[251,45],[263,45],[257,95],[248,95]],state.night?'#4d6483':'#a0a6b1');
  rect(256,34,1,11,steel);
  for(let y=49;y<90;y+=4) rect(253,y,8,1,state.night?'#8395af':'#bdacb5');
  water(95);
  // One shore curves from the park through Midtown into the river.
  pixels([[0,109],[28,98],[61,101],[105,104],[135,98],[171,99],[185,107],[213,114],[203,144],[0,144]],foliage[state.season][0]);
  const random=rng(72);
  for(let i=0;i<27;i++) tree(random()*83,109+random()*11,6+random()*10,random);
  liberty();
  for(const [x,y,h] of [[75,45,48],[232,47,48]]){
    rect(x-6,y,14,h,tower);
    rect(x-4,y-2,10,2,'#a58b9d');
    for(let row=y+4;row<y+h-2;row+=5){
      rect(x-3,row,2,2,state.night?'#edbf85':'#9a7788');
      rect(x+3,row,2,2,state.night?'#f5ca91':'#9a7788');
    }
  }
  const bridge='#a295a3';
  rect(191,91,129,4,'#51495d');
  for(const x of [213,283]) bridgeTower(x,105);
  for(let x=192;x<320;x++){
    const s=x<213?(213-x)/21:x<283?Math.sin((x-213)/70*Math.PI):(x-283)/37;
    const y=65+Math.floor(24*s);
    rect(x,y,1,1,bridge);
    if(x%4===0) rect(x,y,1,Math.max(1,91-y),bridge);
    if(state.night && x%5===0) rect(x,91,1,1,'#ffd08e');
  }
  for(const [x,y,w,h,color] of [[91,68,17,29,'#ea558a'],[111,76,14,22,'#66b9db'],[129,64,15,31,'#e8a970'],[162,72,16,24,'#9c79dc']]){
    rect(x-2,y-2,w+4,h+8,tower);
    rect(x,y,w,h,color);
    rect(x+2,y+4,w-4,3,'#f1d7e6');
    rect(x+2,y+11,w*.65,2,'#f1d7e6');
  }
  pixels([[82,123],[132,96],[167,96],[200,123]],'#43404d');
  rect(124,104,16,5,'#eab34e');
  rect(128,101,8,4,'#eab34e');
  rect(130,102,5,2,'#5b5f6e');
  for(const x of [126,136]) rect(x,108,2,2,'#282833');
  // Warm storefronts and people on the pavement below the billboards.
  rect(54,111,29,13,'#433a51');
  rect(57,114,9,7,'#f2bf81');
  rect(70,115,10,6,'#efaa78');
  rect(53,111,31,3,'#ab5663');
  for(let x=55;x<84;x+=5) rect(x,111,2,3,'#ffdfaa');
  for(const [x,y,coat] of [[87,117,'#b175a4'],[93,119,'#6bb5a9'],[109,118,'#d38d68'],[173,116,'#c69e79']]){
    rect(x,y-3,2,2,'#efbb97');
    rect(x,y-1,3,4,coat);
    rect(x,y+3,1,2,'#34374f');
    rect(x+2,y+3,1,2,'#34374f');
  }
  rect(0,126,320,10,'#262c3e');
  rect(0,127,320,1,'#727f90');
  for(let x=0;x<320;x+=12) line(x,129,x+7,135,'#596378');
  for(const x of [37,117,204,289]) rect(x,136,5,8,'#303c50');
  // Street furniture anchors the foreground and makes the avenue read at a glance.
  for(const x of [18,103,246]){
    rect(x,116,1,20,'#3b3c51');
    rect(x-2,115,5,1,'#3b3c51');
    rect(x-1,113,3,2,state.night?'#ffe2a0':'#c9a28f');
    if(state.night) rect(x-2,114,5,1,'#e9b66f');
  }
}

function nyCab(cabX,night){
  rect(cabX,122,22,5,night?'#b17b3e':'#e0a74b');
  pixels([[cabX+4,122],[cabX+8,119],[cabX+16,119],[cabX+19,122]],night?'#a1764a':'#f0c569');
  rect(cabX+9,120,6,2,night?'#566077':'#6b7180');
  rect(cabX+1,127,4,2,'#242536'); rect(cabX+16,127,4,2,'#242536');
  rect(cabX+10,118,3,1,'#fff0b0');
  rect(cabX+19,123,3,1,'#fff0b0');
  rect(cabX,123,2,1,'#a94355');
}

function alaskaLandscape(){
  const night=state.night;
  mountains(true);
  water(103,true);
  pixels([[0,92],[55,81],[94,95],[120,93],[134,103],[119,114],[138,144],[0,144]],foliage[state.season][0]);
  pixels([[320,85],[280,91],[260,99],[232,100],[219,111],[243,121],[238,144],[320,144]],foliage[state.season][0]);
  const random=rng(2);
  for(let i=0;i<72;i++){
    const x=random()*320;
    if(x<116 || x>246) tree(x,97+random()*22,6+random()*16,random,true);
  }
  for(let x=196;x<249;x+=4) {
    rect(x,110,3,10,'#8faaBE');
    rect(x+1,116,4,5,'#c4e3e6');
  }
  for(let i=0;i<20;i++) {
    const x=136+random()*105,y=122+random()*20;
    rect(x,y,2+random()*6,1,'#b1d2dc');
  }
  rect(278,102,21,11,'#75524d');
  pixels([[275,102],[288,93],[303,102]],state.season===3?'#e1eaf2':'#5d4853');
  rect(283,105,4,4,state.night?'#ffd181':'#aab4ba');
  // Cabin details, smoke and a small fishing boat give the fjord a lived-in scale.
  rect(279,101,19,2,'#493e4d');
  rect(296,96,2,7,'#4d414c');
  for(let puff=0;puff<4;puff++){
    const drift=Math.sin(elapsed*.3+puff)*2+puff*1.8;
    const rise=(elapsed*.8+puff*3)%12;
    ctx.save();
    ctx.globalAlpha=(.25-puff*.035)*(state.night?.82:1);
    rect(296+drift-rise*.16,94-rise,3+puff%2,2,'#d7dce1');
    ctx.restore();
  }
  rect(281,111,15,1,'#3b3545');
  rect(283,112,11,2,'#2a2d3b');
  rect(286,109,2,2,state.night?'#ffd98f':'#d18d72');
  rect(291,109,2,2,state.night?'#ffd98f':'#d18d72');
  line(281,113,276,118,'#5c5361');
  line(296,113,300,118,'#5c5361');
  // A distant skiff rocks gently in front of the glacier.
  const boatX=176+Math.sin(elapsed*.42)*3;
  const boatY=119+Math.sin(elapsed*.42)*.5;
  pixels([[boatX-9,boatY],[boatX+10,boatY],[boatX+6,boatY+3],[boatX-5,boatY+3]],night?'#263b54':'#5f5360');
  line(boatX,boatY,boatX,boatY-9,'#4c5364');
  pixels([[boatX+1,boatY-8],[boatX+8,boatY-4],[boatX+1,boatY-3]],night?'#b5d6e0':'#d5d9d4');
  rect(boatX-4,boatY-1,2,1,night?'#f5d18b':'#bd8b75');
  if(state.season===3){
    // Snow sits on the cabin roof and shoreline instead of recolouring the animals.
    line(276,102,288,94,'#edf6f6');
    line(288,94,303,102,'#edf6f6');
    rect(275,113,29,2,'#d6e8ed');
    rect(263,117,14,1,'#c4dce3');
  }
}

const smallFishJumps={
  ny:[[1.7,242,113,13,10],[4.75,285,116,-11,9],[20.1,223,116,12,10],[20.69,240,119,-9,7]],
  ak:[[2.65,149,128,12,11],[3.2,173,133,-10,8],[7.7,185,127,13,10],[11.1,156,124,10,9],
    [14.3,147,127,11,10],[14.86,181,134,-11,8],[19.6,191,126,10,9],[21.8,163,130,13,11]]
};

function fishRipple(x,y,progress,night){
  const width=2+9*progress;
  ctx.save();
  ctx.globalAlpha=(1-progress)*.7;
  const color=night?'#9ebccc':'#c9e9e9';
  rect(x-width,y,Math.max(1,width*.56),1,color);
  rect(x+width*.44,y,Math.max(1,width*.56),1,color);
  rect(x-width*.30,y+1,width*.6,1,color);
  ctx.restore();
}

function smallFish(time,night){
  for(const [start,x,y,travel,height] of smallFishJumps[state.region]){
    const phase=time-start;
    if(phase<-.28 || phase>=1.37) continue;
    if(phase<0){
      fishRipple(x,y,(phase+.28)/.28,night);
    }else if(phase<.86){
      const p=phase/.86;
      const bodyX=x+travel*p,bodyY=y-4*height*p*(1-p);
      const slope=(-4*height*(1-2*p))/Math.abs(travel);
      ctx.save();
      ctx.translate(Math.round(bodyX),Math.round(bodyY));
      ctx.scale(Math.sign(travel),1);
      ctx.rotate(Math.atan(slope));
      pixels([[-3,0],[-5,-2],[-5,2],[-3,1],[-1,2],[2,1],[3,0],[1,-2],[-2,-1]],'#9dcfda');
      rect(-1,1,2,1,'#eff6de');
      rect(1,-1,1,1,'#263747');
      ctx.restore();
      if(p<.36) fishRipple(x,y,p/.36,night);
    }else{
      const fall=(phase-.86)/.51;
      fishRipple(x+travel,y,fall,night);
      if(fall<.6){
        ctx.save();
        ctx.globalAlpha=1-fall/.6;
        for(const offset of [-1,1]) rect(x+travel+offset*(2+fall*6),y-12*fall*(1-fall),1,1,'#eaf8ef');
        ctx.restore();
      }
    }
  }
}

function alaskaMotion(time,night){
  for(let i=0;i<18;i++){
    const x=196+i*3;
    const y=110+(time*(7+i%3)+i*3)%11;
    rect(x,y,2,2,night?'#8eaac1':'#d3e5ec');
  }
  const walk=smooth((time-1.6)/10.5);
  const moving=smooth((time-1.6)/1.1)*(1-smooth((time-10.9)/1.2));
  const drink=smooth((time-12.05)/1.35)*(1-smooth((time-18.4)/1.55));
  const mooseX=-44+walk*35;
  transformed(mooseX,25,.76,()=>moose(walk*12*Math.PI,drink,moving));
  if(drink>.7){
    const spread=2+(time*5)%7;
    ctx.save();
    ctx.globalAlpha=drink*(.72-spread*.065);
    rect(130-spread,113,spread,1,'#c1d8dd');
    rect(131+spread,114,spread*.95,1,'#a9d4d7');
    ctx.restore();
  }
  const leap=(time+.3)%5.7;
  const spot=smooth((leap-1.15)/.25)*(1-smooth((leap-2.58)/.68));
  transformed(122,42,.66,()=>bear(spot));
  const waterColor=night?'#94bac7':'#c6e7e7';
  if(leap>=.85 && leap<1.58){
    const pre=(leap-.85)/.73;
    rect(222-pre*5,120,3+pre*3,1,waterColor);
  }
  if(leap>=1.45 && leap<2.4){
    const p=(leap-1.45)/.95;
    const x=222+21*p,y=120-45*p*(1-p);
    line(x-3,y+2,x+4,y-1,'#f1b5a8');
    rect(x-4,y+1,2,3,'#c97979');
    rect(x+2,y,2,2,'#e9d4bc');
  }
  if(leap>=2.4 && leap<2.98){
    const spread=(leap-2.4)*18;
    ctx.save();
    ctx.globalAlpha=1-(leap-2.4)/.58;
    rect(243-spread,120,2,1,waterColor);
    rect(243+spread,121,2,1,waterColor);
    rect(242,120-spread*.6,1,1,'#e8f7ef');
    ctx.restore();
  }
  for(let i=0;i<3;i++){
    const x=-20+time*14+i*10,y=23+i*4+Math.sin(time*.55)*4;
    const wing=Math.sin(time*6+i)*2;
    line(x-3,y-wing,x,y+1,'#6d7891');
    line(x,y+1,x+3,y-wing,'#6d7891');
  }
}

const vegasRidge=[[0,80],[12,71],[28,58],[40,65],[53,47],[66,54],[79,73],[97,66],[111,73],[131,69],[156,78],[181,62],[195,64],[213,68],[229,59],[242,44],[251,55],[270,54],[288,72],[305,63],[320,73]];
const vegasGlyphs={
  L:['100','100','100','100','111'],A:['010','101','111','101','101'],S:['111','100','111','001','111'],
  V:['101','101','101','101','010'],E:['111','100','110','100','111'],G:['111','100','101','101','111'],
  J:['001','001','001','101','111'],C:['111','100','100','100','111'],K:['101','101','110','101','101'],
  P:['110','101','110','100','100'],O:['111','101','101','101','111'],T:['111','010','010','010','010'],
  B:['110','101','110','101','110'],N:['101','111','111','111','101'],U:['101','101','101','101','111'],Y:['101','101','010','010','010'],I:['111','010','010','010','111'],M:['10001','11011','10101','10101','10101']
};
function vegasText(text,x,y,color){
  for(const [index,letter] of [...text].entries()){
    const glyph=vegasGlyphs[letter];
    if(!glyph) continue;
    glyph.forEach((row,dy)=>[...row].forEach((cell,dx)=>{
      if(cell==='1') rect(x+index*4+dx,y+dy,1,1,color);
    }));
  }
}
function vegasSign(night){
  rect(34,103,2,21,'#57465c');
  rect(44,103,2,21,'#57465c');
  pixels([[7,99],[24,89],[56,89],[73,99],[56,108],[24,108]],night?'#fbb7a0':'#e8aa8d');
  pixels([[10,99],[24,91],[56,91],[70,99],[56,106],[24,106]],night?'#f8ddac':'#f3d3a4');
  vegasText('LAS VEGAS',23,97,'#9f3b60');
  line(39,78,39,92,'#edb869');
  line(32,85,46,85,'#edb869');
  line(35,81,43,89,'#ffedb6');
  line(35,89,43,81,'#ffedb6');
}
function palm(x,y,scale,night){
  transformed(x,y,scale,()=>{
    line(-1,0,1,-13,'#695163');
    const leaves=night?'#283747':'#555263';
    for(const [dx,dy] of [[-7,-15],[-6,-10],[0,-18],[7,-16],[8,-11]]) line(1,-13,dx,dy,leaves);
  });
}

function hotelWindows(x,y,w,h,cols,rows,lit,dim){
  for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){
    const wx=x+3+col*((w-6)/cols), wy=y+4+row*((h-8)/rows);
    rect(wx,wy,2,2,(col+row)%4===0?dim:lit);
  }
}

function vegasHotels(night){
  // Landmark hotels stay broad and architectural so the people remain background scale.
  const gold=night?'#8d6b5f':'#d6a06f';
  const goldLight=night?'#d49a73':'#f0c28a';
  // Wide resort silhouettes establish the Strip before any small figures appear.
  const bellagio=night?'#403a55':'#87677a';
  rect(4,51,66,50,bellagio);
  rect(10,46,54,5,night?'#55445d':'#a17883');
  rect(17,42,40,4,night?'#755463':'#bd8b88');
  for(let x=9;x<66;x+=7) rect(x,55,2,44,night?'#8f6b79':'#b7868a');
  for(let y=59;y<96;y+=6) rect(12,y,55,1,night?'#6e536b':'#9f7682');
  pixels([[8,101],[66,101],[60,96],[15,96]],night?'#282a42':'#70596b');
  rect(13,87,49,7,night?'#5a3b59':'#9e6875');
  hotelWindows(15,57,45,28,7,4,night?'#ffd37f':'#b8898b',night?'#b86585':'#9d727d');
  vegasText('BELLAGIO',16,88,night?'#fff0ad':'#f0c187');
  // A grand pyramid resort anchors the opposite side of the skyline.
  pixels([[136,101],[177,101],[157,57]],night?'#473955':'#a27672');
  pixels([[142,98],[171,98],[157,64]],night?'#59607b':'#c5a07e');
  line(157,58,157,52,night?'#dd9a79':'#efc47b');
  rect(151,92,12,9,night?'#332d49':'#8a5c67');
  for(const [x,y] of [[149,82],[156,75],[163,82],[153,88],[161,88]]) rect(x,y,2,2,night?'#f0bb7b':'#efd09b');
  // A tall blue-glass resort gives the composition a strong vertical focal point.
  rect(181,44,22,57,night?'#303b5b':'#668096');
  rect(184,39,16,5,night?'#4d5a73':'#8fa6ad');
  rect(190,33,4,6,night?'#92c9d2':'#b8d0c7');
  for(let y=49;y<96;y+=5) rect(185,y,14,1,night?'#8ed2dc':'#9cb3b8');
  // Bellagio-style stepped hotel with a warm crown.
  rect(79,57,29,44,night?'#37334d':'#826174');
  rect(83,51,21,6,night?'#4a3a52':'#9e7180');
  rect(87,46,13,5,night?'#6d4f65':'#c18b80');
  rect(91,40,5,6,goldLight);
  for(let y=61;y<98;y+=5) for(let x=83;x<105;x+=5){
    rect(x,y,2,2,night?(x%10?'#f1bd7b':'#c57891'):'#b48687');
  }
  rect(88,92,12,9,night?'#5e4660':'#9c6b73');
  vegasText('ARIA',112,84,night?'#f7cfa0':'#81586b');
  // A slim gold resort tower balances the Sphere.
  rect(116,63,17,38,night?'#423852':gold);
  rect(119,58,11,5,night?'#64465b':goldLight);
  rect(122,53,5,5,goldLight);
  for(let y=68;y<97;y+=5) rect(120,y,2,2,night?'#f7c17a':'#e8bd8d');
  for(let y=68;y<97;y+=5) rect(127,y,2,2,night?'#f7c17a':'#e8bd8d');
  // Hotel starburst markers and rooftop beacons.
  for(const [x,y] of [[73,69],[136,60],[235,70]]){
    rect(x-1,y,3,1,night?'#ffe3a1':'#d9a47f');
    rect(x,y-1,1,3,night?'#ffe3a1':'#d9a47f');
  }
  // Professional hotel detailing: facade bands, lit entrances and marquee canopies.
  rect(8,98,61,3,night?'#b26e72':'#b07d7f');
  rect(23,96,31,3,night?'#e0a36f':'#d79b7d');
  for(const x of [26,34,42,50]) rect(x,99,3,2,night?'#ffe5a5':'#b87c72');
  rect(109,96,22,5,night?'#5b4561':'#80606c');
  hotelWindows(118,64,14,30,2,5,night?'#f4bf77':'#bd8d86',night?'#986879':'#a17881');
  rect(180,96,25,5,night?'#273550':'#577184');
  hotelWindows(184,49,16,43,3,7,night?'#8ed9e4':'#9db7ba',night?'#52708a':'#72929a');
  rect(224,61,28,40,night?'#443851':'#967174');
  rect(228,57,20,4,night?'#65465e':'#bd8c7f');
  hotelWindows(226,65,24,30,4,5,night?'#f5c678':'#b98783',night?'#a76578':'#97717b');
  rect(231,92,14,9,night?'#62415c':'#a56e72');
}

function vegasLandscape(){
  const night=state.night;
  pixels([...vegasRidge,[320,99],[0,99]],night?'#30314a':'#755065');
  if(state.season===3){
    pixels([[43,61],[53,47],[66,54],[71,64],[61,57],[57,60],[53,54]],night?'#86839b':'#dfbabb');
    pixels([[234,53],[242,44],[251,55],[261,55],[264,60],[248,58],[242,51]],night?'#86839b':'#dfbabb');
  }
  pixels([[0,82],[29,77],[62,85],[92,75],[118,79],[151,76],[187,81],[223,74],[267,79],[320,74],[320,144],[0,144]],night?'#27283d':'#987174');
  const random=rng(74);
  for(const [x,y,w,h,tone,neon] of [
    [7,70,24,26,0x815970,'#dd86b1'],[43,55,24,43,0x9e6d7f,'#ffb982'],
    [67,60,15,36,0x8e6372,'#d28db9'],[87,47,27,49,0x937186,'#fcdaa8'],
    [116,53,21,43,0xa58184,'#ffd398'],[143,63,22,33,0x816071,'#f18baf'],
    [169,54,18,42,0x7b6382,'#b68bf1'],[236,79,12,21,0x76546e,'#f1b0b7'],
    [276,88,12,13,0x756889,'#8ce9f2'],[297,74,23,27,0x8c667f,'#ce94e4']
  ]){
    const wall=night?mix(tone,0x212339,.71):mix(tone,0x1b233d,.19);
    rect(x,y,w,h,wall);
    rect(x+2,y-3,w-4,3,wall);
    rect(x,y,w,1,night?neon:'#c8999a');
    rect(x+w-2,y+1,1,h-1,night?neon:'#a77b89');
    for(let offset=4;offset<h-2;offset+=4){
      for(let column=3;column<w-3;column+=4){
        if(random()>.34) rect(x+column,y+offset,2,1,night?(random()>.32?neon:'#583a62'):'#805b71');
      }
    }
  }
  const pavement=night?'#292340':'#735a6d';
  rect(0,95,320,27,pavement);
  rect(19,108,192,13,night?'#1b354e':'#52516a');
  pixels([[70,103],[154,103],[194,110],[178,118],[81,118],[55,110]],night?'#253b59':'#737086');
  for(let i=0;i<42;i++){
    rect(66+random()*123,105+random()*12,2+random()*7,1,night?'#3a5981':'#9b8291');
  }
  rect(0,123,320,21,night?'#1c1d33':'#51485f');
  rect(0,122,320,1,night?'#7e5892':'#9f7a82');
  for(let x=0;x<320;x+=17) rect(x,133,8,1,'#957087');
  for(const [x,y,h] of [[8,118,1.25],[74,119,1],[148,120,1.3],[187,120,1.1],[244,121,1.4],[304,119,1.1]]) palm(x,y,h,night);
  vegasHotels(night);
  // Bellagio-style fountain basin in front of the hotel row.
  pixels([[52,115],[92,111],[133,115],[121,120],[68,120]],night?'#263e59':'#69768a');
  line(58,116,126,116,night?'#99e0ec':'#b4cbd2');
  line(62,119,119,119,night?'#345b79':'#536478');
  vegasSign(night);
  line(249,104,270,65,night?'#657494':'#94778b');
  line(294,104,270,65,night?'#657494':'#94778b');
}

function sphereOval(x,y,rx,ry,color){
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fill();
}

function sphereSurface(colors){
  const gradient=ctx.createRadialGradient(-9,-11,2,1,3,30);
  colors.forEach(([stop,color])=>gradient.addColorStop(stop,color));
  ctx.fillStyle=gradient;
  ctx.fillRect(-27,-26,54,52);
}

function sphereSmiley(time,night){
  sphereSurface(night?[[0,'#fff291'],[.56,'#ffd34a'],[1,'#cc702b']]:[[0,'#ffeb99'],[.56,'#f9c952'],[1,'#c07a42']]);
  const ink='#522929';
  const blink=Math.max(0,1-Math.abs(time-2.25)/.24);
  const wink=Math.max(0,1-Math.abs(time-4.35)/.42);
  const look=Math.sin(time*.72)*1.65;
  for(const side of [-1,1]){
    const closing=side>0?Math.max(wink,blink):blink;
    const x=side*8+look;
    sphereOval(x,-5,2.85,Math.max(.68,4.25*(1-closing)),ink);
    if(closing<.25) sphereOval(x-.65,-6.25,.78,.9,'#fff4c7');
  }
  sphereOval(-15,2,3.2,1.45,'#ee9b56');
  sphereOval(15,2,3.2,1.45,'#ee9b56');
  const depth=12+Math.sin(time*1.3)*1.2+wink*2;
  ctx.fillStyle=ink;
  ctx.beginPath();
  ctx.moveTo(-11,3);
  ctx.quadraticCurveTo(look,7.5,11,3);
  ctx.quadraticCurveTo(9,depth,0,depth+.3);
  ctx.quadraticCurveTo(-9,depth,-11,3);
  ctx.fill();
  ctx.fillStyle='#fff1c0';
  ctx.beginPath();
  ctx.moveTo(-8.2,4.5);
  ctx.quadraticCurveTo(0,7,8.3,4.5);
  ctx.quadraticCurveTo(6.6,7.8,0,8.2);
  ctx.quadraticCurveTo(-6,8,-8.2,4.5);
  ctx.fill();
}

const moonCraters=[
  [-17,-10,3.4,2.9],[-10,-15,5.7,4.3],[-4,-6,4.6,3.4],[4,-13,2.8,2.2],[10,-9,5.8,4.6],
  [13,0,3.6,3],[-16,4,5.2,3.6],[-6,7,2.8,2.2],[2,4,5.2,4.3],[9,11,4,2.7],[-9,15,4,2.5],[0,18,2.4,2]
];
function sphereMoon(time,night){
  sphereSurface(night?[[0,'#f1f4ed'],[.55,'#c5cedc'],[1,'#576985']]:[[0,'#e0ded8'],[.55,'#bbc2cf'],[1,'#6c6a82']]);
  const drift=Math.sin(time*.54)*2.3;
  for(const [x,y,rx,ry] of moonCraters){
    sphereOval(x+drift,y,rx,ry,'#8b9bb4');
    sphereOval(x+drift+.6,y-ry*.2,rx*.72,ry*.55,'#a7b2c3');
  }
}

function sphereBasketball(time,night){
  sphereSurface(night?[[0,'#ffcc72'],[.57,'#e78645'],[1,'#8e4434']]:[[0,'#ffc17b'],[.57,'#d88250'],[1,'#925042']]);
  ctx.save();
  ctx.rotate((time-11)*.25);
  ctx.beginPath();
  ctx.moveTo(-27,0);ctx.lineTo(27,0);
  ctx.moveTo(0,-27);ctx.lineTo(0,27);
  ctx.moveTo(-17,-19);ctx.bezierCurveTo(-7,-8,-7,9,-17,19);
  ctx.moveTo(17,-19);ctx.bezierCurveTo(7,-8,7,9,17,19);
  ctx.strokeStyle='#553335';
  ctx.lineWidth=1.65;
  ctx.stroke();
  ctx.restore();
}

function vegasSphere(elapsed,night){
  const phase=elapsed%29;
  const time=phase<=14.5?phase:29-phase;
  ctx.save();
  ctx.translate(211,78);
  ctx.beginPath();
  ctx.ellipse(0,0,25,24,0,0,Math.PI*2);
  ctx.clip();
  if(time<7.1) sphereSmiley(time,night);
  if(time>=6.1 && time<11.55){
    ctx.globalAlpha=smooth((time-6.1)/1);
    sphereMoon(time,night);
  }
  if(time>=10.55){
    ctx.globalAlpha=smooth((time-10.55)/1);
    sphereBasketball(time,night);
  }
  // Subtle LED spacing keeps the image part of the pixel skyline.
  ctx.globalAlpha=night ? .15 : .12;
  for(let y=-24;y<24;y+=2) for(let x=-25;x<25;x+=2) rect(x+(y%4===0?0:1),y,1,1,'#2c2949');
  ctx.restore();
  rect(190,102,42,2,night?'#a577d2':'#84668a');
}

const jackpotAt=3.8;
const bonusStart=8;
const bonusInterval=36;
const bonusWarningDuration=1.4;
const bonusMarqueeEnd=8.6;
const bonusX=145,bonusY=28;
const vegasPickupAt=jackpotAt+3.45;
const vegasBoardAt=10.65;
const vegasCabLeaveAt=12.65;
const vegasStreetEnd=17.1;
const jackpotRandom=rng(777);
const jackpotRain=Array.from({length:118},(_,index)=>{
  const bill=index%3===0;
  return {bill,x:jackpotRandom()*324-2,delay:jackpotRandom()*2.8,
    duration:(bill?4.1:2.45)+jackpotRandom()*1.55,phase:jackpotRandom()*Math.PI*2,scale:.65+jackpotRandom()*.62};
});
const jackpotSparks=Array.from({length:28},()=>({
  angle:jackpotRandom()*Math.PI*2,speed:18+jackpotRandom()*77,life:.42+jackpotRandom()*.57
}));
function slotSymbol(symbol,x,y){
  if(symbol===0){
    rect(x-4,y-5,9,2,'#a7355d');
    pixels([[x+1,y-3],[x+4,y-3],[x,y+5],[x-3,y+5]],'#a7355d');
  }else if(symbol===1){
    pixels([[x,y-5],[x+5,y],[x,y+5],[x-5,y]],'#397d79');
    rect(x-1,y-2,2,2,'#d8f2d5');
  }else{
    for(const bar of [-3,1]) rect(x-4,y+bar,9,2,'#664a85');
  }
}
function jackpotMarquee(time){
  const age=time-jackpotAt;
  const lit=smooth(age/.12)*(1-smooth((age-4.6)/1.6));
  const glow=ctx.createRadialGradient(132,74,4,132,74,45);
  glow.addColorStop(0,'#ffe89e');
  glow.addColorStop(1,'#ffc86c00');
  ctx.save();
  ctx.globalAlpha*=.32*lit;
  rect(87,29,90,90,glow);
  ctx.restore();
  rect(99,76,67,21,'#251c38');
  pixels([[95,63],[103,54],[161,54],[169,63],[169,88],[95,88]],'#21182e');
  pixels([[97,63],[104,56],[160,56],[167,63],[167,86],[97,86]],mix(0xb76a73,0xffd778,lit));
  rect(100,62,64,22,'#3d294f');
  rect(113,56,38,8,'#36243d');
  vegasText(age<0?'BONUS':'JACKPOT',age<0?123:119,57,mix(0xf3b8a3,0xffefad,lit));
  for(let x=101;x<165;x+=4){
    rect(x,85,1,1,mix(0xd3959b,0xffffbe,lit));
  }
  for(let reel=0;reel<3;reel++){
    const x=112+reel*20;
    const progress=Math.min(1,time/(2.7+reel*.55));
    const position=lerp(1+reel%2,18+6*reel,1-(1-progress)**2);
    const symbol=Math.floor(position);
    const scroll=(position-symbol)*14;
    rect(x-8,65,17,17,'#2d1d33');
    rect(x-7,66,15,15,mix(0xf5d6cc,0xffebae,lit));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x-7,66,15,15);
    ctx.clip();
    for(const step of [-1,0,1]) slotSymbol((symbol+step+3)%3,x,73+step*14-scroll);
    ctx.restore();
  }
  for(const spark of jackpotSparks){
    if(age<0 || age>=spark.life) continue;
    const x=132+Math.cos(spark.angle)*spark.speed*age;
    const y=73+Math.sin(spark.angle)*spark.speed*age+32*age*age;
    ctx.save();
    ctx.globalAlpha=1-age/spark.life;
    rect(x-2,y,5,1,'#ffda77');
    rect(x,y-2,1,5,'#fff3b0');
    ctx.restore();
  }
}
function fallingJackpot(age,skyTop){
  for(const {bill,x,delay,duration,phase,scale} of jackpotRain){
    const progress=(age-delay)/duration;
    if(progress<0 || progress>1) continue;
    const motion=bill?progress:progress*(.58+.42*progress);
    const y=lerp(skyTop-7,131,motion);
    const sway=Math.sin(phase+progress*Math.PI*(bill?4:2))*(bill?8:3);
    const flip=Math.cos(phase+progress*Math.PI*(bill?5:8));
    ctx.save();
    ctx.translate(Math.round(x+sway),Math.round(y));
    ctx.rotate(Math.sin(phase+progress*Math.PI*3)*(bill?.42:.24));
    ctx.scale(scale*Math.max(.28,Math.abs(flip)),scale);
    if(bill){
      rect(-6,-3,12,6,'#2c633f');
      rect(-5,-2,10,4,flip>0?'#c5e5a1':'#89bf82');
      rect(-1,-2,3,4,'#508a59');
      rect(-4,0,2,1,'#629b67');
      rect(3,0,2,1,'#629b67');
    }else{
      sphereOval(0,0,3.7,4.3,'#a66027');
      sphereOval(0,-.45,3.1,3.6,flip>0?'#ffd45e':'#e9a938');
      rect(-1,-2,1,3,'#fff0aa');
    }
    ctx.restore();
  }
}

function dangerWarning(layer,progress){
  const pulse=Math.sin(progress*Math.PI)**2;
  const darkness=smooth(progress/.065)*(1-smooth((progress-.70)/.30));
  const top=-layer.offset/2, height=layer.canvas.height/2;
  const edge=ctx.createRadialGradient(160,top+height*.47,35,160,top+height*.47,Math.hypot(160,height*.54));
  edge.addColorStop(0,'#63162300');
  edge.addColorStop(1,'#641720b0');
  ctx.save();
  ctx.globalAlpha=darkness*.69;
  rect(0,top,320,height,'#080912');
  ctx.globalAlpha=darkness;
  rect(0,top,320,height,edge);
  ctx.translate(145,30);
  ctx.globalAlpha=smooth(progress/.16)*(1-smooth((progress-.84)/.16));
  pixels([[-17,-5],[-12,-10],[12,-10],[17,-5],[17,5],[12,10],[-12,10],[-17,5]],mix(0xcf7b40,0xffdc83,pulse));
  pixels([[-15,-4],[-11,-8],[11,-8],[15,-4],[15,4],[11,8],[-11,8],[-15,4]],'#322032');
  for(const x of [-6,3]){
    rect(x,-5,3,7,'#ffe19a');
    rect(x,4,3,2,'#ffe19a');
  }
  const reach=21+3*pulse;
  for(const side of [-1,1]){
    line(side*reach,-4,side*(reach+4),-7,'#e5a95e');
    line(side*reach,4,side*(reach+4),7,'#e5a95e');
  }
  ctx.restore();
}

function vegasLuckyCue(progress){
  const glow=Math.sin(Math.PI*progress);
  ctx.save();
  ctx.translate(bonusX,bonusY);
  ctx.globalAlpha=smooth(progress/.16)*(1-smooth((progress-.86)/.14));
  pixels([[-22,0],[-16,-8],[16,-8],[22,0],[16,8],[-16,8]],'#efc873');
  pixels([[-20,0],[-15,-7],[15,-7],[20,0],[15,7],[-15,7]],'#254d48');
  vegasText('LUCKY',-9,-2,'#fff1ac');
  for(const side of [-1,1]){
    const x=side*(24+5*glow), y=-3*glow;
    rect(x-2,y,5,1,'#f5dc87');
    rect(x,y-2,1,5,'#aef3be');
  }
  ctx.restore();
}

function vegasBonus(time,skyTop){
  if(time<0 || time>=13) return;
  if(time<bonusMarqueeEnd){
    const enter=smooth(time/.24);
    const exit=smooth((bonusMarqueeEnd-time)/.7);
    const scale=.8*(.82+.18*enter);
    ctx.save();
    ctx.globalAlpha=enter*exit;
    ctx.translate(bonusX,bonusY+5*(1-enter));
    ctx.scale(scale,scale);
    ctx.translate(-132,-74);
    jackpotMarquee(time);
    ctx.restore();
  }
  fallingJackpot(time-jackpotAt-.24,skyTop);
}

function vegasWheel(time,night,reacting){
  const wheelX=270,wheelY=65,wheelR=29;
  const rotation=time*.22;
  for(let i=0;i<72;i++){
    const angle=i*Math.PI/36;
    rect(wheelX+Math.cos(angle)*wheelR,wheelY+Math.sin(angle)*wheelR,1,1,night?'#9cbaf0':'#a991a6');
  }
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6+rotation;
    const x=wheelX+Math.cos(angle)*wheelR,y=wheelY+Math.sin(angle)*wheelR;
    line(wheelX,wheelY,x,y,night?'#505682':'#81667e');
    rect(x,y,1,3,'#a89fbd');
    rect(x-4,y+2,9,5,night?'#303a59':'#6d5976');
    rect(x-3,y+3,7,3,night?'#f3d6a2':'#efccbd');
    rect(x-3,y+3,2,2,'#da9d7e');
    rect(x+1,y+3,2,2,'#b97862');
    rect(x-2,y+4,1,1,'#503f54');
    rect(x+2,y+4,1,1,'#553f50');
    rect(x-3,y+5,2,1,'#79658f');
    rect(x+1,y+5,2,1,'#89516b');
    if(reacting){
      rect(x-4,y+3,1,2,'#79658f');
      rect(x+3,y+3,1,2,'#89516b');
      if(i%4===0) rect(x+5,y+1,1,2,'#ffeeb3');
    }
    rect(x-3,y+7,7,1,night?'#cfa9dc':'#a590ad');
  }
  rect(wheelX-1,wheelY-1,3,3,night?'#f8d3e9':'#dab0b1');
  rect(241,104,61,5,'#4b3b56');
  rect(242,104,58,1,night?'#ffe0ab':'#bd9a9e');
  rect(242,109,2,9,'#634f68');
  rect(298,109,2,9,'#634f68');
  for(let step=0;step<7;step++) rect(227+step*2,117-step*2,4,2,'#a98ca0');
  for(const x of [242,258,274,290,300]) rect(x,98,1,6,'#856b86');
  rect(242,98,59,1,'#ae91ac');
  // Elevated loading platform with ticket kiosk, lamps and a readable queue gate.
  rect(220,117,83,2,night?'#4d5374':'#8c7184');
  for(const x of [224,238,252,266,280,294]){
    rect(x,117,1,7,night?'#64739a':'#a28a9a');
    rect(x-1,123,3,1,night?'#7788a6':'#b39aa6');
  }
  rect(215,110,8,8,night?'#27304d':'#73556e');
  rect(216,111,6,2,night?'#9de2e2':'#f2c47e');
  vegasText('HR',216,114,night?'#e7c5f5':'#f8ddb1');
  rect(304,114,5,2,night?'#ffd28a':'#cf9b82');
  rect(306,116,1,5,night?'#7e7191':'#8d6d7b');
}

function vegasWheelQueue(time,reacting){
  const pace=time*11;
  for(let rider=0;rider<10;rider++){
    const distance=(pace+rider*19)%323;
    // Everyone enters from the left, climbs the same stair and exits behind the gate.
    const x=distance-19;
    const y=118-14*clamp((x-227)/14);
    const stride=Math.round(Math.sin(distance*.8));
    // Fade only while off-canvas, so each rider visibly walks into the scene.
    const entryFade=smooth(clamp((x+19)/14));
    const exitFade=1-smooth(clamp((x-296)/18));
    ctx.save();
    ctx.globalAlpha=entryFade*exitFade;
    vegasPerson(x,y,rider,78+(rider*23)%85,0,stride,false,reacting && x>239);
    ctx.restore();
  }
  rect(296,93,9,14,'#4a3c56');
  rect(295,92,11,2,'#bd93ac');
  rect(297,95,5,4,'#785f79');
}

const vegasCabStops=[252,155,64];
const vegasCoats=['#e492a5','#84b4cf','#e0b87e','#9e8cd0','#74c7af','#e38868'];

function vegasPerson(x,y,person,skin,bend,stride,holding,surprised=false){
  const coat=vegasCoats[person%vegasCoats.length];
  const variant=person%8;
  const longHair=variant===1||variant===5;
  const skirt=variant===2||variant===6;
  const hat=variant===3||variant===7;
  const hair=variant%2?'#4a2f39':variant%4===0?'#25253a':'#704533';
  const headX=x+Math.round(3*bend),headY=y-10+Math.round(5*bend)-(surprised?1:0);
  rect(x-2,y,6,1,'#211d31');
  rect(x-1-stride,y-3,1,3,'#3b3448');
  rect(x+1+stride,y-3,1,3,'#3b3448');
  line(x,y-4,headX,headY+2,coat);
  if(skirt) pixels([[x-3,y-4],[x+3,y-4],[x+4,y],[x-4,y]],coat);
  else rect(x-2,y-4,5,4,coat);
  rect(headX-1,headY+2,3,3,coat);
  rect(headX-2,headY-1,4,4,mix(0xeef0d9,0x79493d,skin/255));
  rect(headX-2,headY-2,4,1,hair);
  rect(headX-2,headY-1,1,2,hair);
  if(longHair){ rect(headX+1,headY-1,1,3,hair); rect(headX-3,headY,1,2,hair); }
  if(hat){ rect(headX-3,headY-3,6,1,variant===3?'#d5a45c':'#5f79a6'); rect(headX-1,headY-4,3,1,variant===3?'#d5a45c':'#5f79a6'); }
  rect(headX+1,headY,1,1,'#3c2a37');
  if(surprised) line(headX-1,headY+3,headX-3,headY,coat);
  if(bend>.35 || holding) line(headX+1,headY+3,headX+3,bend>.35?y-1:headY+4,coat);
}

function vegasSportsCar(x,lane,style,night){
  transformed(x,lane,.72,()=>vegasSportsCarSprite(style,night));
}

function vegasSportsCarSprite(style,night){
  const palettes=[['#d84c63','#f28a78'],['#4b87bc','#7cd6df'],['#c58b42','#f4cb6d'],['#8e67bb','#d49bf0']];
  const [body,highlight]=palettes[style%palettes.length];
  const x=0,y=0;
  rect(x-13,y+5,27,2,'#202033');
  if(style%4===0){
    pixels([[x-13,y+4],[x-9,y],[x-3,y-3],[x+7,y-3],[x+13,y+2],[x+14,y+5]],body);
    pixels([[x-5,y],[x-2,y-2],[x+5,y-2],[x+8,y]],night?'#35425c':'#a3c0cf');
  }else if(style%4===1){
    pixels([[x-14,y+5],[x-10,y-1],[x-4,y-4],[x+5,y-4],[x+12,y],[x+14,y+5]],body);
    rect(x-4,y-2,10,2,night?'#465b73':'#a9d0d7');
  }else if(style%4===2){
    pixels([[x-13,y+5],[x-8,y-2],[x+2,y-3],[x+10,y],[x+14,y+4]],body);
    rect(x-2,y-2,9,2,night?'#5b6075':'#d5d1c0');
  }else{
    pixels([[x-14,y+5],[x-10,y-1],[x-1,y-4],[x+8,y-2],[x+14,y+4]],body);
    rect(x-3,y-2,9,2,night?'#4c4868':'#c4b5d7');
  }
  rect(x-8,y+1,16,1,highlight);
  for(const wheel of [x-8,x+8]){
    rect(wheel-2,y+4,4,3,'#202033');
    rect(wheel-1,y+4,2,1,night?'#b5bfd4':'#8e8d9e');
  }
  // All sprites face right. The lamp positions follow the body, never the paint.
  rect(11,2,2,1,night?'#fff0bb':'#f9d6a1');
  rect(-12,2,2,1,night?'#ff7795':'#ad3e56');
}

const vegasTrafficLanes=[[22,19,127],[192,19,127],[106,24,137]];
function vegasTrafficPosition(time,index){
  const [offset,speed,lane]=vegasTrafficLanes[index];
  const span=352;
  const travel=offset+time*speed;
  const pass=Math.floor(travel/span);
  const paint=rng(701+index*1931+pass*7919);
  return {x:travel-pass*span-16,lane,style:Math.floor(paint()*4)};
}

function vegasCab(x,night,door){
  const y=131;
  rect(x-12,y+5,25,2,'#222138');
  rect(x-11,y-2,23,6,'#d49a43');
  rect(x-10,y-2,21,4,'#ffce68');
  pixels([[x-7,y-2],[x-4,y-6],[x+5,y-6],[x+9,y-2]],'#f3b951');
  rect(x-4,y-5,10,3,night?'#66567a':'#59637c');
  rect(x-2,y-7,5,2,'#fff0ae');
  rect(x-6,y,10,1,'#98704e');
  if(door){
    rect(x-6,y-3,5,6,'#37324a');
    rect(x-7,y-4,2,6,'#e5ad55');
  }
  for(const wheel of [x-8,x+7]) rect(wheel,y+3,4,3,'#272437');
  rect(x+10,y,2,1,'#fff1bc');
  rect(x-11,y+1,2,1,'#e5788c');
}

function vegasStreetActivity(time,night,skyTop){
  if(time<0 || time>=vegasStreetEnd) return;
  for(const [group,stop] of vegasCabStops.entries()){
    const leave=vegasCabLeaveAt+group*.45;
    for(let person=0;person<2;person++){
      const order=2-person;
      const entry=.18+group*.24+order*.24;
      const pickup=vegasPickupAt+group*.21+order*.24;
      const board=vegasBoardAt+group*.40+order*.48;
      if(time<entry || time>=board+.28) continue;
      const spot=stop-42+person*14;
      const curb=122+person%2;
      const walk=smooth((time-entry)/3.9);
      const taxiWalk=smooth((time-pickup-1.05)/(board-pickup-1.05));
      const stepIn=smooth((time-board+.25)/.50);
      const bend=smooth((time-pickup)/.34)*smooth((pickup+1.05-time)/.36);
      const holding=time>=pickup+.5;
      const streetX=spot-21*(1-walk);
      const x=lerp(streetX,stop-4,taxiWalk);
      const stride=walk<1 || (taxiWalk>0 && taxiWalk<1)?Math.round(Math.sin(time*15+person)*1.1):0;
      ctx.save();
      const fade=1-smooth((time-board)/.28);
      const feet=curb+stepIn*8;
      ctx.globalAlpha=smooth((time-entry)/.3)*fade;
      vegasPerson(x,feet,group*3+person,83+group*19+person*21,bend,stride,holding);
      const fall=clamp((time-pickup+2.8)/2.35);
      if(fall>0){
        const lift=smooth((time-pickup-.35)/.55);
        const sway=Math.sin(fall*Math.PI*3)*(1-fall)*7;
        const cashX=lerp(spot+5+sway,x+5+Math.round(3*bend),lift);
        const cashY=lerp(lerp(skyTop-6,curb-2,fall),feet-5+Math.round(4*bend),lift);
        ctx.globalAlpha=fade;
        rect(cashX,cashY,person%2?4:2,2,person%2?'#a5d88f':'#fadb77');
        rect(cashX,cashY,1,1,person%2?'#d8efc4':'#fff0af');
      }
      ctx.restore();
    }
    const arrive=smooth((time-.75-group*.6)/(7.1-group*.18));
    const depart=smooth((time-leave)/3.4);
    const cabX=lerp(-26,stop,arrive)+(351-stop)*depart;
    vegasCab(cabX,night,time>=vegasBoardAt-.3+group*.40 && time<leave);
  }
}

function vegasMotion(time,night,displayTime,bonusTime,skyTop){
  vegasSphere(displayTime,night);
  const reacting=bonusTime>=jackpotAt && bonusTime<10.8;
  vegasWheel(displayTime,night,reacting);

  const waterColor=night?'#c6f5fd':'#efd9df';
  for(let jet=0;jet<15;jet++){
    const x=74+jet*7,y=113-Math.sin(jet*Math.PI/14)*5;
    const surge=Math.max(0,Math.sin(time*2.7-jet*.43));
    const height=3+surge*(12+8*Math.sin(jet*Math.PI/14));
    const towardCenter=(7-jet)*.36;
    for(let drop=0;drop<=height;drop+=2){
      const sway=towardCenter*drop/height+Math.sin(time*3+drop*.26)*.9;
      rect(x+sway,y-drop,jet%3===0?2:1,1,drop%4===0?waterColor:'#7caecc');
    }
    rect(x-1,y,3,1,'#94b9ce');
  }
  // Layered fountain choreography: low side arcs and a higher center plume.
  for(const [arc,base,height] of [[-1,63,9],[1,125,10]]){
    for(let step=0;step<=10;step++){
      const p=step/10;
      const x=base+arc*p*26;
      const y=116-height*4*p*(1-p)-Math.max(0,Math.sin(time*2.7+arc))*2*p*(1-p);
      rect(x,y,1,2,step%3===0?waterColor:'#7caecc');
    }
  }
  for(let step=0;step<9;step++){
    const p=step/8;
    const x=96+Math.sin(time*2.7)*p*2;
    const y=116-29*4*p*(1-p);
    rect(x,y,2,2,step%2?waterColor:'#bdebf0');
  }
  // Neon reflections ripple across the wet Strip pavement.
  if(night){
    for(let i=0;i<18;i++){
      const x=38+(i*29+Math.sin(time*.7+i)*5)%260;
      const y=123+(i%4)*3;
      ctx.save();
      ctx.globalAlpha=.18+.08*Math.sin(time*1.4+i)**2;
      rect(x,y,3+(i%3)*2,1,i%3===0?'#e97bb4':i%3===1?'#7cdce2':'#f5cb78');
      ctx.restore();
    }
  }
  vegasWheelQueue(displayTime,reacting);
  // Street traffic uses forward time independently of the reversible story.
  for(let index=0;index<vegasTrafficLanes.length;index++){
    const {x,lane,style}=vegasTrafficPosition(displayTime,index);
    vegasSportsCar(x,lane,style,night);
  }
  vegasStreetActivity(bonusTime,night,skyTop);
}

const regions={
  ny:{name:'Manhattan',description:'A stylized New York panorama with the Empire State Building, the Chrysler Building, One World Trade Center, Times Square, the Statue of Liberty, Brooklyn Bridge, and the 7 train.',landscape:nyLandscape,horizon:'#293247'},
  ak:{name:'Alaska',description:'Alaska with snowy peaks, a glacial fjord, a cabin in the woods, a moose, and a brown bear.',landscape:alaskaLandscape,horizon:'#20323e'},
  lv:{name:'Las Vegas',description:'The neon Strip, the animated Sphere, fountains, and the High Roller with riders and a boarding platform. After a 777 jackpot, pedestrians collect bills and coins and leave in yellow cabs.',landscape:vegasLandscape,horizon:'#1c1d33'}
};

const chase = [
  {start:0,end:3.1,from:[-18,99],to:[48,77]},
  {start:3.1,end:4.5,from:[48,77],to:[111,67],web:[75,43]},
  {start:4.5,end:5.6,from:[111,67],to:[121,62]},
  {start:5.6,end:7.9,from:[121,62],to:[197,46],web:[152,22]},
  {start:7.9,end:9.2,from:[197,46],to:[199,77]},
  {start:9.2,end:11.1,from:[199,77],to:[273,65],web:[232,45]},
  {start:11.1,end:12.2,from:[273,65],to:[286,52],lift:2},
  {start:12.2,end:13.85,from:[286,52],to:[286,52],lift:0},
  {start:13.85,end:14.75,from:[286,52],to:[262,75],lift:5},
  {start:14.75,end:16.55,from:[262,75],to:[194,64],web:[232,45]},
  {start:16.55,end:17.85,from:[194,64],to:[168,72],lift:8},
  {start:17.85,end:19.75,from:[168,72],to:[105,46],web:[152,22]},
  {start:19.75,end:23.2,from:[105,46],to:[-18,53],lift:11}
];

function clamp(value){return Math.max(0,Math.min(1,value))}
function smooth(value){
  const t=clamp(value);
  return t*t*(3-2*t);
}
function lerp(from,to,t){return from+(to-from)*t}

function swingPoint(segment,t){
  const [ax,ay]=segment.web;
  const [sx,sy]=segment.from,[ex,ey]=segment.to;
  const startAngle=Math.atan2(sx-ax,sy-ay),endAngle=Math.atan2(ex-ax,ey-ay);
  const angle=lerp(startAngle,endAngle,t);
  const length=lerp(Math.hypot(sx-ax,sy-ay),Math.hypot(ex-ax,ey-ay),t);
  return [ax+Math.sin(angle)*length,ay+Math.cos(angle)*length];
}

function swingVelocity(segment,t){
  if(!segment?.web) return [0,0];
  const before=swingPoint(segment,t-.001),after=swingPoint(segment,t+.001);
  const interval=.002*(segment.end-segment.start);
  return after.map((value,i)=>(value-before[i])/interval);
}

function flightPoint(index,t){
  const segment=chase[index];
  if(segment.web) return swingPoint(segment,t);
  const startVelocity=swingVelocity(chase[index-1],1);
  const endVelocity=swingVelocity(chase[index+1],0);
  const duration=segment.end-segment.start;
  const t2=t*t,t3=t2*t;
  const height=segment.lift??(index===0?19:12);
  const lift=height*16*t2*(1-t)**2;
  return segment.from.map((value,i)=>
    (2*t3-3*t2+1)*value+(t3-2*t2+t)*duration*startVelocity[i]
    +(-2*t3+3*t2)*segment.to[i]+(t3-t2)*duration*endVelocity[i]
    -(i===1?lift:0)
  );
}

function chasePoint(time){
  const found=chase.findIndex(shot=>time<=shot.end);
  const index=found<0?chase.length-1:found;
  const shot=chase[index];
  return flightPoint(index,clamp((time-shot.start)/(shot.end-shot.start)));
}

const spiderPoses={
  dive:{arms:[[[-3,-2],[-5,2],[-7,3]],[[3,-2],[5,-5],[6,-8]]],legs:[[[-2,4],[-4,8],[-7,11]],[[2,4],[1,9],[-3,13]]]},
  tuck:{arms:[[[-3,-2],[-5,1],[-1,3]],[[3,-2],[6,1],[4,3]]],legs:[[[-2,4],[-6,6],[-6,10]],[[2,4],[6,2],[4,7]]]},
  plant:{arms:[[[-3,-2],[-6,0],[-5,3]],[[3,-2],[5,1],[3,4]]],legs:[[[-2,4],[-5,7],[-4,12]],[[2,4],[4,8],[2,12]]]},
  reach:{arms:[[[-3,-2],[-5,1],[-3,4]],[[3,-2],[3,-8],[3,-13]]],legs:[[[-2,4],[-3,8],[-4,13]],[[2,4],[2,8],[1,12]]]},
  swing:{arms:[[[-3,-2],[-4,1],[-2,4]],[[3,-2],[2,-8],[1,-13]]],legs:[[[-2,4],[-5,7],[-9,8]],[[2,4],[5,4],[3,9]]]}
};

function blendPose(from,to,t){
  const mixJoints=(left,right)=>left.map((limb,i)=>limb.map((joint,j)=>joint.map((value,k)=>lerp(value,right[i][j][k],t))));
  return {arms:mixJoints(from.arms,to.arms),legs:mixJoints(from.legs,to.legs)};
}

function aimWrist(pose,arm,x,y,angle,target,weight){
  const [shoulder,elbow,hand]=pose.arms[arm];
  const dx=target[0]-x,dy=target[1]-y;
  const localX=(dx*Math.cos(angle)+dy*Math.sin(angle))-shoulder[0];
  const localY=-dx*Math.sin(angle)+dy*Math.cos(angle)-shoulder[1];
  const distance=Math.max(1,Math.hypot(localX,localY));
  const ux=localX/distance,uy=localY/distance;
  const aimedElbow=[shoulder[0]+ux*5-uy*1.4,shoulder[1]+uy*5+ux*1.4];
  const aimedHand=[shoulder[0]+ux*10,shoulder[1]+uy*10];
  pose.arms[arm]=[shoulder,elbow.map((v,i)=>lerp(v,aimedElbow[i],weight)),hand.map((v,i)=>lerp(v,aimedHand[i],weight))];
}

function webStrand(hand,target,progress,slack=0,opacity=1){
  if(progress<=0) return;
  const end=[lerp(hand[0],target[0],progress),lerp(hand[1],target[1],progress)];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...hand);
  ctx.quadraticCurveTo((hand[0]+end[0])/2,(hand[1]+end[1])/2+slack,...end);
  ctx.strokeStyle='#dbe8ef';
  ctx.globalAlpha=opacity;
  ctx.lineWidth=.6;
  ctx.stroke();
  ctx.restore();
}

function limb(from,to,width,color){
  const dx=to[0]-from[0],dy=to[1]-from[1];
  const length=Math.max(.01,Math.hypot(dx,dy));
  const px=-dy/length*width/2,py=dx/length*width/2;
  pixels([[from[0]+px,from[1]+py],[to[0]+px,to[1]+py],[to[0]-px,to[1]-py],[from[0]-px,from[1]-py]],color);
}

function ironSpiderLegs(time){
  const armor='#654548',metal='#c99d61',highlight='#f4d59e';
  for(const side of [-1,1]){
    for(let row=0;row<3;row++){
      const flex=Math.sin(time*(3.2+row*.35)+side*1.3+row)*2.1;
      const root=[side*2.3,-2+row*2];
      const elbow=[side*(8+row),-9+row*7];
      const joint=[side*(14+row*1.2),-12+row*10+flex];
      const wrist=[side*(17+row*.7),-10+row*11+flex];
      limb(root,elbow,3.3,armor);
      limb(root,elbow,2,metal);
      limb(elbow,joint,3.3,armor);
      limb(elbow,joint,2.1,highlight);
      limb(joint,wrist,3.1,armor);
      limb(joint,wrist,1.8,metal);
      for(const [x,y] of [elbow,joint]){
        rect(x-1.25,y-1.25,2.5,2.5,armor);
        rect(x-.5,y-.5,1,1,'#fff0c6');
      }
      const gap=.8+.65*Math.sin(time*3+row+side)**2;
      for(const jaw of [-1,1]){
        const hinge=[wrist[0]+side*2,wrist[1]+jaw*gap];
        const end=[hinge[0]+side*1.2,hinge[1]-jaw*.65];
        limb(wrist,hinge,1.45,highlight);
        limb(hinge,end,1.25,metal);
      }
    }
  }
}

function spiderSprite(x,y,angle,pose,facing,time) {
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  ctx.rotate(angle);
  ironSpiderLegs(time);
  const shadow='#492233',red='#c93c4a',bright='#ed6361',blue='#2f4675',gold='#e9b972';
  for(const [hip,knee,foot] of pose.legs){
    limb(hip,knee,4.2,'#202c4d');
    limb(hip,knee,2.8,blue);
    limb(knee,foot,3.6,shadow);
    limb(knee,foot,2.2,red);
    rect(foot[0]-1,foot[1]-1,3,2,'#97313d');
    rect(knee[0]-.5,knee[1]-.5,1,1,'#715862');
  }
  for(const [shoulder,elbow,hand] of pose.arms){
    limb(shoulder,elbow,4.2,shadow);
    limb(shoulder,elbow,2.6,red);
    limb(elbow,hand,3.3,shadow);
    limb(elbow,hand,1.9,bright);
    limb(elbow,[lerp(elbow[0],hand[0],.36),lerp(elbow[1],hand[1],.36)],1,gold);
    rect(hand[0]-1,hand[1]-1,2,2,'#c6494c');
  }
  pixels([[-4.7,-3],[-2.8,-4],[2.8,-4],[4.7,-3],[3.6,1.7],[2.8,5],[-2.8,5],[-3.6,1.7]],shadow);
  pixels([[-4,-2.8],[0,-3.1],[4,-2.8],[3,1.9],[0,3],[-3,1.9]],red);
  pixels([[-4,-2.8],[-2.3,-2.5],[-2.1,2.1],[0,3],[-2.8,4.5],[-3.4,1.6]],blue);
  pixels([[4,-2.8],[2.3,-2.5],[2.1,2.1],[0,3],[2.8,4.5],[3.4,1.6]],blue);
  rect(-.6,-1.5,1.2,3.3,gold);
  for(const side of [-1,1]){
    limb([0,-.1],[side*3.5,-2.2],.75,gold);
    limb([0,.9],[side*2.5,2.5],.65,gold);
    limb([side*2.5,2.5],[side*3.1,3.8],.6,gold);
  }
  const headTurn=facing*1.4;
  ctx.translate(headTurn,0);
  pixels([[-2.4,-10.8],[2.1,-10.8],[3.8,-9.4],[4,-6.8],[2.3,-4.5],[0,-4],[-2.6,-4.5],[-4,-6.8],[-3.7,-9.1]],shadow);
  pixels([[-2.2,-10],[2,-10],[3.2,-8.8],[3.1,-6.7],[1.5,-5.2],[-.3,-4.8],[-2.5,-5.7],[-3.2,-7],[-3.1,-8.7]],red);
  pixels([[-2.7,-9.1],[-1.3,-9.9],[1,-9.9],[.4,-9.1],[-1.8,-8.7]],bright);
  if(headTurn<1.25) pixels([[-3,-8.4],[-.8,-7.5],[-1.4,-6.4],[-2.7,-6.9]],'#fff2e2');
  if(headTurn>-1.25) pixels([[3,-8.4],[.8,-7.5],[1.4,-6.4],[2.7,-6.9]],'#fff2e2');
  ctx.restore();
}
function wrist(x,y,angle,hand){
  const dx=hand[0],dy=hand[1];
  return [x+dx*Math.cos(angle)-dy*Math.sin(angle),y+dx*Math.sin(angle)+dy*Math.cos(angle)];
}

const nyAlarmStart=3.8,nyAlarmEnd=5.6;
const nySpiderStart=7,nyBossStart=22;
const bossRevealBeat=8.5;
const webStrikeBeat=12.8,bossHitBeat=12.96,bossEscapeBeat=16.1,bossExitBeat=20.5;

function cityWarning(time,progress){
  const danger=smooth(progress/.2)*(1-smooth((progress-.8)/.2));
  ctx.save();
  ctx.globalAlpha=danger*(.12+.14*Math.sin(time*2.7)**2);
  for(const [x,y,w,h] of [[91,68,17,29],[111,76,14,22],[129,64,15,31],[162,72,16,24]]){
    rect(x,y,w,h,'#283757');
    rect(x,y+((time*13)%h),w,2,'#c9ba88');
  }
  ctx.globalAlpha=danger*.46;
  for(let i=0;i<15;i++){
    const x=95+i*13,y=97+Math.sin(i*2.7)*7;
    rect(x,y,2,1,i%3===0?'#ffc199':'#93ceb1');
  }
  ctx.restore();
}

const chapters=[
  {label:'Central Park · Earth Elemental',begin:nyAlarmEnd,end:10.1,cueLead:2.2,x:62,y:84,color:'#bd9567',draw:earthElement,damage:earthDamage,ground:107,reveal:26},
  {label:'Times Square · Fire Elemental',begin:10.3,end:14.4,cueLead:.75,x:132,y:78,color:'#f87951',draw:fireElement,damage:fireDamage,ground:100,reveal:12},
  {label:'Midtown skyline · Air Elemental',begin:14.6,end:18.5,cueLead:.75,x:193,y:72,color:'#b7cde0',draw:windElement,damage:windDamage,ground:91,reveal:18},
  {label:'East River · Water Elemental',begin:18.7,end:21.9,cueLead:.75,x:265,y:87,color:'#5ebedb',draw:waterElement,damage:waterDamage,ground:110,reveal:28}
];

function earthElement(time){
  const bob=Math.sin(time*2)*1.7;
  pixels([[-20,14],[-19,-3],[-10,-14],[-7,-23],[7,-23],[12,-14],[19,-6],[21,12],[11,18],[-10,18]],'#534455');
  pixels([[-17,6],[-14,-8],[-8,-15],[1,-17],[8,-13],[13,-3],[16,13],[4,17],[-8,12]],'#96735d');
  pixels([[-7,-21],[5,-21],[9,-13],[4,-8],[-6,-9],[-10,-14]],'#d0aa79');
  pixels([[-22,5+bob],[-15,-1+bob],[-9,4+bob],[-9,10+bob],[-20,13+bob]],'#a98467');
  pixels([[11,4-bob],[17,-3-bob],[23,1-bob],[24,8-bob],[17,12-bob]],'#a98467');
  rect(-5,-15,3,1,'#fff0ac');rect(2,-15,3,1,'#fff0ac');
  line(-6,-7,2,3,'#f2ba75');line(2,3,-1,9,'#f2ba75');
  for(let i=0;i<8;i++) rect(-25+i*7,-3+Math.sin(time*1.6+i)*6,2+i%2,2,'#d8ae8a');
}

function fireElement(time){
  const flicker=Math.sin(time*6)*3;
  pixels([[-18,17],[-16,5],[-21,-8],[-12,-3],[-10,-16],[-13,-22+flicker],[-3,-18],[2,-29-flicker],[9,-15],[16,-16],[14,-6],[22,-10],[18,9],[14,17]],'#b63e49');
  pixels([[-14,16],[-10,2],[-13,-6],[-6,-4],[-3,-15],[2,-22-flicker],[8,-10],[12,-6],[14,1],[11,15]],'#f67b4d');
  pixels([[-9,15],[-5,6],[-6,-3],[0,-8],[4,-13],[8,-5],[6,3],[10,13]],'#ffd07a');
  rect(-6,-5,3,2,'#5a2d44');rect(4,-5,3,2,'#5a2d44');
  for(let i=0;i<14;i++) rect(Math.sin(i*2.4)*24,15-(time*8+i*6)%45,1+i%2,2,i%3?'#f49b68':'#ffe3a2');
}

function windElement(time){
  for(let j=0;j<12;j++){
    const y=j*3-22;
    const width=5+(11-j)*1.6;
    const spin=Math.sin(time*4-j*.56);
    rect(spin*4-width,y,width*2,2,j%3?'#9cbbd3':'#d8e6ed');
    rect(spin*width,y-1,7,1,'#eef7ee');
    rect(-spin*width,y+1,4,1,'#6b789b');
  }
  rect(-7,-13,4,2,'#31465e');rect(4,-13,4,2,'#31465e');
  for(let i=0;i<9;i++) rect(Math.cos(time*3+i*2.4)*(23+i%3),-13+Math.sin(time*3+i*2.4)*8,4,1,'#e9eff1');
}

function waterElement(time){
  const curl=Math.sin(time*2.6)*3;
  pixels([[-27,16],[-21,9],[-17,4],[-18,-8],[-10,-20],[-1,-25],[9,-23],[17,-16],[17,-8],[10,-12],[5,-12],[9,-5],[19,-1],[27,13],[23,18]],'#327391');
  pixels([[-23,14],[-16,7],[-13,-2],[-13,-10],[-5,-20],[2,-21],[10,-18],[14,-13],[8,-15],[0,-13],[-2,-4],[6,1],[15,3],[21,14]],'#59b9d3');
  pixels([[-13,-9],[-8,-18],[-1,-22],[6,-23+curl],[12,-19],[17,-15],[15,-12],[11,-15],[5,-17],[-2,-16]],'#d4f7f5');
  pixels([[-18,11],[-10,5],[-4,8],[1,5],[11,7],[22,11],[24,15],[17,13],[10,12],[4,13],[-4,11],[-12,13]],'#a5e3e6');
  rect(-9,-7,3,2,'#203a55');rect(1,-7,3,2,'#203a55');
  for(let i=0;i<10;i++) rect(-27+i*6,10+Math.sin(time*4+i)*5,2,1,'#e3fbf5');
}

function earthDamage(age){
  // The corner masonry breaks loose, leaving an exposed edge and debris below.
  pixels([[76,45],[83,45],[83,69],[79,65],[80,58],[76,56],[77,51]],'#292639');
  line(76,45,77,51,'#d5a98c');
  line(77,51,75,55,'#d5a98c');
  line(75,55,79,60,'#d5a98c');
  line(79,60,77,67,'#927479');
  for(let i=0;i<12;i++){
    const fall=clamp((age-i*.045)/.94);
    const x=78+i*.6+fall*(2+i*1.6);
    const y=Math.min(101+i%3,46+i%4+fall**2*57);
    const size=2+i%4;
    rect(x,y,size,Math.max(2,size-1),i%2?'#a48479':'#68596b');
    rect(x,y,Math.max(1,size-1),1,'#d7a78d');
  }
}

function fireDamage(age){
  for(const [x,y,delay] of [[98,76,0],[105,90,.22],[150,59,.36],[154,79,.68]]){
    const heat=smooth((age-delay)/.48);
    if(heat===0) continue;
    const height=(10+3*Math.sin(age*13+x))*heat;
    rect(x-4,y-2,9,6,'#432a3a');
    pixels([[x-4,y+2],[x-4,y-height*.55],[x-1,y-height*.35],[x+1,y-height],[x+5,y-height*.37],[x+4,y+2]],'#f37149');
    pixels([[x-2,y+2],[x,y-height*.54],[x+2,y-height*.19],[x+3,y+2]],'#ffe3a0');
    for(let i=0;i<4;i++){
      const rise=(age*19+i*5)%22;
      rect(x+Math.sin(i*2+x)*6-rise*.17,y-rise,1,1,i%2?'#ffac65':'#fff0b2');
    }
  }
}

function windDamage(age){
  const torn=smooth(age/.32);
  rect(162,72,16,24,'#3b354d');
  for(const x of [164,175]) rect(x,74,1,20,'#8f748f');
  for(let i=0;i<5;i++){
    const lift=clamp((age-i*.085)/1.7);
    const x=164+i*2+lift*(58+i*5);
    const y=74+i*3-Math.sin(lift*Math.PI)*25-lift*22;
    ctx.save();
    ctx.globalAlpha*=1-smooth((lift-.72)/.28);
    ctx.translate(x,y);
    ctx.rotate(lift*(4+i));
    rect(0,0,6+i,4,'#a384de');
    rect(1,1,4+i,1,'#e4d1f4');
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha*=torn*.5;
  for(let i=0;i<7;i++) rect(157+(age*43+i*17)%107,54+i*6,12+i%3,1,'#d5e7ee');
  ctx.restore();
}

function waterDamage(age){
  const surge=smooth(age/.82);
  const left=252-65*surge;
  const edge=120+9*surge;
  const crest=106-3*Math.sin(age*7);
  const wave=[[left,edge-5],[left+11,edge-10],[left+23,crest],[258,crest-4],[289,crest],[320,crest+2],[320,edge],[left+26,edge+1]];
  pixels(wave,'#437e9d');
  line(left,edge-5,left+11,edge-10,'#b1e6e7');
  line(left+11,edge-10,left+23,crest,'#b1e6e7');
  line(left+23,crest,258,crest-4,'#d7f5ef');
  for(let i=0;i<13;i++){
    const x=left+12+(age*26+i*19)%(305-left);
    rect(x,crest+4+i%4*4,4+i%4,1,i%3?'#75afc3':'#c3e9e7');
  }
}

function elementCue(chapter,time){
  const emerging=smooth((time-chapter.begin+chapter.cueLead)/chapter.cueLead)*(1-smooth((time-chapter.begin)/.9));
  if(emerging<=0) return;
  ctx.save();
  ctx.globalAlpha=emerging*.65;
  const {x,ground,color}=chapter;
  if(chapter.draw===earthElement){
    const reach=emerging*24;
    line(x-reach,ground,x-4,ground-4,'#514857');
    line(x-4,ground-4,x+4,ground+1,'#514857');
    line(x+4,ground+1,x+reach,ground-2,'#514857');
    rect(x-6,ground-4,8,1,color);
  }else if(chapter.draw===fireElement){
    for(let i=0;i<9;i++){
      const lift=(time*10+i*7)%21;
      rect(x+Math.sin(i*8)*17,ground-lift,1+i%2,2,color);
    }
    rect(x-19,ground,38,1,'#f29d60');
  }else if(chapter.draw===windElement){
    for(let i=0;i<6;i++){
      const offset=(time*24+i*17)%86;
      rect(x-43+offset,ground-13+i*2,6+i%3,1,color);
    }
  }else{
    for(let i=0;i<5;i++){
      const width=9+(time*16+i*6)%42;
      const y=ground+i*2;
      rect(x-width*.62,y,width,1,i%2?color:'#bfe9ed');
    }
  }
  ctx.restore();
}

function elementScenes(time){
  let active=null;
  for(const chapter of chapters){
    elementCue(chapter,time);
    const weight=smooth((time-chapter.begin)/.9)*smooth((chapter.end-time)/.85);
    if(weight<=0) continue;
    ctx.save();
    ctx.globalAlpha=weight*.18;
    rect(0,0,320,144,chapter.color);
    const impact=time-chapter.begin-.72;
    if(impact>0){
      ctx.globalAlpha=weight*smooth(impact/.28)*.92;
      chapter.damage(impact);
    }
    ctx.globalAlpha=weight*.94;
    const settled=chapter.draw===windElement?Math.sin(time*2)*2:0;
    transformed(chapter.x,chapter.y+(1-weight)*chapter.reveal+settled,1.25,()=>{
      ctx.beginPath();
      ctx.rect(-40,-52,80,(chapter.ground-chapter.y+(weight-1)*chapter.reveal-settled)/1.25+52);
      ctx.clip();
      chapter.draw(time);
    });
    ctx.restore();
    active=chapter;
  }
  return active;
}

function mysterio(time){
  const reveal=smooth((time-bossRevealBeat)/3);
  const escape=clamp((time-bossEscapeBeat)/(bossExitBeat-bossEscapeBeat));
  const travel=escape**1.55;
  const presence=reveal*(1-smooth((escape-.92)/.08));
  if(presence===0) return null;
  const hoverTime=Math.min(time,bossEscapeBeat);
  const hitAge=time-bossHitBeat;
  const recoil=smooth(hitAge/.19)*(1-smooth((hitAge-.19)/.82));
  const x=254-65*smooth((hoverTime-12)/5)+Math.sin(hoverTime*.72)*5-16*recoil+222*travel;
  const y=48-14*reveal+Math.sin(hoverTime*1.2)*2+5*recoil-52*escape**1.25;
  ctx.save();
  if(escape>0){
    ctx.globalAlpha=presence*smooth(escape/.16)*.57;
    for(let i=0;i<9;i++){
      const x0=x-15-i*5,y0=y+12+i*2+Math.sin(time*8+i)*2;
      rect(x0,y0,9-i%4,1,i%3?'#8ff5bb':'#d4b5ff');
    }
  }
  ctx.globalAlpha=presence*(1-smooth(escape/.15))*.65;
  for(let i=0;i<40;i++){
    const angle=i*Math.PI/20+time*.24;
    const radius=36+4*Math.sin(time*.9);
    rect(x+Math.cos(angle)*radius,y+9+Math.sin(angle)*radius*.57,2,i%3===0?2:1,i%4===0?'#d4b5ff':'#8ff5bb');
  }
  ctx.globalAlpha=presence;
  transformed(x,y,2.05+reveal*.30-travel*.85,()=>{
    const ripple=Math.sin(time*2+(time-hoverTime)*5)*(3+escape*3);
    pixels([[-5,-3],[-14,5],[-24,14],[-18,24+ripple],[-10,19],[0,22],[12,17],[22,20-ripple],[16,9],[8,-3]],'#513666');
    pixels([[-5,-2],[-12,7],[-16,19+ripple],[-7,16],[-1,20],[6,14],[15,15-ripple],[11,6],[6,-2]],'#805493');
    limb([-4,0],[-10,4],3,'#54b58b');
    limb([4,0],[10,4],3,'#54b58b');
    rect(-12,3,3,3,'#c3f7d5');
    rect(9,3,3,3,'#c3f7d5');
    pixels([[-5,-2],[5,-2],[5,7],[2,12],[-2,12],[-5,7]],'#367960');
    rect(-4,6,8,2,'#d1a975');
    pixels([[-5,-7],[-4,-11],[-2,-13],[3,-13],[5,-11],[6,-7],[4,-3],[-3,-3]],'#658fa4');
    pixels([[-4,-8],[-3,-11],[-1,-12],[2,-12],[4,-10],[4,-6],[2,-4],[-2,-4],[-4,-6]],'#c4e8df');
    rect(-3,-10,2,2,'#f5fcf4');
    if(hitAge>=0){
      line(2,-11,0,-8,'#543d69');
      line(0,-8,2,-7,'#543d69');
      line(2,-7,1,-5,'#543d69');
      line(0,-8,-3,-7,'#795286');
    }
  });
  ctx.restore();
  return {x,y,presence};
}

function spiderStrike(x,y,age){
  if(age<0 || age>=.86) return;
  const strength=smooth(age/.07)*(1-smooth((age-.16)/.70));
  ctx.save();
  ctx.globalAlpha=strength;
  const radius=4+age*27;
  for(let i=0;i<10;i++){
    const angle=i*Math.PI/5;
    const dx=Math.cos(angle),dy=Math.sin(angle);
    line(x+dx*radius,y+dy*radius,x+dx*(radius+6+i%3),y+dy*(radius+6+i%3),i%3?'#e2f3ff':'#ffad75');
    rect(x+dx*(radius+11),y+dy*(radius+11),2,1,'#9ceed6');
  }
  if(age<.21){
    rect(x-1,y-6,3,13,'#fff4d3');
    rect(x-6,y-1,13,3,'#fff4d3');
  }
  ctx.restore();
}

function interaction(time) {
  const boss=mysterio(time);
  // The physical ledge stays in front of Mysterio's projection.
  bridgeTower(283,92);
  const index=chase.findIndex(part=>time>=part.start && time<part.end);
  if(index<0) return;
  const segment=chase[index];
  const t=clamp((time-segment.start)/(segment.end-segment.start));
  const [x,y]=flightPoint(index,t);
  const [beforeX,beforeY]=chasePoint(time-.025);
  const [afterX,afterY]=chasePoint(time+.025);
  const grounded=smooth((time-11.85)/.35)*(1-smooth((time-13.85)/.32));
  const facing=lerp(Math.tanh((afterX-beforeX)*1.4),-.82,grounded);
  let counterTarget;
  if(boss && boss.presence>.25){
    const fx=boss.x,fy=boss.y+5;
    if(time>=9.4 && time<bossHitBeat){
      const burst=(time-9.4)%1.15;
      const p=burst/1.15;
      for(let i=0;i<3;i++){
        const px=fx+(x-fx)*p+i*2,py=fy+(y-fy)*p-i*2;
        rect(px,py,3,2,i===1?'#d9ffb4':'#77d6a3');
      }
    }
    if(time>=webStrikeBeat && time<13.5) counterTarget=[fx+2,boss.y-15];
    spiderStrike(fx+2,boss.y-15,time-bossHitBeat);
  }
  const takeHold=segment.web ? (segment.start===14.75?1:smooth(t/.16))*smooth((1-t)/.18) : 0;
  const folded=Math.sin(t*Math.PI)**2;
  const freePose=blendPose(spiderPoses.dive,spiderPoses.tuck,folded);
  const onWebPose=blendPose(spiderPoses.reach,spiderPoses.swing,folded);
  const takeoffBlend=time>=14.18 && time<14.75?smooth((time-14.18)/.57):0;
  const pose=blendPose(blendPose(freePose,onWebPose,Math.max(takeHold,takeoffBlend)),spiderPoses.plant,grounded);
  const travelLean=Math.atan2(afterY-beforeY,Math.abs(afterX-beforeX)+.2);
  const hangLean=segment.web ? Math.atan2(x-segment.web[0],y-segment.web[1]) : 0;
  const airborneLean=facing*(.2+folded*.68+travelLean*.22);
  const departure=time>=13.55 && time<14.75;
  const join=smooth((time-14.18)/.57)*(departure?1:0);
  const launchLean=-Math.atan2(x-232,y-45)*.64;
  const angle=lerp(lerp(lerp(airborneLean,-hangLean*.64,takeHold),launchLean,join),0,grounded);
  const departureAnchor=departure ? [232,45] : null;
  const target=counterTarget || departureAnchor || segment.web;
  const arm=counterTarget?0:1;
  const launchWeight=departure?smooth((time-13.55)/.28):0;
  if(target) aimWrist(pose,arm,x,y,angle,target,counterTarget ? .85 : Math.max(takeHold,launchWeight));
  const hand=wrist(Math.round(x),Math.round(y),angle,pose.arms[arm][2]);
  if(segment.web){
    const fired=segment.start===14.75 ? 1 : smooth((t-.035)/.11);
    const letGo=smooth((t-.88)/.12);
    const looseEnd=hand.map((value,i)=>lerp(value,segment.web[i],letGo*.3));
    webStrand(looseEnd,segment.web,fired,letGo*4,1-letGo);
  }
  if(departure) webStrand(hand,departureAnchor,smooth((time-13.68)/.18),(1-launchWeight)*2);
  if(counterTarget){
    const reach=smooth((time-webStrikeBeat)/(bossHitBeat-webStrikeBeat));
    const release=smooth((13.5-time)/.2);
    webStrand(hand,counterTarget,reach,1,release);
    webStrand([hand[0],hand[1]+1],counterTarget,reach*.97,-3,release*.8);
  }
  if(grounded>.7){
    ctx.save();
    ctx.globalAlpha=(grounded-.7)*1.4;
    rect(282,64,9,1,'#494052');
    ctx.restore();
  }
  spiderSprite(x,y,angle,pose,facing,time);
}

function trainPosition(time){
  return -258+time*13.9;
}

function nyActionTime(time){
  if(time<nySpiderStart) return -1;
  if(time<nyBossStart){
    const progress=(time-nySpiderStart)/(nyBossStart-nySpiderStart);
    return bossRevealBeat*(progress+.9*progress*(1-progress)**2);
  }
  const after=time-nyBossStart;
  const initialSpeed=bossRevealBeat/(nyBossStart-nySpiderStart);
  // Bring the chase up to full speed during the boss's reveal without jumping a frame.
  const ramp=Math.min(1,after);
  return bossRevealBeat+initialSpeed*ramp+(1-initialSpeed)*ramp*ramp/2+(after-ramp);
}

function warningLabel(time,chapter){
  if(time>=nyAlarmStart && time<nyAlarmEnd) return 'Danger · Unusual activity near Central Park';
  if(time>=8.35 && time<9.55) return 'Spider-Man · Incoming';
  if(chapter) return chapter.label;
  const action=nyActionTime(time);
  if(action>bossRevealBeat && action<bossHitBeat) return 'Mysterio · Final encounter';
  if(action>=bossHitBeat && action<bossEscapeBeat) return 'Spider-Man · Web strike hits Mysterio';
  if(action>=bossEscapeBeat && action<bossExitBeat) return 'Mysterio · Escaping over the skyline';
  return '';
}

const stage=$('#stage');
const manhattanView=$('#manhattan-view');
const manhattanControls=$('#manhattan-controls');
const manhattan3dHost=$('#manhattan-3d');
const manhattan3dStatus=$('#manhattan-3d-status');
let manhattan3d=null, loadingManhattan3d=false;
const motion=$('#motion');
const alert=$('#alert');
const fullscreen=$('#fullscreen');
const cycle=$('#cycle');
const season=$('#season');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches, automatic=true, frame=0, elapsed=0, last=null, vegasDisplayStart=0, nyStoryStart=0;
let skyPhase=0,nightBlend=0;
const dayDuration=48;
const layers=[canvas,nightCanvas].map(target=>{
  const skyBuffer=document.createElement('canvas');
  const terrain=document.createElement('canvas');
  skyBuffer.width=terrain.width=target.width;
  return {canvas:target,target:target.getContext('2d',{alpha:false}),skyBuffer,terrain};
});
const snowRandom=rng(204);
const flakes=Array.from({length:166},(_,index)=>({
  x:snowRandom()*332-6,y:snowRandom(),phase:snowRandom()*Math.PI*2,
  size:index<112?1:index%4===0?3:2,speed:snowRandom()*9
}));

function snowfall(layer,foreground){
  const top=-layer.offset/2-4;
  const span=layer.canvas.height/2+8;
  // The gust changes lateral drift while gravity keeps each flake moving down.
  const gust=12*Math.sin(elapsed*.84)+6*Math.sin(elapsed*1.68);
  for(const {x,y,phase,size,speed} of flakes){
    if((size>1)!==foreground) continue;
    const drift=(4+size*2)*elapsed+gust*size+Math.sin(elapsed*1.5+phase)*size*2;
    const left=((x+drift)%332+332)%332-6;
    const row=top+(y*span+elapsed*(7+size*4+speed))%span;
    if(size===1) rect(left,row,1,1,'#bacbdce0');
    else if(size===2) rect(left,row,2,2,'#e2edf5ec');
    else{
      rect(left+1,row,1,3,'#f6fbfff2');
      rect(left,row+1,3,1,'#f6fbfff2');
    }
  }
}

function prepare(){
  // Extend the sky and foreground on tall screens so both ends of the panorama stay visible.
  const height=Math.max(288,Math.min(1800,Math.round(640*stage.clientHeight/Math.max(1,stage.clientWidth))));
  for(const [index,layer] of layers.entries()){
    state.night=index===1;
    layer.canvas.height=height;
    layer.skyBuffer.height=height;
    layer.terrain.height=height;
    layer.offset=Math.round((height-288)*.45);
    ctx=layer.skyBuffer.getContext('2d',{alpha:false});
    ctx.fillStyle=state.night?'#0a1029':mix(twilightPalettes[state.region][state.season][0],0,0);
    ctx.fillRect(0,0,640,height);
    if(state.night && layer.offset>0){
      const random=rng(414);
      for(let i=0;i<95;i++) rect(random()*640,random()*layer.offset,1,1,i%5?'#737b9d':'#e6e6e6');
    }
    ctx.setTransform(2,0,0,2,0,layer.offset);
    sky();
    ctx=layer.terrain.getContext('2d');
    rect(0,layer.offset+288,640,height-layer.offset-288,regions[state.region].horizon);
    ctx.setTransform(2,0,0,2,0,layer.offset);
    regions[state.region].landscape();
  }
}
function updateManhattanCamera(tourTime,trainX,cabX){
  const mode=state.region==='ny'?manhattanView.value:'wide';
  const layer=layers[0];
  let zoom=1,x=160,y=72;
  if(mode==='air'){
    zoom=1.35;
    x=160-110*Math.cos(tourTime*Math.PI/18);
    y=47;
  }else if(mode==='rail'){
    zoom=1.65;
    x=lerp(trainX+238,-20,smooth((trainX-322)/100));
    y=98;
  }else if(mode==='street'){
    zoom=1.8;
    x=lerp(cabX+13,-20,smooth((cabX-322)/68));
    y=106;
  }
  // Clamp the scale origin so no empty edges enter the viewport.
  const origin=focus=>zoom===1?.5:clamp((focus*zoom-.5)/(zoom-1));
  stage.style.setProperty('--view-scale',zoom);
  stage.style.setProperty('--view-x',origin(x/320)*100+'%');
  stage.style.setProperty('--view-y',origin((y*2+layer.offset)/layer.canvas.height)*100+'%');
}

async function syncManhattanView(){
  const active=state.region==='ny' && manhattanView.value==='three';
  manhattan3dHost.hidden=!active || !manhattan3d;
  if(!active){
    manhattan3dStatus.textContent='';
    return;
  }
  if(manhattan3d){
    manhattan3dStatus.textContent='';
    return;
  }
  if(loadingManhattan3d) return;
  loadingManhattan3d=true;
  manhattan3dStatus.textContent='Loading Manhattan in 3D…';
  try{
    const {createManhattan3D}=await import('./manhattan-3d.js?v=1');
    manhattan3d=createManhattan3D(manhattan3dHost);
    await syncManhattanView();
  }catch(error){
    console.warn('Manhattan 3D could not start:',error);
    if(state.region==='ny' && manhattanView.value==='three'){
      manhattanView.value='wide';
      manhattan3dStatus.textContent='3D is unavailable on this device. Showing the panorama.';
    }
  }finally{
    loadingManhattan3d=false;
    draw();
  }
}

function draw(){
  const time=storyTime();
  const tourTime=elapsed-nyStoryStart;
  if(!manhattan3dHost.hidden && manhattan3d){
    manhattan3d.draw(tourTime,skyPhase,nightBlend);
    if(alert.textContent) alert.textContent='';
    return;
  }
  const trainX=trainPosition(tourTime%(680/13.9));
  const cabX=(tourTime*18+75)%428-38;
  updateManhattanCamera(tourTime,trainX,cabX);
  const vegasTime=elapsed-vegasDisplayStart;
  const bonusTime=(vegasTime-bonusStart+bonusWarningDuration)%bonusInterval-bonusWarningDuration;
  const vegasLucky=state.region==='lv' && bonusTime>=-bonusWarningDuration && bonusTime<0;
  const nyDanger=state.region==='ny' && time>=nyAlarmStart && time<nyAlarmEnd;
  const alarmProgress=(time-nyAlarmStart)/(nyAlarmEnd-nyAlarmStart);
  const snow=state.season===3 && state.region!=='lv';
  let chapter=null;
  for(const [index,layer] of layers.entries()){
    if((index===0 && nightBlend===1) || (index===1 && nightBlend===0)) continue;
    ctx=layer.target;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(layer.skyBuffer,0,0);
    ctx.setTransform(2,0,0,2,0,layer.offset);
    if(index===0 && skyPhase<.5) daylight(layer.offset);
    if(index===1 && state.region==='ak') aurora(time);
    celestialBody(skyPhase);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(layer.terrain,0,0);
    ctx.setTransform(2,0,0,2,0,layer.offset);
    if(snow) snowfall(layer,false);
    if(state.region==='ny'){
      if(nyDanger) cityWarning(time,alarmProgress);
      chapter=elementScenes(time);
      smallFish(time,index===1);
      nyCab(cabX,index===1);
      transformed(0,39,1,()=>{
        train(trainX,index===1);
        rect(trainX+238,67,7,7,'#864ca8');
        rect(trainX+240,68,3,1,'#fff');
        line(trainX+242,69,trainX+240,72,'#fff');
      });
      interaction(nyActionTime(time));
    }else if(state.region==='ak'){
      alaskaMotion(time,index===1);
      smallFish(time,index===1);
    }else{
      vegasMotion(time,index===1,vegasTime,bonusTime,-layer.offset/2);
      if(vegasLucky) vegasLuckyCue(1+bonusTime/bonusWarningDuration);
      vegasBonus(bonusTime,-layer.offset/2);
    }
    if(snow) snowfall(layer,true);
    if(nyDanger) dangerWarning(layer,alarmProgress);
  }
  let notice='';
  if(state.region==='ny') notice=warningLabel(time,chapter);
  if(vegasLucky) notice='Lucky streak on the Strip';
  if(state.region==='lv' && bonusTime>=jackpotAt && bonusTime<vegasStreetEnd){
    notice=bonusTime<vegasPickupAt?'Jackpot · 777':bonusTime<vegasBoardAt?'Picking up cash on the Strip':bonusTime<vegasCabLeaveAt?'Passengers boarding taxis':'Taxis leaving the Strip';
  }
  if(alert.textContent!==notice) alert.textContent=notice;
}
function animate(now){
  if(last!==null) elapsed+=Math.min(50,now-last)/1000;
  last=now;
  if(automatic) updateCycle();
  draw();
  frame=requestAnimationFrame(animate);
}
function syncAnimation(){
  motion.textContent=paused?'Resume':'Pause';
  motion.setAttribute('aria-pressed',String(paused));
  if(!paused && !document.hidden){
    if(!frame) frame=requestAnimationFrame(animate);
  }else{
    cancelAnimationFrame(frame);
    frame=0;
    last=null;
  }
}
function render(){
  const region=regions[state.region];
  manhattanControls.hidden=state.region!=='ny';
  syncManhattanView();
  $('#landmark').textContent=region.name;
  $('#landscape').setAttribute('aria-label',region.description);
  document.querySelectorAll('[data-region]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.region===state.region)));
  prepare();
  draw();
  syncAnimation();
}
manhattanView.addEventListener('change',()=>{
  syncManhattanView();
  draw();
});
$('nav').addEventListener('click',event=>{
  const place=event.target.closest('[data-region]')?.dataset.region;
  if(!Object.hasOwn(regions,place) || state.region===place) return;
  state.region=place;
  if(place==='lv') vegasDisplayStart=elapsed;
  if(place==='ny') nyStoryStart=elapsed;
  render();
});
const light=$('#light');
function storyTime(){
  const length=state.region==='ny'?38:24;
  const start=state.region==='ny'?nyStoryStart:0;
  const turn=(elapsed-start)%(length*2);
  return turn<=length ? turn : length*2-turn;
}
let cycleOffset=0;
function setAutomatic(enabled){
  const resuming=enabled&&!automatic;
  automatic=enabled;
  cycle.setAttribute('aria-pressed',String(enabled));
  cycle.textContent=enabled?'Auto cycle':'Manual';
  if(enabled){
    if(resuming) cycleOffset=elapsed-(state.season+skyPhase)*dayDuration;
    updateCycle();
    draw();
  }
  syncAnimation();
}
function updateCycle(){
  const cycleTime=Math.max(0,elapsed-cycleOffset);
  const nextSeason=Math.floor(cycleTime/dayDuration)%4;
  if(state.season!==nextSeason){
    state.season=nextSeason;
    season.value=String(nextSeason);
    prepare();
  }
  const phase=(cycleTime%dayDuration)/dayDuration;
  light.value=String(Math.floor(phase*100));
  setSkyPhase(phase);
}
function setSkyPhase(phase){
  skyPhase=phase%1;
  const height=Math.sin(skyPhase*2*Math.PI);
  const blend=smooth((.28-height)/.6);
  if(blend!==nightBlend){
    nightBlend=blend;
    stage.style.setProperty('--light',nightBlend);
  }
  const label=skyPhase<.08?'Sunrise':skyPhase<.42?'Daylight':skyPhase<.53?'Sunset':skyPhase<.68?'Moonrise':skyPhase<.92?'Night':'Before dawn';
  if(light.getAttribute('aria-valuetext')!==label) light.setAttribute('aria-valuetext',label);
}
cycle.addEventListener('click',()=>setAutomatic(!automatic));
light.addEventListener('input',()=>{
  setAutomatic(false);
  setSkyPhase(Number(light.value)/100);
  draw();
});
season.addEventListener('change',event=>{
  setAutomatic(false);
  state.season=Number(event.target.value);
  render();
});
motion.addEventListener('click',()=>{paused=!paused;syncAnimation()});
reduced.addEventListener('change',event=>{paused=event.matches;syncAnimation()});
document.addEventListener('visibilitychange',syncAnimation);
fullscreen.hidden=typeof stage.requestFullscreen!=='function' || document.fullscreenEnabled===false;
fullscreen.addEventListener('click',async()=>{
  try{
    if(document.fullscreenElement===stage) await document.exitFullscreen();
    else await stage.requestFullscreen();
  }catch{
    fullscreen.title='Fullscreen is unavailable in this browser.';
  }
});
document.addEventListener('fullscreenchange',()=>{
  const active=document.fullscreenElement===stage;
  fullscreen.textContent=active?'Exit fullscreen':'Fullscreen';
  fullscreen.setAttribute('aria-pressed',String(active));
});
let resizeFrame=0;
window.addEventListener('resize',()=>{
  cancelAnimationFrame(resizeFrame);
  resizeFrame=requestAnimationFrame(()=>{
    prepare();
    draw();
  });
});
updateCycle();
render();
