import * as THREE from './vendor/three.module.js';

const canvas=document.querySelector('#tower');
try { boot(); } catch(error) { console.error('Modelo 3D indisponível:',error);document.querySelector('#modelFallback').hidden=false;canvas.hidden=true; }

function boot(){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#dce7ec');
 const camera=new THREE.PerspectiveCamera(36,1,.1,180);
 scene.add(new THREE.HemisphereLight(0xe6f5ff,0x9b8d77,2.6));
 const sun=new THREE.DirectionalLight(0xfff1df,3.5);sun.position.set(-20,45,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-26,right:26,top:38,bottom:-26,near:1,far:110});sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;sun.target.position.set(0,12,0);scene.add(sun,sun.target);
 const fill=new THREE.DirectionalLight(0xd6e8ff,1.2);fill.position.set(12,20,-15);scene.add(fill);
 let seed=5423;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 function surface(base,grain,tile=false){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,256,256);for(let i=0;i<15000;i++){let v=rand()>.5?255:0;x.fillStyle=`rgba(${v},${v},${v},${rand()*grain})`;x.fillRect(rand()*256,rand()*256,1+rand()*2,1+rand()*2)}if(tile){x.strokeStyle='#00000019';x.lineWidth=2;for(let i=0;i<=256;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.moveTo(0,i);x.lineTo(256,i);x.stroke()}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
 const plasterMap=surface('#e4e1d8',.13),concreteMap=surface('#a9acaa',.22),asphaltMap=surface('#45494c',.3),pavingMap=surface('#c7c6c0',.13,true);
 const plaster=new THREE.MeshStandardMaterial({map:plasterMap,roughness:.92,bumpMap:plasterMap,bumpScale:.025});
 const concrete=new THREE.MeshStandardMaterial({map:concreteMap,roughness:.94,bumpMap:concreteMap,bumpScale:.04});
 const white=new THREE.MeshStandardMaterial({color:0xeeeae1,roughness:.85});
 const dark=new THREE.MeshStandardMaterial({color:0x343d42,roughness:.55,metalness:.3});
 const glass=new THREE.MeshStandardMaterial({color:0x608698,metalness:.45,roughness:.22});
 const railingGlass=new THREE.MeshStandardMaterial({color:0x93b3bc,roughness:.18,metalness:.2,transparent:true,opacity:.48,depthWrite:false});
 const warm=new THREE.MeshStandardMaterial({color:0xffdc87,emissive:0xffc45e,emissiveIntensity:2.2,roughness:.65});
 const road=new THREE.MeshStandardMaterial({map:asphaltMap,roughness:1});
 const paving=new THREE.MeshStandardMaterial({map:pavingMap,roughness:.96});
 const paint=new THREE.MeshStandardMaterial({color:0xe9dfb2,roughness:.9});
 const groups=new Map(),statusPlaques=new Map(),windowsByUnit=new Map(),pickable=[];
 const cube=new THREE.BoxGeometry(1,1,1);
 function box(parent,x,y,z,w,h,d,material,id){const m=new THREE.Mesh(cube,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;if(id){m.userData.unit=id;pickable.push(m)}parent.add(m);return m;}
 // World orientation never changes: the road is on the positive Z (front) side.
 box(scene,0,-.35,1,29,.5,28,concrete);box(scene,0,-.06,1,28,.12,26,paving);
 box(scene,0,.01,9.3,28,.14,6.4,road);
 box(scene,0,.17,5.9,28,.28,.22,white);box(scene,0,.17,12.7,28,.28,.22,white);
 for(let x=-12;x<=12;x+=4)box(scene,x,.1,9.3,2,.015,.12,paint);
 for(let z=6.6;z<12;z+=.8)box(scene,-10,.11,z,2.1,.025,.45,white);
 // Raised forecourt, pedestrian path and garage driveway.
 box(scene,0,.16,0,14,.3,11.5,paving);box(scene,3.4,.18,5.1,3.7,.07,1.7,concrete);
 box(scene,-3.5,1.55,0,5.1,2.7,9,concrete);box(scene,2.5,1.55,0,6.9,2.7,9,plaster);
 box(scene,-3.9,1.35,4.55,2.7,2,.13,glass);box(scene,-1.5,1.35,4.58,1.1,2,.13,dark);
 box(scene,3.3,1.2,4.58,4.1,1.85,.14,dark);
 for(let y=.4;y<2.1;y+=.17)box(scene,3.3,y,4.68,4.02,.035,.04,concrete);
 box(scene,-2.8,2.55,5,5.4,.17,1.15,dark);
 function textTexture(text,bg='#243d49',fg='#ffffff'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=fg;ctx.font='600 44px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,66);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(4,.72),new THREE.MeshBasicMaterial({map:textTexture('AURORA')}));sign.position.set(-2.8,2.28,5.59);scene.add(sign);
 const portaria=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.45),new THREE.MeshBasicMaterial({map:textTexture('PORTARIA')}));portaria.position.set(-3.9,.55,4.64);scene.add(portaria);
 const streetLabel=new THREE.Mesh(new THREE.PlaneGeometry(8,1.4),new THREE.MeshBasicMaterial({map:textTexture('RUA · FRENTE','#45494c','#ffffff'),side:THREE.DoubleSide}));streetLabel.rotation.x=-Math.PI/2;streetLabel.position.set(0,.12,11.3);scene.add(streetLabel);
 const floorHeight=2.65,base=2.95;
 // A slab for every storey and the roof; ten residential levels in total.
 for(let f=0;f<=10;f++)box(scene,0,base+f*floorHeight,0,12.4,.17,9.5,white);
 for(let f=1;f<=10;f++)for(let end=1;end<=4;end++){
  const id=String(f*100+end),front=end<=2,x=end%2===1?-3.05:3.05,z=front?2.3:-2.3,y=base+(f-1)*floorHeight+1.35;
  const group=new THREE.Group();group.userData.unit=id;scene.add(group);groups.set(id,group);windowsByUnit.set(id,[]);
  box(group,x,y,z,5.95,2.48,4.5,plaster,id);
  const faceZ=front?4.59:-4.59,sign=front?1:-1;
  // Window recess, tinted glass, aluminium frame and slim mullions.
  for(let k=0;k<2;k++){
   const wx=x+(k===0?-1.35:1.25),ww=front&&k===1?1.8:1.65,wh=front&&k===1?1.97:1.45,wy=y+(front&&k===1?-.05:.16);
   box(group,wx,wy,faceZ,ww+.16,wh+.16,.12,dark,id);
   windowsByUnit.get(id).push(box(group,wx,wy,faceZ+sign*.08,ww,wh,.04,glass,id));
   box(group,wx,wy,faceZ+sign*.12,.055,wh,.04,dark,id);
   box(group,wx,wy-.1,faceZ+sign*.12,ww,.045,.04,dark,id);
   box(group,wx,wy-wh/2-.1,faceZ+sign*.12,ww+.3,.12,.32,white,id);
  }
  // Small side window helps identify both ends from oblique views.
  const side=x<0?-6.06:6.06;
  box(group,side,y+.2,z,.09,1.45,1.5,dark,id);windowsByUnit.get(id).push(box(group,side+(x<0?-.055:.055),y+.2,z,.04,1.3,1.34,glass,id));
  if(front){
   const by=y-1.02;box(group,x,by,5.1,5.82,.2,1.35,concrete,id);
   box(group,x,by+.62,5.73,5.65,.96,.045,railingGlass,id);
   box(group,x,by+1.13,5.73,5.82,.065,.065,dark,id);
   for(const dx of [-2.78,0,2.78])box(group,x+dx,by+.64,5.73,.045,1.05,.06,dark,id);
   for(const dx of [-2.87,2.87]){box(group,x+dx,by+.62,5.1,.045,.96,1.25,railingGlass,id);box(group,x+dx,by+1.13,5.1,.065,.065,1.3,dark,id)}
  }
  const plaqueMat=new THREE.MeshStandardMaterial({color:0xbad79a,roughness:.7,emissive:0x000000});
  const plaque=box(group,x,y+1.08,faceZ+sign*.13,.7,.15,.04,plaqueMat,id);statusPlaques.set(id,plaque);
 }
 // Vertical structural spine and roof parapet give the tower a continuous facade.
 box(scene,0,16.2,4.69,.19,26.6,.17,dark);box(scene,0,16.2,-4.69,.19,26.6,.17,dark);
 for(let side of [-1,1]){box(scene,side*6.12,16.2,0,.15,26.6,.28,dark);box(scene,side*6.06,29.82,0,.15,.65,9.4,white)}
 box(scene,0,29.82,4.63,12.1,.65,.16,white);box(scene,0,29.82,-4.63,12.1,.65,.16,white);box(scene,0,29.57,0,11.9,.05,9.1,concrete);
 const selection=new THREE.Box3Helper(new THREE.Box3(),0x32b8ee);selection.material.depthTest=true;scene.add(selection);
 let state=null,lastSelected=null,selectedBadge=null,raf=0,dragging=false,startX=0,startAngle=0,moved=false;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function render(){raf=0;if(!state||document.querySelector('#modelView').hidden)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const radius=camera.aspect<.65?72:camera.aspect<.9?63:57;camera.position.set(Math.sin(state.angle)*radius,30,Math.cos(state.angle)*radius);camera.lookAt(0,13.2,0);renderer.render(scene,camera);}
 function queue(){if(!raf)raf=requestAnimationFrame(render)}
 const palette={'Disponível':0xadd078,'Reservado':0xe9b655,'Vendido':0x82909d};
 window.aurora3D={update(next){state=next;const matching=new Set(next.matching);for(const u of next.units){const mat=statusPlaques.get(u.unidade).material;mat.color.setHex(matching.has(u.unidade)?palette[u.status]:0xc5c8c9);mat.emissive.setHex(u.unidade===next.selected?0x1b7591:0x000000);mat.emissiveIntensity=.8;for(const pane of windowsByUnit.get(u.unidade))pane.material=u.status==='Disponível'?warm:glass;}
  const litCount=next.units.filter(u=>u.status==='Disponível').length;document.querySelector('#lightStatus').textContent=`${litCount} apartamentos acesos · ${next.units.length-litCount} apagados`;
  if(lastSelected!==next.selected){lastSelected=next.selected;const unit=groups.get(next.selected);selection.box.setFromObject(unit);if(selectedBadge){scene.remove(selectedBadge);selectedBadge.material.map.dispose();selectedBadge.material.dispose();}
   const u=next.units.find(u=>u.unidade===next.selected),e=Number(u.unidade)%100;
   selectedBadge=new THREE.Sprite(new THREE.SpriteMaterial({map:textTexture('APTO '+u.unidade,'#12394b','#ffffff'),depthTest:false}));selectedBadge.position.set(e%2===1?-3.05:3.05,base+(u.andar-1)*floorHeight+2.35,u.sacada?6.05:-5.0);selectedBadge.scale.set(3.1,.78,1);selectedBadge.renderOrder=10;scene.add(selectedBadge);
  }
  document.querySelector('#viewLabel').textContent=document.querySelector('#orientation').textContent;
  const dot=document.querySelector('#cameraDot');dot.style.left=`${50+Math.sin(next.angle)*41}%`;dot.style.top=`${50+Math.cos(next.angle)*41}%`;queue();}};
 canvas.addEventListener('pointerdown',e=>{if(!state)return;dragging=true;startX=e.clientX;startAngle=state.angle;moved=false;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!dragging)return;let delta=e.clientX-startX;if(Math.abs(delta)>4)moved=true;if(moved){const slider=document.querySelector('#rotation');slider.value=((startAngle*180/Math.PI-delta*.45+180)%360+360)%360-180;slider.dispatchEvent(new Event('input',{bubbles:true}));}});
 canvas.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;if(moved)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(scene.children,true).find(h=>h.object.isMesh&&!h.object.isSprite);if(hit?.object.userData.unit)window.selectUnit(hit.object.userData.unit)});
 canvas.addEventListener('pointercancel',()=>dragging=false);
 new ResizeObserver(queue).observe(canvas);window.drawTower();
}
