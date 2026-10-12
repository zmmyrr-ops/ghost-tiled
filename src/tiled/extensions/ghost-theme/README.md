# 废弃主题工具

与 ghost-config 的 abandoned 主题素材及 theme_bake.py 配套使用。

将整个 ghost-theme 目录放入 Tiled 的 extensions 目录，重新加载扩展。菜单挂到自定义“猛鬼工具集”，无须修改 C++；现有构建配置自动打包 extensions/**。

提供方形地图主题应用、固定种子散布、沿墙草垛、三款静态设备放置、选择对象锁定。修改通过 map.macro 组织，原有 Bed/Collision 等工具代码不改动。

CLI 集成测试：

```sh
python3 tests/ghost-theme/run.py --tiled /path/to/Tiled --config-root /path/to/ghost-config --output /path/to/ghost-config/Map_model/Map_1001.tmx
```

测试内部设定资源根目录，正常编辑器按 TMX 上级目录寻找 Map_tsx。设备为纯视觉，放置后使用原生对象工具进行变换。人工拖动不会重新进行避让检查，发布前请检查门口与通道。

目前限制：100×100 格、正方形背景、顶层图层；框选按包围矩形处理；随机以贴墙加权抽样，尚未实现可调簇中心分布。后续可以增加背景九宫格、专用草垛角块和设备实际阻挡。
