import esriLoader from "esri-loader";
import $ from "jquery";
import html2canvas from "html2canvas";
import Utils from "./index";

export default function() {
  return esriLoader
    .loadModules([
      "dojo/_base/declare",
      "dojo/_base/lang",
      "dojo/Deferred",
      "dojo/Evented",
      "dojo/promise/all",
      "esri/map",
      "esri/layers/ArcGISDynamicMapServiceLayer",
      "esri/layers/GraphicsLayer",
      "esri/graphic",
      "esri/symbols/jsonUtils"
    ])
    .then(function([
      declare,
      lang,
      Deferred,
      Evented,
      all,
      Map,
      ArcGISDynamicMapServiceLayer,
      GraphicsLayer,
      Graphic,
      jsonUtils
    ]) {
      return declare("print", Evented, {
        /**
         * center、scale必须要
         * WMTSLayers、ArcLayers两个参数至少一个有内容
         * option:
         *  dpi: 用于export接口导出图片的精度设置
         *  WMTSLayers: wmts图层数组，传入实例化图层（实例化方式不同，故传入实例化后的图层对象，省去适配）
         *  ArcLayers：arcgis动态图层和非ogc标准服务，传入服务的url,visibleLayers（地址，可见图层id）
         *  graphics: Graphic数组
         *  height：图片高度
         *  width：图片宽度
         *  center：地图的中心点
         *  scale: 地图的比例尺
         *  innerSR：arcgis服务export的bbox的wkid (默认当前map的wkid)
         *  outSR: 输出图片的wkid (默认当前map的wkid)
         *  imgExt: 指定图片的格式
         *  proxyUrl: wmts瓦片获取跨域使用的代理地址
         *
         * option 初始化放在构造函数中（修复短时间实例化多个对象时，造成option属性公用 https://blog.csdn.net/haofeng82/article/details/2246757）
         */
        option: null,
        pointSymbol: null,
        polylineSymbol: null,
        polygonSymbol: null,
        mapId: "map",
        map: null,

        constructor: function() {
          //this.inherited(arguments);
          this.option = {
            dpi: 96,
            WMTSLayers: [],
            ArcLayers: [],
            graphics: [],
            height: 600,
            width: 1000,
            center: null,
            scale: -1,
            innerSR: -1,
            outSR: -1,
            imgExt: "png",
            proxyUrl: ""
          };
          this.mapId += +new Date();
          lang.mixin(this.option, arguments[0]);
          this._initDefaultSymbols();
          this._initMap();
          console.time(this.mapId);
        },
        _initMap: function() {
          $("body").append(
            $(
              '<div id="' +
                this.mapId +
                '" style="height:' +
                this.option.height +
                "px;width:" +
                this.option.width +
                'px;z-index:-12;position:absolute;"></div>'
            )
          );
          this.map = new Map(this.mapId, { logo: false, slider: false });
          var defs = [];
          if (this.option.center) {
            defs.push(this.map.centerAt(this.option.center));
          }
          if (this.option.scale) {
            defs.push(this.map.setScale(this.option.scale));
          }
          all(defs).then(lang.hitch(this, this._addLayers));
        },
        /**
         * 添加图层用于map初始化，wmts图层全部添加（图层可能存在原点偏移，故全部添加）
         * 如只有Arcgis图层则只需添加一个图层即可
         * @private
         */
        _addLayers: function() {
          var defs = [];
          if (this.option.WMTSLayers.length) {
            //保证行列号完全正确，所有wmts图层都添加
            defs = this.option.WMTSLayers.map(function(item) {
              var def = new Deferred();
              item.on("update-end", function() {
                def.resolve();
              });
              this.map.addLayer(item);
              return def;
            }, this);
          }
          if (!this.option.WMTSLayers.length && this.option.ArcLayers.length) {
            //当未添加wmts图层时，只添加一个图层用于map初始化
            var def = new Deferred();
            var layerItem = this.option.ArcLayers[0];
            var layer = new ArcGISDynamicMapServiceLayer(layerItem.url);
            layer.setVisibleLayers(layerItem.visibleLayers);
            layer.on("load", function() {
              def.resolve();
            });
            this.map.addLayer(layer);
            defs.push(def);
          }
          if (this.option.graphics.length) {
            var graLayer = new GraphicsLayer();
            this.map.addLayer(graLayer);
            this.option.graphics.map(function(gra) {
              if (!gra.symbol) {
                gra.setSymbol(this._getSymbol(gra.geometry.type));
              }
              graLayer.add(new Graphic(gra.geometry, gra.symbol));
            }, this);
          }

          all(defs).then(lang.hitch(this, this._print));
        },
        /**
         * 初始化Arc图层的图片导出的坐标系
         * @private
         */
        _initSR: function() {
          var sr = this.map.extent.spatialReference.wkid;
          if (this.option.innerSR === -1) {
            this.option.innerSR = sr;
          }
          if (this.option.outSR === -1) {
            this.option.outSR = sr;
          }
        },
        /**
         * 打印
         * @private
         */
        _print: function() {
          this._initSR();
          var defs = [];
          var $map = $(
            '<div id="export-' +
              this.mapId +
              '" style="height:' +
              this.option.height +
              "px;width:" +
              this.option.width +
              'px;position:absolute;z-index:-13;overflow: hidden;"></div>'
          );
          if (this.option.WMTSLayers.length) {
            defs.push(this._getTileLayerImgs());
          }
          if (this.option.ArcLayers.length) {
            defs.push(this._getExportPngs());
          }
          all(defs).then(
            lang.hitch(this, function(results) {
              results.map(function(item) {
                $map.append(item);
              });

              if (this.option.graphics.length) {
                $map.append($("#" + this.mapId + "_gc").clone());
              }
              $("body")
                .append($map)
                .ready(
                  lang.hitch(this, function() {
                    html2canvas($map[0], {
                      width: this.option.width,
                      height: this.option.height
                    }).then(
                      lang.hitch(this, function(canvas) {
                        var url = canvas.toDataURL(
                          "image/" + this.option.imgExt
                        ); //图片地址
                        $("#" + this.mapId).remove();
                        $("#export-" + this.mapId).remove();
                        this.emit("export-success", url);
                        console.timeEnd(this.mapId);
                      })
                    );
                  })
                );
            })
          );
        },
        /**
         *ArcGis 图层全部使用export接口输出png图片，并转换为base64
         * @returns {Deferred}
         * @private
         */
        _getExportPngs: function() {
          var pngsDef = new Deferred();
          var $pngRoot = $(
            '<div style="width: 100%;height: 100%;position: absolute;"></div>'
          );
          var defs = this.option.ArcLayers.map(function(item) {
            return this._exportPng(
              item.url,
              this.map.extent,
              this.option.dpi,
              this.option.height,
              this.option.width,
              item.visibleLayers,
              this.option.innerSR,
              this.option.outSR
            );
          }, this);
          all(defs).then(
            lang.hitch(this, function(results) {
              results.map(function(img) {
                $pngRoot.append(
                  $(
                    '<img alt="" style="width: 100%;height: 100%;position: inherit;" src="' +
                      img +
                      '">'
                  )
                );
              });
              pngsDef.resolve($pngRoot);
            })
          );
          return pngsDef;
        },
        /**
         * 将wmts图层的瓦片转为base64,并返回瓦片位置变换后的div节点
         * @returns {Deferred}
         * @private
         */
        _getTileLayerImgs: function() {
          var layersDef = new Deferred();
          var rect = this.map.__visibleRect;
          var $layersRoot = $("<div></div>");
          var layerTileStr =
            "position:absolute;border:none;margin:0;padding:0;visibility:inherit;";
          var layerDivStr =
            "position:absolute;overflow:visible;transition:-webkit-transform 500ms ease 0s;";
          var tileLayersStr =
            "position:absolute;overflow:visible;display:block;";
          var layerDefs = this.option.WMTSLayers.map(function(item) {
            //图层
            var layerDef = new Deferred();
            var layer = this.map._layers[item.id];
            var $root = $(
              '<div style="height: ' +
                rect.height +
                "px;width: " +
                rect.width +
                "px;" +
                "transform: translate(" +
                layer.__coords_dx +
                "px," +
                layer.__coords_dy +
                "px);" +
                tileLayersStr +
                '"></div>'
            );
            var $layer = $(
              '<div style="height: ' +
                rect.height +
                "px;width: " +
                rect.width +
                "px;" +
                layerDivStr +
                '"></div>'
            );
            var tiles = layer._tileIds;
            var tileBs = layer._tileBounds;
            var tileImgs = layer._tiles;
            var defs = tiles.map(function(id) {
              //瓦片
              var tileItem = tileBs[id];
              var def = new Deferred();
              var imgSrc =
                (this.option.proxyUrl === ""
                  ? ""
                  : this.option.proxyUrl + "?") + tileImgs[id].src;
              // console.log(imgSrc);
              Utils.getBase64Img(
                imgSrc,
                "png",
                tileItem.height,
                tileItem.width
              ).then(
                lang.hitch(this, function(url) {
                  $layer.append(
                    $(
                      '<img style="height: ' +
                        tileItem.height +
                        "px;width: " +
                        tileItem.width +
                        "px;" +
                        "transform: translate(" +
                        tileItem.x +
                        "px," +
                        tileItem.y +
                        "px);" +
                        layerTileStr +
                        '" src="' +
                        url +
                        '">'
                    )
                  );
                  def.resolve();
                })
              );
              return def;
            }, this);
            $root.append($layer);
            all(defs).then(
              lang.hitch(this, function() {
                layerDef.resolve($root);
              })
            );
            return layerDef;
          }, this);
          all(layerDefs).then(
            lang.hitch(this, function($layers) {
              $layersRoot.append($layers);
              layersDef.resolve($layersRoot);
            })
          );
          return layersDef;
        },
        /**
         * export接口出图
         * 注：dpi默认为96，假如传入更高或更低，则宽高都要重新计算，否则输出图片的显示的地图范围更少或更多
         * @param url 图层地址
         * @param extent 地图显示范围
         * @param dpi  图片输出精度
         * @param height  图片高度
         * @param width 图片宽度
         * @param layers 可见图层
         * @param innerSR 当前extent的wkid
         * @param outSR 指定输出图片所在的坐标系
         * @returns {Deferred}
         * @private
         */
        _exportPng: function(
          url,
          extent,
          dpi,
          height,
          width,
          layers,
          innerSR,
          outSR
        ) {
          var def = new Deferred(),
            dpiScale = dpi / 96,
            _height = dpiScale * height,
            _width = dpiScale * width,
            exportUrl =
              url +
              "/export?f=image&transparent=true&format=png8&bboxSR=" +
              innerSR +
              "&imageSR=" +
              outSR +
              "&bbox=" +
              extent.xmin +
              "," +
              extent.ymin +
              "," +
              extent.xmax +
              "," +
              extent.ymax +
              "&size=" +
              _width +
              "," +
              _height +
              "&dpi=" +
              dpi +
              "&layers=show:" +
              layers.join(",");
          Utils.getBase64Img(exportUrl, "png", _height, _width).then(function(
            dataURL
          ) {
            def.resolve(dataURL);
          });
          return def;
        },
        _getSymbol: function(type) {
          var symbol = null;
          switch (type) {
            case "point":
              symbol = this.pointSymbol;
              break;
            case "polyline":
              symbol = this.polylineSymbol;
              break;
            default:
              symbol = this.polygonSymbol;
          }
          return symbol;
        },
        _initDefaultSymbols: function() {
          this.pointSymbol = jsonUtils.fromJson({
            style: "esriSMSCircle",
            color: [79, 129, 189, 128],
            name: "Circle",
            outline: { color: [0, 191, 255, 125], width: 1 },
            type: "esriSMS",
            size: 8
          });
          this.polylineSymbol = jsonUtils.fromJson({
            style: "esriSLSSolid",
            color: [0, 191, 255, 125],
            width: 3,
            name: "Blue 1",
            type: "esriSLS"
          });
          this.polygonSymbol = jsonUtils.fromJson({
            style: "esriSFSSolid",
            color: [79, 129, 189, 128],
            type: "esriSFS",
            outline: {
              style: "esriSLSSolid",
              color: [0, 191, 255, 125],
              width: 2.5,
              type: "esriSLS"
            }
          });
        }
      });
    });
}
