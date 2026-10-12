#!/usr/bin/env python3
"""Integration checks against Tiled's real JS API (no mocks)."""
import argparse,json,os,subprocess,tempfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--tiled',required=True);p.add_argument('--config-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
root=a.config_root.resolve();output=a.output.resolve();plugin=Path(__file__).resolve().parents[2]/'src/tiled/extensions/ghost-theme/ghost-theme.js'
code='var GhostThemeHeadless=true;\n'+plugin.read_text()+'\nGhostTheme.setResourceRoot('+json.dumps(str(root))+');\nvar input='+json.dumps(str(root/'Map_model/Map_1.tmx'))+';\nvar output='+json.dumps(str(output))+';\n'
code+='''
function assert(ok,text){if(!ok)throw new Error('ASSERT: '+text);}
function find(map,name){return map.layers.filter(function(l){return l.name===name;})[0];}
function snap(g){return JSON.stringify(g.objects.map(function(o){return [o.name,o.x,o.y,o.width,o.height,o.rotation];}));}
var map=tiled.mapFormat('tmx').read(input);
GhostTheme.applyTheme(map);
var n=map.layerCount;GhostTheme.applyTheme(map);assert(map.layerCount===n,'theme application duplicated layers');
var opts={seed:20261012,density:18,category:'mixed'};
var en=GhostTheme.edges(map);assert(en>20,'wall edges absent');var ed=snap(find(map,'GhostTheme_Edges'));
assert(find(map,'GhostTheme_Edges').objects.every(function(o){return ['top','left','right'].indexOf(o.property('ghost.wallSide'))>=0&&o.rotation===0;}),'bottom hay or rotated strips generated');
assert(find(map,'GhostTheme_Edges').objects.some(function(o){return o.tile.id===8&&o.tileFlippedHorizontally;}),'right-facing individual hay absent');
GhostTheme.edges(map);assert(ed===snap(find(map,'GhostTheme_Edges')),'edges not idempotent');
var ln=GhostTheme.roomLeaves(map,{mode:'both'});assert(ln>0,'indoor leaf piles absent');
var leafLayer=find(map,'GhostTheme_RoomLeaves');
assert(leafLayer.objects.some(function(o){return o.property('ghost.leafPlacement')==='corner';}),'corner piles absent');
assert(leafLayer.objects.some(function(o){return o.property('ghost.leafPlacement')==='edge';}),'edge piles absent');
assert(leafLayer.objects.every(function(o){var b=GhostTheme.bounds(o),x=o.property('ghost.wallAnchorX'),y=o.property('ghost.wallAnchorY');return b.x<x&&x<b.right&&b.y<y&&y<b.bottom;}),'leaf sprite does not straddle its wall seam');
var leavesSnapshot=snap(leafLayer);GhostTheme.roomLeaves(map,{mode:'both'});assert(leavesSnapshot===snap(leafLayer),'leaf generation not idempotent');
assert(leafLayer.objects.every(function(o){return o.property('ghost.room').indexOf('floor_')===0;}),'leaf room identity absent');
var sn=GhostTheme.scatter(map,opts),g=find(map,'GhostTheme_Scatter');assert(sn>10,'scatter absent');var first=snap(g);assert(g.objects.every(function(o){return o.tile.id>=3&&o.tile.id<=6;}),'room leaves still in scatter');
GhostTheme.scatter(map,opts);assert(first===snap(g),'same seed changed geometry');
opts.seed++;GhostTheme.scatter(map,opts);assert(first!==snap(g),'new seed did not change layout');
var locked=g.objectAt(0);locked.setProperty('ghost.locked',true);var lockedID=locked.id,lx=locked.x,ly=locked.y;
GhostTheme.scatter(map,opts);assert(g.objects.some(function(o){return o.id===lockedID&&o.x===lx&&o.y===ly;}),'locked object lost');
var left=g.objects.filter(function(o){return o.x<1200;}).map(function(o){return o.id;});opts.region={x:2400,y:600,right:4200,bottom:1800};
GhostTheme.scatter(map,opts);assert(left.every(function(id){return g.objects.some(function(o){return o.id===id;});}),'local regenerate changed outside area');
opts.region=null;opts.seed=20261012;locked.setProperty('ghost.locked',false);GhostTheme.scatter(map,opts);
var placed=0;
for(var yy=1000;yy<4200&&placed<3;yy+=800)for(var xx=250;xx<4400&&placed<3;xx+=1700){try{GhostTheme.place(map,9+placed,xx,yy,1);placed++;}catch(e){}}
assert(placed===3,'could not place test devices');
GhostTheme.scatter(map,opts);
var door=find(map,'Door').objectAt(0),rejected=false;try{GhostTheme.place(map,9,door.x,door.y,1);}catch(e){rejected=true;}assert(rejected,'door exclusion missing');
var bad=tiled.mapFormat('tmx').read(input.replace('Map_1.tmx','Map_4.tmx'));rejected=false;try{GhostTheme.applyTheme(bad);}catch(e){rejected=true;}assert(rejected,'non-square background stretched');
tiled.mapFormat('tmx').write(map,output);
var reloaded=tiled.mapFormat('tmx').read(output);assert(find(reloaded,'GhostTheme_Props').objectCount===3,'save/reopen lost props');
assert(find(reloaded,'GhostTheme_Scatter').objects.every(function(o){return o.tile!==null;}),'save/reopen lost tile references');
var baseCount=find(map,'GhostTheme_Base').objectCount;
var sg=find(map,'GhostTheme_Scatter'),saved=sg.objectAt(0);saved.setProperty('ghost.locked',true);
assert(GhostTheme.reset(map,false)>0,'default reset removed nothing');
assert(sg.objectCount===1&&find(map,'GhostTheme_Props').objectCount===3,'default reset removed locked objects or props');
assert(GhostTheme.reset(map,true)===4,'full reset count mismatch');
assert(find(map,'GhostTheme_Base').objectCount===baseCount&&find(map,'GhostTheme_Props').objectCount===0,'reset touched background or left props');
// Real Qt input widgets; use exactly the callback installed by all three dialogs.
var dialog=new Dialog('dialog regression'),xbox=dialog.addNumberInput('X',300),ybox=dialog.addNumberInput('Y',700),scaleBox=dialog.addNumberInput('Scale',1),captured=null;
xbox.maximum=5000;ybox.maximum=5000;xbox.value=300;ybox.value=700;
GhostTheme.acceptValues(dialog,function(){return {x:xbox.value,y:ybox.value,scale:scaleBox.value};},function(v){captured=v;})();
var panelTest=GhostTheme.openPanel();tiled.log('PANEL_HEIGHT='+panelTest.height);
assert(captured.x===300&&captured.y===700&&captured.scale===1,'dialog values lost before close');
tiled.log('THEME_TEST_OK edges='+en+' scatter='+find(reloaded,'GhostTheme_Scatter').objectCount+' props='+placed);
'''
output.parent.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
 path=Path(tmp)/'integration.js';path.write_text(code);env=dict(os.environ,QT_QPA_PLATFORM='offscreen')
 result=subprocess.run([a.tiled,'--new-instance','--evaluate',str(path)],env=env,text=True,capture_output=True)
 print(result.stdout);print(result.stderr)
 if 'THEME_TEST_OK' not in result.stdout:raise SystemExit(1)
