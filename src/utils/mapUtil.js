import esriLoader from 'esri-loader';

export function loadMap() { // 该方法用于加载 arcgis 依赖的js,css 等
    // 加载css
    esriLoader.loadCss('http://jsapi.thinkgis.cn/esri/css/esri.css');

    return esriLoader.loadScript({ // 加载js
        url: 'http://jsapi.thinkgis.cn/dojo/dojo.js',
        dojoConfig: {
            async: true
        },
    }).then(
        () => initMap()
    ).catch(
        err => console.log(err)
    );
}

function initMap() {
    return TMap().then(
        (tdt) =>
        esriLoader.loadModules([
            'esri/map',
            'esri/geometry/Point',
            'esri/layers/ArcGISDynamicMapServiceLayer'
        ]).then(
            (params) => _initMap([tdt, ...params])
        )
    );
}

function _initMap([TMap, Map, Point, ArcGISDynamicMapServiceLayer]) { // 初始化地图,并设置中心点等
    let map = new Map('map', {
        logo: false,
        slider: false
    }); // 创建地图实例
    const pt = new Point(105, 29); // 设置中心点
    map.centerAndZoom(pt, 4); // 设置中心点和缩放级别;
    let vec = new TMap('vec') // 影像
    let cia = new TMap('cia'); //路网
    map.addLayer(vec); // 将图层添加到map对象
    map.addLayer(cia);
    
    // map.addLayer(new ArcGISDynamicMapServiceLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'));
    // map.addLayer(new ArcGISDynamicMapServiceLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'));
    map.addLayer(new ArcGISDynamicMapServiceLayer('https://sampleserver6.arcgisonline.com/arcgis/rest/services/Earthquakes_Since1970/MapServer'))

    return map;
}

export function TMap() {
    return esriLoader.loadModules([
        'dojo/_base/declare',
        'esri/layers/TileInfo',
        'esri/SpatialReference',
        'esri/geometry/Extent',
        'esri/layers/TiledMapServiceLayer'
    ]).then(([
            declare,
            TileInfo,
            SpatialReference,
            Extent,
            TiledMapServiceLayer
        ]) => declare('TMap', TiledMapServiceLayer, {
            constructor(maptype) {
                this._maptype = maptype;
                this.spatialReference = new SpatialReference({
                    wkid: 4326
                });
                this.initialExtent = (this.fullExtent = new Extent(-180, -90, 180, 90,
                    this.spatialReference));

                this.tileInfo = new TileInfo({
                    'rows': 256,
                    'cols': 256,
                    'dpi': 96,
                    'format': 'PNG32',
                    'compressionQuality': 0,
                    'origin': { 'x': -180, 'y': 90 },
                    'spatialReference': { 'wkid': 4326 },
                    'lods': [ 
                        {'level': 2,'resolution': 0.3515625,'scale': 147748796.52937502}, 
                        {'level': 3,'resolution': 0.17578125,'scale': 73874398.264687508}, 
                        {'level': 4,'resolution': 0.087890625,'scale': 36937199.132343754}, 
                        {'level': 5,'resolution': 0.0439453125,'scale': 18468599.566171877}, 
                        {'level': 6,'resolution': 0.02197265625,'scale': 9234299.7830859385}, 
                        {'level': 7,'resolution': 0.010986328125,'scale': 4617149.8915429693}, 
                        {'level': 8,'resolution': 0.0054931640625,'scale': 2308574.9457714846}, 
                        {'level': 9,'resolution': 0.00274658203125,'scale': 1154287.4728857423}, 
                        {'level': 10,'resolution': 0.001373291015625,'scale': 577143.73644287116}, 
                        {'level': 11,'resolution': 0.0006866455078125,'scale': 288571.86822143558}, 
                        {'level': 12,'resolution': 0.00034332275390625,'scale': 144285.93411071779}, 
                        {'level': 13,'resolution': 0.000171661376953125,'scale': 72142.967055358895}, 
                        {'level': 14,'resolution': 8.58306884765625e-005,'scale': 36071.483527679447}, 
                        {'level': 15,'resolution': 4.291534423828125e-005,'scale': 18035.741763839724}, 
                        {'level': 16,'resolution': 2.1457672119140625e-005,'scale': 9017.8708819198619},
                        {'level': 17,'resolution': 1.0728836059570313e-005,'scale': 4508.9354409599309}, 
                        {'level': 18,'resolution': 5.3644180297851563e-006,'scale': 2254.4677204799655}]
                });
                this.loaded = true;
                this.onLoad(this);
            },

            getTileUrl(level, row, col) {
                return 'http://t' + col % 8 + '.tianditu.cn/' + this._maptype + '_c/wmts?' +
                    'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=' + this._maptype +
                    '&STYLE=default&TILEMATRIXSET=c&TILEMATRIX=' +
                    level + '&TILEROW=' + row + '&TILECOL=' + col + '&FORMAT=tiles';
            }
        })
    )
}