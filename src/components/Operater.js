import React, { Component } from 'react';
import Form from './ExportForm';

export default class Operater extends Component {
    render(){
        return(
            <div className="left-part">
                <Form {...this.props}/>
            </div>
        );
    }
}