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
        for(var i=0;i<map.tilesets.length;i++)if(map.tilesets[i]&&(FileInfo.cleanPath(map.tilesets[i].fileName)===path||map.tilesets[i].name===file.replace('.tsx','')))return map.tilesets[i];
        var format=tiled.tilesetFormatForFile(path);if(!format)throw new Error('无法读取图集 '+path);
        var ts=format.read(path);if(ts)retainedTilesets.push(ts);if(!ts)throw new Error('缺少主题素材，请先安装 ghost-config 主题包：'+path);return ts;
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
        var walls=load(map,'abandoned-map01.tsx'),decor=load(map,'abandoned-decorations.tsx');
        var old=map.tilesets.filter(function(t){return t&&t.name==='map01';});
        if(!old.length && !map.tilesets.some(function(t){return t&&t.name==='abandoned-map01';}))throw new Error('未找到 map01 图集，暂不自动替换其他主题');
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
            group(map,'Edges');group(map,'Scatter');group(map,'Props');
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
    function protectedRects(map) {
        var list=[];['Door','Born','Supply','Bed'].forEach(function(n){var l=layer(map,n);if(l&&l.isObjectLayer)l.objects.forEach(function(o){var b=bounds(o);b.x-=60;b.y-=60;b.right+=60;b.bottom+=60;list.push(b);});});
        // Default protection keeps automatically generated clutter outside building areas.
        for(var i=0;i<map.layerCount;i++){var l=map.layerAt(i);if(l.isObjectLayer&&(/^Bed_\d/.test(l.name)||l.name==='GhostTheme_NoDecor'))l.objects.forEach(function(o){list.push(bounds(o));});}
        return list;
    }
    function roadAt(road,x,y,map){return x>=0&&y>=0&&x<map.width&&y<map.height&&road.cellAt(x,y)&&!road.cellAt(x,y).empty;}
    function clearGenerated(g,region){g.objects.slice().forEach(function(o){if(o.property('ghost.generatedBy')===OWNER&&!o.property('ghost.locked')&&(!region||intersects(o,region)))g.removeObject(o);});}
    function region(map){var b=map.selectedArea.boundingRect;if(!b||b.width<=0||b.height<=0)return null;return {x:b.x*100,y:b.y*100,right:(b.x+b.width)*100,bottom:(b.y+b.height)*100};}
    function scatter(map,options) {
        requireMap(map);if(map.property('ghost.theme')!=='abandoned-v1')throw new Error('请先应用废弃主题');
        var road=layer(map,'Road');if(!road||!road.isTileLayer)throw new Error('缺少 Road 瓦片层');
        var ts=load(map,'abandoned-decorations.tsx'),g=layer(map,PREFIX+'Scatter'),area=options.region||null,random=rng(options.seed),blocked=protectedRects(map),keep=[];
        if(g&&g.locked)throw new Error('散布图层已锁定');
        ['Props','Edges','Scatter'].forEach(function(s){var l=layer(map,PREFIX+s);if(l)l.objects.forEach(function(o){if(s!=='Scatter'||o.property('ghost.locked')||o.property('ghost.generatedBy')!==OWNER||(area&&!intersects(o,area)))keep.push(bounds(o));});});
        var result=[],ids=options.category==='paper'?[3,4]:options.category==='rubble'?[5,6]:options.category==='leaves'?[1,2]:[1,1,1,2,2,3,4,5,6];
        for(var y=0;y<map.height;y++)for(var x=0;x<map.width;x++) {
            if(!roadAt(road,x,y,map))continue;
            var edge=!roadAt(road,x-1,y,map)||!roadAt(road,x+1,y,map)||!roadAt(road,x,y-1,map)||!roadAt(road,x,y+1,map);
            if(random()>(options.density/100)*(edge?1.8:.45))continue;
            var id=ids[Math.floor(random()*ids.length)],scale=.45+random()*.45;
            var o=object(ts,id,(x+.15+random()*.7)*100,(y+.3+random()*.6)*100,scale,(id===3||id===4)?(random()-.5)*80:0),b=bounds(o);
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
            var t=ground.tileAt(x,y);if(t&&(t.tileset&&t.name==='map01'||t.tileset.name==='abandoned-map01')&&t.id>=8&&t.id<=41)mask[x+','+y]=true;
        }return mask;
    }
    function edges(map) {
        requireMap(map);if(map.property('ghost.theme')!=='abandoned-v1')throw new Error('请先应用废弃主题');
        var road=layer(map,'Road'),ts=load(map,'abandoned-decorations.tsx'),walls=wallMask(map),blocked=protectedRects(map),g=layer(map,PREFIX+'Edges'),result=[];
        if(!road||!road.isTileLayer)throw new Error('缺少 Road');if(g&&g.locked)throw new Error('墙边图层已锁定');
        var floors=[],fl=layer(map,'Floor');if(fl)fl.objects.forEach(function(o){if(o.polygon&&o.polygon.length)floors.push(o.polygon.map(function(p){return{x:p.x+o.x,y:p.y+o.y};}));});
        var keep=[];if(g)g.objects.forEach(function(o){if(o.property('ghost.locked')||o.property('ghost.generatedBy')!==OWNER)keep.push(bounds(o));});
        Object.keys(walls).sort().forEach(function(key){var xy=key.split(','),x=+xy[0],y=+xy[1];
            [[0,-1],[1,0],[0,1],[-1,0]].forEach(function(d){var nx=x+d[0],ny=y+d[1];if(!roadAt(road,nx,ny,map))return;
                if(floors.some(function(p){return pointIn(p,(nx+.5)*100,(ny+.5)*100);}))return;
                var o=object(ts,7,0,0,1,0);o.width=100;o.height=38;
                if(d[1]===-1){o.x=x*100;o.y=y*100;}
                else if(d[1]===1){o.x=(x+1)*100;o.y=(y+1)*100;o.rotation=180;}
                else if(d[0]===1){o.x=(x+1)*100;o.y=y*100;o.rotation=90;}
                else{o.x=x*100;o.y=(y+1)*100;o.rotation=270;}
                var b=bounds(o);if(blocked.some(function(r){return overlap(b,r);})||keep.some(function(r){return overlap(b,r);}))return;result.push(o);
            });
        });
        map.macro('沿墙铺设草垛',function(){g=group(map,'Edges');clearGenerated(g);result.forEach(function(o){g.addObject(o);});});return result.length;
    }
    function place(map,id,x,y,scale) {
        requireMap(map);if(map.property('ghost.theme')!=='abandoned-v1')throw new Error('请先应用废弃主题');
        var ts=load(map,'abandoned-decorations.tsx'),o=object(ts,id,x,y,scale||1,0),b=bounds(o);
        if(b.x<200||b.y<400||b.right>map.width*100-200||b.bottom>map.height*100-400)throw new Error('设备超出地图内侧安全区域');
        if(protectedRects(map).some(function(r){return overlap(b,r);}))throw new Error('设备与门口、功能点或建造区域冲突，请换一个位置');
        var props=layer(map,PREFIX+'Props');if(props&&props.objects.some(function(p){return overlap(b,bounds(p));}))throw new Error('设备与已有设备重叠');
        o.setProperty('ghost.locked',true);o.setProperty('ghost.visualOnly',true);
        map.macro('放置破旧设备',function(){var g=group(map,'Props');g.addObject(o);map.currentLayer=g;map.selectedObjects=[o];});return o;
    }
    function message(text){var d=new Dialog('主题装饰');d.addLabel(text);d.addButton('关闭').clicked.connect(function(){d.accept();});d.exec();}
    function guarded(fn){return function(){try{fn(tiled.activeAsset);}catch(e){message(String(e.message||e));}};}
    function setupUI(){
        var a=tiled.registerAction('GhostTheme_Apply',guarded(applyTheme));a.text='应用废弃实验室主题（方形地图）';
        a=tiled.registerAction('GhostTheme_Scatter',guarded(function(map){requireMap(map);var d=new Dialog('散布落叶 / 纸片 / 碎石');d.addLabel('有框选时仅重生成框选范围；锁定装饰保留。应用后可撤销。');var kind=d.addComboBox('素材',['混合','落叶','纸片','碎石']),den=d.addNumberInput('密度 %',12);den.minimum=1;den.maximum=60;var seed=d.addNumberInput('随机种子',Number(map.property('ghost.seed')||20261012));seed.minimum=0;seed.maximum=2147483647;seed.decimals=0;d.addButton('应用').clicked.connect(function(){d.accept();});d.addButton('取消').clicked.connect(function(){d.reject();});if(d.exec()===Dialog.Accepted)scatter(map,{seed:seed.value,density:den.value,category:['mixed','leaves','paper','rubble'][kind.currentIndex],region:region(map)});}));a.text='散布落叶、纸片、碎石…';
        a=tiled.registerAction('GhostTheme_Edges',guarded(edges));a.text='沿房间外墙铺草垛';
        a=tiled.registerAction('GhostTheme_Place',guarded(function(map){requireMap(map);var d=new Dialog('放置破旧设备');d.addLabel('本版为静态视觉设备，不改变通行。位置为图片左下角；放置后用选择对象工具拖动。');var choice=d.addComboBox('设备',['旧柜与箱子','破旧桶组','破旧设备']);var x=d.addNumberInput('X 像素',300),y=d.addNumberInput('Y 像素',700);x.maximum=map.width*100;y.maximum=map.height*100;var scale=d.addNumberInput('缩放',1);scale.minimum=.1;scale.maximum=3;scale.decimals=2;d.addButton('放置').clicked.connect(function(){d.accept();});d.addButton('取消').clicked.connect(function(){d.reject();});if(d.exec()===Dialog.Accepted)place(map,9+choice.currentIndex,x.value,y.value,scale.value);}));a.text='装配破旧设备…';
        a=tiled.registerAction('GhostTheme_Lock',guarded(function(map){requireMap(map);map.macro('锁定所选装饰',function(){map.selectedObjects.forEach(function(o){if(o.property('ghost.generatedBy')===OWNER)o.setProperty('ghost.locked',!o.property('ghost.locked'));});});}));a.text='锁定 / 解锁所选装饰';
        tiled.extendMenu('GhostTools',[{separator:true},{action:'GhostTheme_Apply'},{action:'GhostTheme_Scatter'},{action:'GhostTheme_Edges'},{action:'GhostTheme_Place'},{action:'GhostTheme_Lock'}]);
    }
    return {setResourceRoot:function(path){headlessRoot=path;},applyTheme:applyTheme,scatter:scatter,edges:edges,place:place,bounds:bounds,setupUI:setupUI};
}());
// CLI scripts load the same implementation without requiring editor menus.
if (typeof GhostThemeHeadless === 'undefined') {
    try { GhostTheme.setupUI(); } catch (e) { tiled.log('[主题工具] 菜单初始化不可用（命令行无菜单）：' + e.message); }
}
