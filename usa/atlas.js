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
function celestialBody(lightLevel){
  const phase=smooth((lightLevel-.34)/.66);
  const radius=lerp(15,10,phase);
  const cx=254,cy=30;
  const tint=phase;
  for(let row=-Math.floor(radius);row<=Math.floor(radius);row++){
    const right=Math.sqrt(radius*radius-row*row);
    // The lit edge stays on the right as the daylight disk narrows to a crescent.
    const left=lerp(-right,right*.23,phase);
    const color=mix(row<4?0xfff1bb:0xffc287,row<1?0xf0f6ed:0xbdd1e6,tint);
    const first=Math.ceil(left),last=Math.floor(right);
    if(first<=last) rect(cx+first,cy+row,last-first+1,1,color);
  }
}
function aurora(time){
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(320,0);
  for(const [x,y] of [...mountainRidge].reverse()) ctx.lineTo(x,y);
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
    rect(x+7,83,12,3,'#151922');
    rect(x+59,83,12,3,'#151922');
  }
  rect(offset+237,60,11,16,'#304567');
  rect(offset+240,63,5,4,'#7ea5e2');
  rect(offset+241,76,4,3,'#fff1ad');
}

function moose(step,night,drink,moving){
  const coat = night ? '#50383d' : '#754836';
  const antler = night ? '#9a827a' : '#c0a084';
  rect(120,95,54,22,coat);
  for(const [i,x] of [124,136,158,170].entries()){
    const stride=Math.round(Math.sin(step+i*Math.PI/2)*4*moving);
    pixels([[x,112],[x+5,112],[x+stride+4,128],[x+stride-1,128]],i%2?(night?'#423039':'#583b32'):coat);
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

function bear(night,reach){
  const fur = night?'#503944':'#805743';
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
  pixels([[17,114],[22,109],[55,109],[61,114]],'#524f63');
  rect(21,108,36,3,stone);
  rect(25,104,28,4,'#746b77');
  pixels([[29,95],[49,95],[51,104],[27,104]],stone);
  rect(37,98,4,6,'#514b60');
  rect(26,94,26,2,'#c1afb0');
  // Both boots meet the pedestal, with drapery opening between them.
  rect(32,92,7,2,shade);
  rect(42,91,7,3,copper);
  pixels([[29,91],[33,80],[33,71],[34,64],[42,62],[49,68],[47,77],[48,84],[51,91],[46,92],[40,89],[37,92]],shade);
  pixels([[32,90],[36,76],[35,68],[40,64],[45,65],[46,73],[43,78],[45,86],[48,90],[42,89],[38,91]],copper);
  pixels([[36,68],[39,66],[46,72],[43,74],[36,72]],light);
  line(38,76,34,89,light);
  line(42,75,40,87,'#b3c9a4');
  line(45,79,46,88,shade);
  // Her raised right arm holds the torch, the other supports the tablet.
  pixels([[35,69],[29,60],[25,48],[22,43],[23,38],[26,39],[28,47],[31,53],[39,63]],shade);
  pixels([[24,42],[26,45],[30,55],[37,64],[34,66],[29,59],[26,50]],copper);
  rect(22,34,4,7,copper);
  rect(20,33,8,2,shade);
  pixels([[21,33],[19,27],[22,28],[24,23],[26,27],[28,29],[26,33]],'#efb963');
  pixels([[23,31],[23,28],[25,26],[26,30],[25,32]],'#fff0b5');
  rect(38,58,6,7,copper);
  pixels([[36,55],[38,51],[43,51],[46,54],[45,60],[42,62],[38,60]],shade);
  pixels([[38,54],[44,54],[44,58],[42,60],[39,59]],copper);
  rect(34,52,13,2,copper);
  const rays=[[31,51],[33,47],[36,45],[40,43],[44,45],[47,47],[50,51]];
  rays.forEach(([x,y],i)=>line(35+i*1.8,53,x,y,i%2===0?light:copper));
  pixels([[43,69],[48,67],[51,77],[45,79]],'#386961');
  line(44,70,48,68,light);
  pixels([[48,74],[49,77],[44,79],[42,77]],copper);
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
  rect(146,39,13,63,tower);
  rect(149,31,7,9,tower);
  rect(152,21,1,11,'#c4a3ab');
  for(let y=43;y<94;y+=4) rect(149,y,2,1,state.night?'#f1c379':'#a17d89');
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
}

function alaskaLandscape(){
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
      pixels([[-3,0],[-5,-2],[-5,2],[-3,1],[-1,2],[2,1],[3,0],[1,-2],[-2,-1]],night?'#83b3c5':'#a8dce0');
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
  if(night) aurora(time);
  for(let i=0;i<18;i++){
    const x=196+i*3;
    const y=110+(time*(7+i%3)+i*3)%11;
    rect(x,y,2,2,night?'#8eaac1':'#d3e5ec');
  }
  const walk=smooth((time-1.6)/10.5);
  const moving=smooth((time-1.6)/1.1)*(1-smooth((time-10.9)/1.2));
  const drink=smooth((time-12.05)/1.35)*(1-smooth((time-18.4)/1.55));
  const mooseX=-44+walk*35;
  transformed(mooseX,25,.76,()=>moose(walk*12*Math.PI,night,drink,moving));
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
  transformed(122,42,.66,()=>bear(night,spot));
  const waterColor=night?'#94bac7':'#c6e7e7';
  if(leap>=.85 && leap<1.58){
    const pre=(leap-.85)/.73;
    rect(222-pre*5,120,3+pre*3,1,waterColor);
  }
  if(leap>=1.45 && leap<2.4){
    const p=(leap-1.45)/.95;
    const x=222+21*p,y=120-45*p*(1-p);
    line(x-3,y+2,x+4,y-1,night?'#c4a0aa':'#f1b5a8');
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
    line(x-3,y-wing,x,y+1,night?'#8682a1':'#343d57');
    line(x,y+1,x+3,y-wing,night?'#8682a1':'#343d57');
  }
}

const vegasRidge=[[0,80],[12,71],[28,58],[40,65],[53,47],[66,54],[79,73],[97,66],[111,73],[131,69],[156,78],[181,62],[195,64],[213,68],[229,59],[242,44],[251,55],[270,54],[288,72],[305,63],[320,73]];
const vegasGlyphs={
  L:['100','100','100','100','111'],A:['010','101','111','101','101'],S:['111','100','111','001','111'],
  V:['101','101','101','101','010'],E:['111','100','110','100','111'],G:['111','100','101','101','111']
};
function vegasSign(night){
  rect(34,103,2,21,'#57465c');
  rect(44,103,2,21,'#57465c');
  pixels([[7,99],[24,89],[56,89],[73,99],[56,108],[24,108]],night?'#fbb7a0':'#e8aa8d');
  pixels([[10,99],[24,91],[56,91],[70,99],[56,106],[24,106]],night?'#f8ddac':'#f3d3a4');
  for(const [i,letter] of [...'LAS VEGAS'].entries()){
    const glyph=vegasGlyphs[letter];
    if(!glyph) continue;
    glyph.forEach((row,y)=>[...row].forEach((cell,x)=>{
      if(cell==='1') rect(23+i*4+x,97+y,1,1,'#9f3b60');
    }));
  }
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
  vegasSign(night);
  line(252,101,265,67,night?'#657494':'#94778b');
  line(283,101,265,67,night?'#657494':'#94778b');
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

function vegasMotion(time,night,displayTime){
  vegasSphere(displayTime,night);
  const wheelX=267,wheelY=66,wheelR=23;
  const rotation=time*.28;
  for(let i=0;i<72;i++){
    const angle=i*Math.PI/36;
    rect(wheelX+Math.cos(angle)*wheelR,wheelY+Math.sin(angle)*wheelR,1,1,night?'#9cbaf0':'#a991a6');
  }
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6+rotation;
    const x=wheelX+Math.cos(angle)*wheelR,y=wheelY+Math.sin(angle)*wheelR;
    line(wheelX,wheelY,x,y,night?'#505682':'#81667e');
    rect(x-1,y-1,3,2,night?'#f7cfdb':'#c8aab7');
  }
  rect(wheelX-1,wheelY-1,3,3,night?'#f8d3e9':'#dab0b1');

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
  for(const [offset,velocity,lane,color] of [[-20,21,126,'#ca8aa8'],[118,18,126,'#bbb8ce'],[290,-26,138,'#608dac']]){
    const x=((offset+velocity*time)%356+356)%356-18;
    rect(x,lane,10,3,color);
    rect(x+2,lane-1,5,1,'#78889e');
    if(night){
      rect(x+(velocity>0?9:0),lane+1,2,1,'#ffe6bb');
      rect(x+(velocity>0?0:9),lane+1,1,1,'#eb7398');
    }
  }
}

const regions={
  ny:{name:'New York',description:'New York skyline with the Statue of Liberty, Brooklyn Bridge, Central Park, Times Square, an elevated train, four Elementals, Iron Spider, and Mysterio.',landscape:nyLandscape,horizon:'#293247'},
  ak:{name:'Alaska',description:'Alaska with snowy peaks, a glacial fjord, a cabin in the woods, a moose, and a brown bear.',landscape:alaskaLandscape,horizon:'#20323e'},
  lv:{name:'Las Vegas',description:'A desert skyline with the neon Las Vegas Strip, animated fountains, the High Roller observation wheel, and the Sphere cycling between a yellow smiley, the Moon, and a basketball.',landscape:vegasLandscape,horizon:'#1c1d33'}
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

function ironSpiderLegs(time,webHold){
  const deployment=smooth((time-5.7)/1.4)*(1-smooth((time-19)/1.5));
  if(deployment<=0) return;

  const armor='#654548',metal='#c99d61',highlight='#f4d59e';
  for(const side of [-1,1]){
    for(let row=0;row<3;row++){
      const delay=row*.1;
      const amount=smooth((deployment-delay)/(1-delay))*(1-webHold*.30);
      if(amount<=0) continue;
      const flex=Math.sin(time*(3.2+row*.35)+side*1.3+row)*2.1;
      const root=[side*2.3,-2+row*2];
      const elbow=[side*lerp(4,8+row,amount),lerp(-4+row*3,-9+row*7,amount)];
      const joint=[side*lerp(5,14+row*1.2,amount),lerp(-2+row*3,-12+row*10+flex,amount)];
      const wrist=[side*lerp(5,17+row*.7,amount),lerp(1+row*2,-10+row*11+flex,amount)];
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
      const gap=amount*(.8+.65*Math.sin(time*3+row+side)**2);
      for(const jaw of [-1,1]){
        const hinge=[wrist[0]+side*2,wrist[1]+jaw*gap];
        const end=[hinge[0]+side*1.2,hinge[1]-jaw*.65];
        limb(wrist,hinge,1.45,highlight);
        limb(hinge,end,1.25,metal);
      }
    }
  }
}

function spiderSprite(x,y,angle,pose,facing,time,webHold) {
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  ctx.rotate(angle);
  ironSpiderLegs(time,webHold);
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

function cityWarning(time){
  const danger=smooth((time-.35)/1.7)*(1-smooth((time-16)/6));
  if(danger===0) return;
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
  {label:'Central Park · Earth Elemental',begin:23,end:139,x:62,y:84,color:'#bd9567',draw:earthElement,ground:107,reveal:26},
  {label:'Times Square · Fire Elemental',begin:113,end:241,x:132,y:78,color:'#f87951',draw:fireElement,ground:100,reveal:12},
  {label:'Midtown skyline · Air Elemental',begin:215,end:343,x:193,y:72,color:'#b7cde0',draw:windElement,ground:91,reveal:18},
  {label:'East River · Water Elemental',begin:317,end:475,x:265,y:87,color:'#5ebedb',draw:waterElement,ground:110,reveal:28}
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

function elementCue(chapter,time,front){
  const emerging=smooth((front-chapter.begin+18)/35)*(1-smooth((front-chapter.end+27)/27));
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

function elementScenes(time,front){
  let active=null;
  let strength=0;
  for(const chapter of chapters){
    elementCue(chapter,time,front);
    const weight=smooth((front-chapter.begin)/24)*(1-smooth((front-chapter.end+28)/28));
    if(weight<=0) continue;
    ctx.save();
    ctx.globalAlpha=weight*.18;
    rect(0,0,320,144,chapter.color);
    ctx.globalAlpha=weight*.94;
    const settled=chapter.draw===windElement?Math.sin(time*2)*2:0;
    transformed(chapter.x,chapter.y+(1-weight)*chapter.reveal+settled,1.25,()=>{
      ctx.beginPath();
      ctx.rect(-40,-52,80,(chapter.ground-chapter.y+(weight-1)*chapter.reveal-settled)/1.25+52);
      ctx.clip();
      chapter.draw(time);
    });
    ctx.restore();
    if(weight>strength){active=chapter;strength=weight}
  }
  return active;
}

function mysterio(time){
  const reveal=smooth((time-8.5)/3);
  const retreat=smooth((time-16.1)/5);
  const presence=reveal*(1-retreat);
  if(presence===0) return null;
  const x=254-65*smooth((time-12)/5)+Math.sin(time*.72)*5,y=48-14*reveal-6*retreat+Math.sin(time*1.2)*2;
  ctx.save();
  ctx.globalAlpha=presence*.65;
  for(let i=0;i<40;i++){
    const angle=i*Math.PI/20+time*.24;
    const radius=36+4*Math.sin(time*.9);
    rect(x+Math.cos(angle)*radius,y+9+Math.sin(angle)*radius*.57,2,i%3===0?2:1,i%4===0?'#d4b5ff':'#8ff5bb');
  }
  ctx.globalAlpha=presence;
  transformed(x,y,2.05+reveal*.30,()=>{
    const ripple=Math.sin(time*2)*3;
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
  });
  ctx.restore();
  return {x,y,presence};
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
    if(time>=9.4 && time<13.6){
      const burst=(time-9.4)%1.15;
      const p=burst/1.15;
      for(let i=0;i<3;i++){
        const px=fx+(x-fx)*p+i*2,py=fy+(y-fy)*p-i*2;
        rect(px,py,3,2,i===1?'#d9ffb4':'#77d6a3');
      }
    }
    if(time>=12.8 && time<13.5) counterTarget=[fx,fy];
    if(time>=13 && time<=14.8){
      for(let i=0;i<8;i++){
        const angle=i*Math.PI/4;
        const radius=4+(time-13)*7;
        line(fx+Math.cos(angle)*radius,fy+Math.sin(angle)*radius,fx+Math.cos(angle)*(radius+4),fy+Math.sin(angle)*(radius+4),'#d8ffd2');
      }
    }
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
  if(counterTarget) webStrand(hand,counterTarget,smooth((time-12.8)/.14)*smooth((13.5-time)/.15),1);
  if(grounded>.7){
    ctx.save();
    ctx.globalAlpha=(grounded-.7)*1.4;
    rect(282,64,9,1,'#494052');
    ctx.restore();
  }
  spiderSprite(x,y,angle,pose,facing,time,Math.max(takeHold,grounded*.55));
}

function trainPosition(time){
  return -258+time*24.3;
}

function warningLabel(time,chapter){
  if(chapter) return chapter.label;
  if(time>=.8 && time<3) return 'No. 7 train · Unusual signal ahead';
  if(time>=18 && time<21) return 'Mysterio · Projection fading';
  return '';
}

const stage=$('#stage');
const motion=$('#motion');
const alert=$('#alert');
const fullscreen=$('#fullscreen');
const cycle=$('#cycle');
const season=$('#season');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches, automatic=true, frame=0, elapsed=0, last=null, vegasDisplayStart=0;
let lightLevel=.15;
const layers=[canvas,nightCanvas].map(target=>{
  const buffer=document.createElement('canvas');
  buffer.width=target.width;
  buffer.height=target.height;
  return {canvas:target,target:target.getContext('2d',{alpha:false}),buffer,base:buffer.getContext('2d',{alpha:false})};
});
const snowRandom=rng(204);
const flakes=Array.from({length:88},()=>[snowRandom()*320,snowRandom()*144,7+snowRandom()*14,snowRandom()*6.28]);

function prepare(){
  // Extend the sky and foreground on tall screens so both ends of the panorama stay visible.
  const height=Math.max(288,Math.min(1800,Math.round(640*stage.clientHeight/Math.max(1,stage.clientWidth))));
  for(const [index,layer] of layers.entries()){
    state.night=index===1;
    ctx=layer.base;
    layer.canvas.height=height;
    layer.buffer.height=height;
    layer.offset=Math.round((height-288)*.45);
    const horizon=regions[state.region].horizon;
    ctx.fillStyle=horizon;
    ctx.fillRect(0,0,640,height);
    ctx.fillStyle=state.night?'#0a1029':mix(twilightPalettes[state.region][state.season][0],0,0);
    ctx.fillRect(0,0,640,layer.offset);
    if(state.night && layer.offset>0){
      const random=rng(414);
      for(let i=0;i<95;i++) rect(random()*640,random()*layer.offset,1,1,i%5?'#737b9d':'#e6e6e6');
    }
    ctx.setTransform(2,0,0,2,0,layer.offset);
    sky();
    regions[state.region].landscape();
  }
}
function draw(){
  const time=storyTime();
  let chapter=null;
  for(const [index,layer] of layers.entries()){
    ctx=layer.target;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(layer.buffer,0,0);
    ctx.setTransform(2,0,0,2,0,layer.offset);
    celestialBody(lightLevel);
    if(state.region==='ny'){
      const trainX=trainPosition(time);
      cityWarning(time);
      chapter=elementScenes(time,trainX+251);
      smallFish(time,index===1);
      transformed(0,39,1,()=>{
        train(trainX,index===1);
        rect(trainX+238,67,7,7,'#864ca8');
        rect(trainX+240,68,3,1,'#fff');
        line(trainX+242,69,trainX+240,72,'#fff');
      });
      interaction(time);
    }else if(state.region==='ak'){
      alaskaMotion(time,index===1);
      smallFish(time,index===1);
    }else vegasMotion(time,index===1,elapsed-vegasDisplayStart);
    if(state.season===3 && state.region!=='lv'){
      for(const [x,y,speed,phase] of flakes) {
        const size=speed>18?2:1;
        rect((x+Math.sin(elapsed*.8+phase)*3+320)%320,(y+elapsed*speed)%144,size,size,size===2?'#e6f3f9':'#acbdcf');
      }
    }
  }
  const notice=state.region==='ny'?warningLabel(time,chapter):'';
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
  $('#landmark').textContent=region.name;
  $('#landscape').setAttribute('aria-label',region.description);
  document.querySelectorAll('[data-region]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.region===state.region)));
  prepare();
  draw();
  syncAnimation();
}
$('nav').addEventListener('click',event=>{
  const place=event.target.closest('[data-region]')?.dataset.region;
  if(!Object.hasOwn(regions,place) || state.region===place) return;
  state.region=place;
  if(place==='lv') vegasDisplayStart=elapsed;
  render();
});
const light=$('#light');
function storyTime(){
  const turn=elapsed%48;
  return turn<=24 ? turn : 48-turn;
}
function setAutomatic(enabled){
  automatic=enabled;
  cycle.setAttribute('aria-pressed',String(enabled));
  cycle.textContent=enabled?'Auto cycle':'Manual';
  if(enabled){
    updateCycle();
    draw();
  }
  syncAnimation();
}
function updateCycle(){
  const time=storyTime();
  const nextSeason=Math.min(3,Math.floor(time/6));
  if(state.season!==nextSeason){
    state.season=nextSeason;
    season.value=String(nextSeason);
    prepare();
  }
  const lightAmount=time<6 ? Math.sin(Math.PI*time/12)**2 : Math.cos(Math.PI*time/6)**2;
  lightLevel=.15+.85*lightAmount;
  light.value=String(Math.round(lightLevel*100));
  stage.style.setProperty('--light',lightLevel);
}
cycle.addEventListener('click',()=>setAutomatic(!automatic));
function setLight(){
  lightLevel=Number(light.value)/100;
  stage.style.setProperty('--light',lightLevel);
  draw();
}
light.addEventListener('input',()=>{setAutomatic(false);setLight()});
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
window.addEventListener('resize',()=>{
  prepare();
  draw();
});
updateCycle();
render();
