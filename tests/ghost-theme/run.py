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
GhostTheme.edges(map);assert(ed===snap(find(map,'GhostTheme_Edges')),'edges not idempotent');
var sn=GhostTheme.scatter(map,opts),g=find(map,'GhostTheme_Scatter');assert(sn>10,'scatter absent');var first=snap(g);
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
tiled.log('THEME_TEST_OK edges='+en+' scatter='+find(map,'GhostTheme_Scatter').objectCount+' props='+placed);
'''
output.parent.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
 path=Path(tmp)/'integration.js';path.write_text(code);env=dict(os.environ,QT_QPA_PLATFORM='offscreen')
 result=subprocess.run([a.tiled,'--new-instance','--evaluate',str(path)],env=env,text=True,capture_output=True)
 print(result.stdout);print(result.stderr)
 if 'THEME_TEST_OK' not in result.stdout:raise SystemExit(1)
