import React, { Component } from "react";
import compass from './compass.png';

export default class Viewer extends Component {
  render() {
    const size = this.props.size;
    const cSize = this.props.cSize;
    console.log(size);
    const _wScale = cSize.width/size.width,
          _hScale = cSize.height/size.height,
          wScale = _wScale>1 ? 1 : _wScale,
          hScale = _hScale>1 ? 1 : _hScale;
    
    const eStyle = {
        height: size.height+'px',
        width: size.width+'px',
        transform: 'scale('+wScale+','+hScale+')'
    };
    const mStyle = {
        height: size.height-40+'px',
        width: size.width-10+'px'
    }

    return (
        <div className="right-part">
            <div id="exportContainer" className="export-container" style={ eStyle }>
                <div className="export-title">
                    <h1 className="title">导出</h1>
                </div>
                <div className="export-map no-legends" >
                    <div id="mapContainer" className="map-container" style={ mStyle }>
                        <div id="map" className="map" />
                    </div>
                    <div className="scale-bar">比例尺 1:<span></span></div>
                </div>
                <div className="export-footer no-legends"></div>
                <div className="compass-container">
                    <img src={ compass } className="export-compass" alt="" />
                </div>
                <div className="map-info">
                    <div className="info-group">
                        <label>单位:</label>
                        <label ></label>
                    </div>
                    <div className="info-group">
                        <label>时间:</label>
                        <label ></label>
                    </div>
                </div>

            </div>
        </div>
    );
  }
}
