import React, { Component } from 'react';
import { connect } from 'react-redux'
import 'antd/dist/antd.css';
import './App.css';
import Operater from '../components/Operater';
import Viewer from '../components/Viewer';
import Utils from '../utils';
import $ from 'jquery';
import html2canvas from 'html2canvas';

let map = null;
let Print = null;
let TMap = null;

class App extends Component {
  constructor(){
    super();
    this.state = {
      size:{},
      scale:{},
      cSize:{},
    }
  }

  componentWillMount(){
    const cSize = Utils.getContainerSize();
    this.setState({ cSize });
    this.doPaperChange(this.props.paper);
    Utils.loadMap().then(_map=>map = _map);
    Utils.print().then(print=>Print = print);
    Utils.TMap().then(tmap=>TMap = tmap);
  }
  
  componentDidUpdate(){
    map.resize();
  }
  doPaperChange(paper){
    const aPaper = paper.split(' ');
    const size = Utils.getTemplateInnerSize(aPaper[0], aPaper[1], 96);
    this.setState({size});
    if(this.props.paperChange){
      this.props.paperChange(paper);
    }
  }
  doPrint(){
    let print = new Print({
      center: map.extent.getCenter(),
      scale: map.getScale(),
      WMTSLayers: [new TMap('vec'),new TMap('cia')],
      ArcLayers: [{url:'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Earthquakes_Since1970/MapServer',visibleLayers:[0]}],
      width: parseFloat(this.state.size.width),
      height: parseFloat(this.state.size.height)
    });
    print.on('export-success', (url)=>{
      let $clone = $('#exportContainer').clone();
      $clone.css('transform','scale(1,1)');
      $clone.find('.map').remove();
      $clone.find('.map-container').append($('<img alt="" src="'+ url +'"></img>'));
      $('body').append($clone).ready(()=>{
        html2canvas($clone[0],{
          width:this.state.size.width, 
          height: this.state.size.height}
          ).then((canvas)=>{
            $clone.remove();
            var url = canvas.toDataURL( "image/png" ); //图片地址
            Utils.downLoad(url);
        });
      })   
    });
  }

  render() {
    return (
      <div className="App">
        <Operater paperChange={this.doPaperChange.bind(this)}
          print={this.doPrint.bind(this)}/>
        <Viewer {...this.state}/>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    paper: state.paper
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    paperChange: (paper) =>{
      dispatch({type: 'PAPER_CHANGE', payload: paper});
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)

