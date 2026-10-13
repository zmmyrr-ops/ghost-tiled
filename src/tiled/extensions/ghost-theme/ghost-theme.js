/* Static theme authoring. All edits use undo macros; generated objects are editable.
 * The paired ghost-config exporter compiles these explicit layers into display tiles.
 */
var GhostTheme = (function () {
    'use strict';
    var PREFIX = 'GhostTheme_', OWNER = 'ghost-theme-v1', headlessRoot = null, retainedTilesets = [];
    function layer(map, name) { for (var i=0;i<map.layerCount;i++) if(map.layerAt(i).name===name)return map.layerAt(i); return null; }
    function requireMap(map) {
        if(!map || !map.isTileMap)throw new Error('请先打开并保存地图');
        if(!map.fileName&&!headlessRoot)throw new Error('请先保存地图');
        if(map.tileWidth!==100 || map.tileHeight!==100)throw new Error('试用主题目前按 100×100 格制作');
    }
    function load(map, file) {
        var path=FileInfo.cleanPath(FileInfo.joinPaths(headlessRoot || FileInfo.cleanPath(FileInfo.joinPaths(FileInfo.path(map.fileName),'..')),'Map_tsx',file));
        var existing=null;
        for(var i=0;i<map.tilesets.length;i++)if(map.tilesets[i]&&(FileInfo.cleanPath(map.tilesets[i].fileName)===path||map.tilesets[i].name===file.replace('.tsx',''))){existing=map.tilesets[i];break;}
        if(existing&&(file!=='abandoned-decorations.tsx'||existing.tileCount>=19))return existing;
        var format=tiled.tilesetFormatForFile(path);if(!format)throw new Error('无法读取图集 '+path);
        var ts=format.read(path);if(ts)retainedTilesets.push(ts);if(!ts)throw new Error('缺少主题素材，请先安装 ghost-config 主题包：'+path);
        if(existing)map.macro('更新装饰素材库',function(){if(!map.replaceTileset(existing,ts))throw new Error('更新装饰图集失败');});
        return ts;
    }
    function group(map, suffix) {
        var name=PREFIX+suffix,g=layer(map,name);
        if(g && !g.isObjectLayer)throw new Error(name+' 必须是对象层');
        if(g && g.locked)throw new Error(name+' 已锁定，请先解锁');
        if(!g){g=new ObjectGroup(name);g.drawOrder=ObjectGroup.IndexOrder;map.addLayer(g);}return g;
    }
    function object(ts,id,x,y,scale,rotation) {
        var t=ts.tile(id),o=new MapObject(String(t.property('ghost.label')||t.id));o.tile=t;
        o.width=t.width*scale;o.height=t.height*scale;o.x=x;o.y=y;o.rotation=rotation||0;
        o.setProperty('ghost.generatedBy',OWNER);o.setProperty('ghost.assetKey',t.property('ghost.key'));return o;
    }
    function applyTheme(map) {
        requireMap(map);
        var walls=load(map,'abandoned-map03-formal.tsx'),decor=load(map,'abandoned-decorations-formal.tsx');
        var old=map.tilesets.filter(function(t){return t&&(t.name==='map01'||t.name==='abandoned-map01'||t.name==='abandoned-map03-formal');});
        if(!old.length && !map.tilesets.some(function(t){return t&&(t.name==='abandoned-map01'||t.name==='abandoned-map03-formal');}))throw new Error('未找到 map01 图集，暂不自动替换其他主题');
        if(map.width!==map.height)throw new Error('整张参考底图只适配正方形地图；长方形地图需先制作对应比例底图');
        map.macro('应用废弃实验室主题',function(){
            old.forEach(function(t){if(!map.replaceTileset(t,walls))throw new Error('替换图集失败');});map.addTileset(decor);
            // Old ground contains stray floor cells in the outer border. Reveal the new base there.
            var ground=layer(map,'Ground'),floors=layer(map,'Floor'),polys=[];
            if(floors)floors.objects.forEach(function(o){if(o.polygon&&o.polygon.length)polys.push(o.polygon.map(function(p){return{x:p.x+o.x,y:p.y+o.y};}));});
            if(ground&&ground.isTileLayer&&polys.length){var edit=ground.edit();
                for(var gy=0;gy<map.height;gy++)for(var gx=0;gx<map.width;gx++){
                    var tile=ground.tileAt(gx,gy);
                    if(tile&&tile.tileset.name==='abandoned-map01'&&(tile.id<=3||(tile.id>=42&&tile.id<=62))&&!polys.some(function(p){return pointIn(p,(gx+.5)*100,(gy+.5)*100);}))edit.setTile(gx,gy,null);
                }edit.apply();
            }
            var base=layer(map,PREFIX+'Base');
            if(!base){base=new ObjectGroup(PREFIX+'Base');base.drawOrder=ObjectGroup.IndexOrder;map.insertLayerAt(0,base);var bg=object(decor,0,0,map.height*100,1,0);bg.width=map.width*100;bg.height=map.height*100;base.addObject(bg);}
            base.locked=true;map.setProperty('ghost.theme','abandoned-v1');
            group(map,'Edges');group(map,'Scatter');group(map,'Props');group(map,'RoomLeaves');group(map,'Grass');
        });
    }
    function rng(seed) {var n=seed>>>0;return function(){n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
    function bounds(o) {
        var w=o.width,h=o.height,pts=o.polygon;
        var corners=(pts&&pts.length)?pts:[{x:0,y:o.tile?-h:0},{x:w,y:o.tile?-h:0},{x:w,y:o.tile?0:h},{x:0,y:o.tile?0:h}];
        var a=o.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),xs=[],ys=[];
        corners.forEach(function(p){xs.push(o.x+c*p.x-s*p.y);ys.push(o.y+s*p.x+c*p.y);});
        return {x:Math.min.apply(null,xs),y:Math.min.apply(null,ys),right:Math.max.apply(null,xs),bottom:Math.max.apply(null,ys)};
    }
    function overlap(a,b,pad){pad=pad||0;return a.x<b.right+pad&&a.right>b.x-pad&&a.y<b.bottom+pad&&a.bottom>b.y-pad;}
    function intersects(o,rect,pad){return overlap(bounds(o),rect,pad);}
    function protectedRects(map, includeBuild) {
        var list=[];['Door','Born','Supply','Bed'].forEach(function(n){var l=layer(map,n);if(l&&l.isObjectLayer)l.objects.forEach(function(o){var b=bounds(o);b.x-=60;b.y-=60;b.right+=60;b.bottom+=60;list.push(b);});});
        // Default protection keeps automatically generated clutter outside building areas.
        for(var i=0;i<map.layerCount;i++){var l=map.layerAt(i);if(l.isObjectLayer&&((includeBuild!==false&&/^Bed_\d/.test(l.name))||l.name==='GhostTheme_NoDecor'))l.objects.forEach(function(o){list.push(bounds(o));});}
        return list;
    }
    function roadAt(road,x,y,map){return x>=0&&y>=0&&x<map.width&&y<map.height&&road.cellAt(x,y)&&!road.cellAt(x,y).empty;}
    function clearGenerated(g,region){g.objects.slice().forEach(function(o){if(o.property('ghost.generatedBy')===OWNER&&!o.property('ghost.locked')&&(!region||intersects(o,region)))g.removeObject(o);});}
    function region(map){var b=map.selectedArea.boundingRect;if(!b||b.width<=0||b.height<=0)return null;return {x:b.x*100,y:b.y*100,right:(b.x+b.width)*100,bottom:(b.y+b.height)*100};}
    function scatter(map,options) {
        requireMap(map);if(map.property('ghost.theme')!=='abandoned-v1')throw new Error('请先应用废弃主题');
        var road=layer(map,'Road');if(!road||!road.isTileLayer)throw new Error('缺少 Road 瓦片层');
        var ts=load(map,'abandoned-decorations-formal.tsx'),g=layer(map,PREFIX+'Scatter'),area=options.region||null,random=rng(options.seed),blocked=protectedRects(map),keep=[];
        if(g&&g.locked)throw new Error('散布图层已锁定');
        ['Props','Edges','RoomLeaves','Grass','Scatter'].forEach(function(s){var l=layer(map,PREFIX+s);if(l)l.objects.forEach(function(o){if(s!=='Scatter'||o.property('ghost.locked')||o.property('ghost.generatedBy')!==OWNER||(area&&!intersects(o,area)))keep.push(bounds(o));});});
        var result=[],ids=options.category==='paper'?[3,4,16,17,18]:options.category==='rubble'?[5,6]:options.category==='small-leaf'?[14,15]:[14,14,15,15,16,17,18,3,4,5,6];
        for(var y=0;y<map.height;y++)for(var x=0;x<map.width;x++) {
            if(!roadAt(road,x,y,map))continue;
            var edge=!roadAt(road,x-1,y,map)||!roadAt(road,x+1,y,map)||!roadAt(road,x,y-1,map)||!roadAt(road,x,y+1,map);
            if(random()>(options.density/100)*(edge?1.8:.45))continue;
            var id=ids[Math.floor(random()*ids.length)],scale=.45+random()*.45;
            var o=object(ts,id,(x+.15+random()*.7)*100,(y+.3+random()*.6)*100,scale,(id===3||id===4||id>=14)?(random()-.5)*80:0),b=bounds(o);
            if(b.x<200||b.y<400||b.right>map.width*100-200||b.bottom>map.height*100-400)continue;
            if(area&&(b.x<area.x||b.y<area.y||b.right>area.right||b.bottom>area.bottom))continue;
            if(blocked.some(function(r){return overlap(b,r);})||keep.some(function(r){return overlap(b,r,12);}))continue;
            var valid=true;for(var gy=Math.floor(b.y/100);gy<Math.ceil(b.bottom/100);gy++)for(var gx=Math.floor(b.x/100);gx<Math.ceil(b.right/100);gx++)if(!roadAt(road,gx,gy,map))valid=false;
            if(!valid)continue;o.setProperty('ghost.seed',options.seed);result.push(o);keep.push(b);
        }
        map.macro('散布主题装饰',function(){g=group(map,'Scatter');clearGenerated(g,area);result.forEach(function(o){g.addObject(o);});map.setProperty('ghost.seed',options.seed);});return result.length;
    }
    function pointIn(poly,x,y){var inside=false;for(var i=0,j=poly.length-1;i<poly.length;j=i++){var a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
    function wallMask(map) {
        var ground=layer(map,'Ground'),mask={};if(!ground||!ground.isTileLayer)throw new Error('缺少 Ground');
        for(var y=0;y<map.height;y++)for(var x=0;x<map.width;x++){
            var t=ground.tileAt(x,y);if(t&&t.tileset&&(t.tileset.name==='map01'||t.tileset.name==='abandoned-map01'||t.tileset.name==='abandoned-map03-formal')&&t.id>=8&&t.id<=41)mask[x+','+y]=true;
        }return mask;
    }
    function edges(map) {
        requireMap(map);if(map.property('ghost.theme')!=='abandoned-v1')throw new Error('请先应用废弃主题');
        var road=layer(map,'Road'),ts=load(map,'abandoned-decorations-formal.tsx'),walls=wallMask(map),blocked=protectedRects(map),g=layer(map,PREFIX+'Edges'),result=[];
        if(!road||!road.isTileLayer)throw new Error('缺少 Road');if(g&&g.locked)throw new Error('墙边图层已锁定');
        var floors=[],fl=layer(map,'Floor');if(fl)fl.objects.forEach(function(o){if(o.polygon&&o.polygon.length)floors.push(o.polygon.map(function(p){return{x:p.x+o.x,y:p.y+o.y};}));});
        var keep=[];if(g)g.objects.forEach(function(o){if(o.property('ghost.locked')||o.property('ghost.generatedBy')!==OWNER)keep.push(bounds(o));});
        Object.keys(walls).sort().forEach(function(key){var xy=key.split(','),x=+xy[0],y=+xy[1];
            // Each side uses a single cutout, overlapping at half-cell intervals.
            // No bottom-facing edge: the reference only dresses top/left/right walls.
            [[0,-1],[1,0],[-1,0]].forEach(function(d){
                var nx=x+d[0],ny=y+d[1];if(!roadAt(road,nx,ny,map))return;
                if(floors.some(function(p){return pointIn(p,(nx+.5)*100,(ny+.5)*100);}))return;
                for(var slot=0;slot<2;slot++){
                    var top=d[1]===-1,o=object(ts,top?7:8,0,0,1,0);
                    if(top){
                        o.width=68;o.height=38;o.x=x*100+slot*50-5;o.y=y*100+3;
                    }else{
                        o.width=58;o.height=76;o.x=d[0]<0?x*100-53:(x+1)*100-5;
                        o.y=y*100+slot*50+66;o.tileFlippedHorizontally=d[0]>0;
                    }
                    o.setProperty('ghost.wallSide',top?'top':d[0]<0?'left':'right');
                    var b=bounds(o);
                    if(blocked.some(function(r){return overlap(b,r);})||keep.some(function(r){return overlap(b,r);}))continue;
                    result.push(o);
                }
            });
        });
        map.macro('沿墙铺设草垛',function(){g=group(map,'Edges');clearGenerated(g);result.forEach(function(o){g.addObject(o);});});return result.length;
    }
    function roomLeaves(map, options) {
        requireMap(map);
        if(map.property('ghost.theme')!=='abandoned-v1')throw new Error('请先应用主题');
        options=options||{mode:'both'};
        var floors=layer(map,'Floor');if(!floors||!floors.isObjectLayer)throw new Error('缺少 Floor 房间地面区域');
        var ts=load(map,'abandoned-decorations-formal.tsx'),walls=wallMask(map),g=layer(map,PREFIX+'RoomLeaves');
        if(g&&g.locked)throw new Error('室内叶堆图层已锁定');
        var blocked=protectedRects(map,false),occupied=[],results=[];
        ['Props','RoomLeaves'].forEach(function(suffix){var l=layer(map,PREFIX+suffix);if(l)l.objects.forEach(function(o){
            if(suffix==='Props'||o.property('ghost.locked')||o.property('ghost.generatedBy')!==OWNER)occupied.push(bounds(o));
        });});
        function wallAt(x,y){return !!walls[Math.floor(x/100)+','+Math.floor(y/100)];}
        function fits(poly,b){
            // A wall-root decal straddles the visual seam. It is not a floor-cell occupant.
            var touchesFloor=false,touchesWall=false;
            for(var y=b.y+1;y<b.bottom;y+=6)for(var x=b.x+1;x<b.right;x+=6){
                if(pointIn(poly,x,y))touchesFloor=true;
                else if(wallAt(x,y))touchesWall=true;
                else return false;
            }
            return touchesFloor&&touchesWall;
        }
        function add(poly,room,id,x,y,w,h,flipX,flipY,kind,anchorX,anchorY){
            var o=object(ts,id,x,y+h,1,0);o.width=w;o.height=h;
            o.tileFlippedHorizontally=!!flipX;o.tileFlippedVertically=!!flipY;
            if(kind==='edge'&&h>w){o.width=h;o.height=w;o.x=x;o.y=y;o.rotation=90;}
            var b=bounds(o);if(!fits(poly,b)||blocked.some(function(r){return overlap(b,r);})||occupied.some(function(r){return overlap(b,r,20);}))return;
            o.setProperty('ghost.room',room);o.setProperty('ghost.leafPlacement',kind);
            o.setProperty('ghost.wallAnchorX',anchorX);o.setProperty('ghost.wallAnchorY',anchorY);
            results.push(o);occupied.push(b);
        }
        floors.objects.forEach(function(floor){
            var poly=floor.polygon&&floor.polygon.length?floor.polygon.map(function(p){return{x:p.x+floor.x,y:p.y+floor.y};}):[{x:floor.x,y:floor.y},{x:floor.x+floor.width,y:floor.y},{x:floor.x+floor.width,y:floor.y+floor.height},{x:floor.x,y:floor.y+floor.height}];
            if(options.mode!=='edge')poly.forEach(function(v){
                [-1,1].forEach(function(sx){[-1,1].forEach(function(sy){
                    if(!pointIn(poly,v.x+sx*35,v.y+sy*35)||!wallAt(v.x-sx*35,v.y+sy*35)||!wallAt(v.x+sx*35,v.y-sy*35))return;
                    add(poly,floor.name,2,sx>0?v.x-24:v.x-60,sy>0?v.y-24:v.y-66,84,90,sx<0,sy<0,'corner',v.x,v.y);
                });});
            });
            if(options.mode!=='corner')for(var i=0;i<poly.length;i++){
                var a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y;
                if(Math.abs(dx)>1&&Math.abs(dy)>1)continue;
                var length=Math.abs(dx)+Math.abs(dy);if(length<300)continue;
                for(var distance=180;distance<length-120;distance+=400){
                    var cx=a.x+dx*distance/length,cy=a.y+dy*distance/length;
                    [-1,1].forEach(function(sign){
                        var horizontal=Math.abs(dx)>Math.abs(dy),ix=horizontal?cx:cx+sign*15,iy=horizontal?cy+sign*15:cy;
                        if(!pointIn(poly,ix,iy)||!wallAt(horizontal?cx:cx-sign*35,horizontal?cy-sign*35:cy))return;
                        if(horizontal)add(poly,floor.name,1,cx-50,sign>0?cy-24:cy-18,100,42,false,sign<0,'edge',cx,cy);
                        else add(poly,floor.name,1,sign>0?cx-24:cx-18,cy-50,42,100,sign<0,false,'edge',cx,cy);
                    });
                }
            }
        });
        map.macro('布置房间内叶堆',function(){
            g=group(map,'RoomLeaves');clearGenerated(g);results.forEach(function(o){g.addObject(o);});
            // Migrate the old automatically scattered piles, while preserving user locks.
            var old=layer(map,PREFIX+'Scatter');if(old&&!old.locked)old.objects.slice().forEach(function(o){
                if(o.property('ghost.generatedBy')===OWNER&&!o.property('ghost.locked')&&['leaves_a','leaves_b'].indexOf(o.property('ghost.assetKey'))>=0)old.removeObject(o);
            });
        });
        return results.length;
    }
    function grass(map,seed) {
        requireMap(map);if(map.property('ghost.theme')!=='abandoned-v1')throw new Error('请先应用主题');
        var ts=load(map,'abandoned-decorations-formal.tsx'),walls=wallMask(map),road=layer(map,'Road'),g=layer(map,PREFIX+'Grass');
        if(!road||!road.isTileLayer)throw new Error('缺少 Road');if(g&&g.locked)throw new Error('小草图层已锁定');
        var random=rng(seed||20261012),blocked=protectedRects(map,false),keep=[],result=[];
        ['Props','RoomLeaves','Grass'].forEach(function(suffix){var l=layer(map,PREFIX+suffix);if(l)l.objects.forEach(function(o){
            if(suffix!=='Grass'||o.property('ghost.locked')||o.property('ghost.generatedBy')!==OWNER)keep.push(bounds(o));
        });});
        Object.keys(walls).sort().forEach(function(key){var xy=key.split(','),x=+xy[0],y=+xy[1];
            [[0,-1],[1,0],[0,1],[-1,0]].forEach(function(d){
                if(!roadAt(road,x+d[0],y+d[1],map)||random()>.22)return;
                var o=object(ts,random()<.5?12:13,0,0,.65+random()*.25,0);
                var along=25+random()*50;
                // Keep blades upright; place the root at the wall seam, without rotating the grass.
                if(d[0]){o.x=(d[0]>0?(x+1)*100-5:x*100-o.width+5);o.y=y*100+along;}
                else{o.x=x*100+along-o.width/2;o.y=d[1]>0?(y+1)*100+o.height-8:y*100+5;}
                var b=bounds(o);if(blocked.some(function(r){return overlap(b,r);})||keep.some(function(r){return overlap(b,r,30);}))return;
                o.setProperty('ghost.wallSide',d[0]<0?'left':d[0]>0?'right':d[1]<0?'top':'bottom');
                result.push(o);keep.push(b);
            });
        });
        map.macro('点缀墙根小草',function(){g=group(map,'Grass');clearGenerated(g);result.forEach(function(o){g.addObject(o);});});return result.length;
    }
    function place(map,id,x,y,scale) {
        requireMap(map);if(map.property('ghost.theme')!=='abandoned-v1')throw new Error('请先应用废弃主题');
        if(!isFinite(x)||!isFinite(y)||!isFinite(scale)||scale<=0||[9,10,11].indexOf(id)<0)
            throw new Error('设备参数无效，请输入有效坐标和大于零的缩放');
        var ts=load(map,'abandoned-decorations-formal.tsx'),o=object(ts,id,x,y,scale,0),b=bounds(o);
        if(b.x<200||b.y<400||b.right>map.width*100-200||b.bottom>map.height*100-400)throw new Error('设备超出地图内侧安全区域');
        if(protectedRects(map).some(function(r){return overlap(b,r);}))throw new Error('设备与门口、功能点或建造区域冲突，请换一个位置');
        var props=layer(map,PREFIX+'Props');if(props&&props.objects.some(function(p){return overlap(b,bounds(p));}))throw new Error('设备与已有设备重叠');
        o.setProperty('ghost.locked',true);o.setProperty('ghost.visualOnly',true);
        map.macro('放置破旧设备',function(){var g=group(map,'Props');g.addObject(o);map.currentLayer=g;map.selectedObjects=[o];});return o;
    }
    function reset(map, all) {
        requireMap(map);
        var targets=[];
        ['Edges','Scatter','RoomLeaves','Grass','Props'].forEach(function(suffix){
            var g=layer(map,PREFIX+suffix);if(!g)return;
            if(!g.isObjectLayer)throw new Error(g.name+' 必须是对象层');
            if(g.locked)throw new Error(g.name+' 已锁定，请先解锁图层');
            g.objects.forEach(function(o){
                if(all||(o.property('ghost.generatedBy')===OWNER&&!o.property('ghost.locked')))targets.push(o);
            });
        });
        map.macro(all?'清空全部主题装饰':'重置未锁定自动装饰',function(){
            targets.forEach(function(o){o.layer.removeObject(o);});
        });
        return targets.length;
    }
    // ScriptDialog has WA_DeleteOnClose. Snapshot widget values BEFORE accept().
    function acceptValues(dialog, read, receive) {
        return function(){receive(read());dialog.accept();};
    }
    function message(text){var d=new Dialog('主题装饰');d.addLabel(text);d.addButton('关闭').clicked.connect(function(){d.accept();});d.exec();}
    function guarded(fn){return function(){try{fn(tiled.activeAsset);}catch(e){message(String(e.message||e));}};}
    var panel=null;
    function openPanel(){
        if(panel){panel.show();panel.raise();panel.activateWindow();return panel;}
        var d=new Dialog('地图装饰面板');panel=d;
        d.finished.connect(function(){panel=null;});
        d.addHeading('地图装饰',true);
        d.addLabel('针对当前地图操作；面板保持打开，可返回地图选择、移动对象。每次操作均可撤销。');
        var status=d.addLabel('就绪');
        function run(fn){return function(){try{var map=tiled.activeAsset;requireMap(map);var result=fn(map);status.text=result||'完成';}catch(e){status.text='未执行：'+e.message;}};}
        function button(label,fn){d.addButton(label).clicked.connect(run(fn));}
        d.addHeading('主题与墙外草垛');
        button('应用废弃主题',function(m){applyTheme(m);return '主题已应用';});
        button('生成墙外草垛（左 / 右 / 上）',function(m){return '已生成 '+edges(m)+' 个草垛';});
        d.addHeading('墙根叶堆');
        d.addLabel('贴墙根接缝，角落压住两侧墙脚；不吸附地面格子。');
        var leafMode=d.addComboBox('位置',['贴墙 + 角落','仅贴墙','仅角落']);
        button('贴墙根布置叶堆',function(m){return '已布置 '+roomLeaves(m,{mode:['both','edge','corner'][leafMode.currentIndex]})+' 处室内叶堆';});
        button('点缀墙根小草',function(m){return '已放置 '+grass(m,20261012)+' 丛小草';});
        d.addHeading('地面碎片');
        var kind=d.addComboBox('素材',['小落叶 + 纸屑 + 碎石','纸片 / 纸屑','碎石','零散小落叶']);
        var density=d.addNumberInput('密度 %',12);density.minimum=1;density.maximum=60;
        var seed=d.addNumberInput('随机种子',1);seed.minimum=0;seed.maximum=2147483647;seed.decimals=0;seed.value=20261012;
        button('散布碎片',function(m){return '已散布 '+scatter(m,{seed:seed.value,density:density.value,category:['mixed','paper','rubble','small-leaf'][kind.currentIndex],region:region(m)})+' 处碎片';});
        d.addHeading('破旧设备');
        var device=d.addComboBox('设备',['旧柜与箱子','破旧桶组','破旧设备']);
        var x=d.addNumberInput('X（左下角）',0),y=d.addNumberInput('Y（左下角）',0),scale=d.addNumberInput('缩放',1);
        x.maximum=100000;y.maximum=100000;x.value=300;y.value=1000;scale.minimum=.1;scale.maximum=3;scale.decimals=2;
        button('放置设备',function(m){place(m,9+device.currentIndex,x.value,y.value,scale.value);return '设备已放置，可在地图中拖动';});
        d.addHeading('管理');
        button('锁定 / 解锁所选装饰',function(m){m.macro('锁定所选装饰',function(){m.selectedObjects.forEach(function(o){if(o.property('ghost.generatedBy')===OWNER)o.setProperty('ghost.locked',!o.property('ghost.locked'));});});return '所选装饰锁定状态已切换';});
        var resetMode=d.addComboBox('重置范围',['未锁定自动装饰','全部主题装饰（含设备和锁定项）']);
        button('重置装饰物',function(m){return '已清理 '+reset(m,resetMode.currentIndex===1)+' 个装饰物';});
        d.addButton('关闭面板').clicked.connect(function(){d.accept();});
        d.show();return d;
    }
    function setupUI(){
        var action=tiled.registerAction('GhostTheme_Panel',openPanel);action.text='地图装饰面板…';
        tiled.extendMenu('GhostTools',[{separator:true},{action:'GhostTheme_Panel'}]);
    }
    return {grass:grass,roomLeaves:roomLeaves,openPanel:openPanel,reset:reset,acceptValues:acceptValues,setResourceRoot:function(path){headlessRoot=path;},applyTheme:applyTheme,scatter:scatter,edges:edges,place:place,bounds:bounds,setupUI:setupUI};
}());
// CLI scripts load the same implementation without requiring editor menus.
if (typeof GhostThemeHeadless === 'undefined') {
    try { GhostTheme.setupUI(); } catch (e) { tiled.log('[主题工具] 菜单初始化不可用（命令行无菜单）：' + e.message); }
}
