import React, { Component } from 'react';
import { Form, Input, Select, Button } from 'antd';
  
  const FormItem = Form.Item;
  const Option = Select.Option;
  
  class PriceInput extends Component {
    static getDerivedStateFromProps(nextProps) {
      // Should be a controlled component.
      if ('value' in nextProps) {
        return {
          ...(nextProps.value || {}),
        };
      }
      return null;
    }
  
    constructor(props) {
      super(props);
  
      const value = props.value || {};
      this.state = {
        currency: value.currency || 'A4 H',
      };
    }
  
    handleCurrencyChange = (currency) => {
      if (!('value' in this.props)) {
        this.setState({ currency });
      }
      this.triggerChange({ currency });
    }
  
    triggerChange = (changedValue) => {
      // Should provide an event to pass value to Form.
      const onChange = this.props.onChange;
      if (onChange) {
        onChange(Object.assign({}, this.state, changedValue));
      }
    }
  
    render() {
      const { size } = this.props;
      const state = this.state;
      return (
        <span>
          <Select
            value={state.currency}
            size={size}
            style={{ width: '40%' }}
            onChange={this.handleCurrencyChange}
          >
            <Option value="A4 H">A4 横向</Option>
            <Option value="A4 V">A4 竖向</Option>
            <Option value="A3 H">A3 横向</Option>
            <Option value="A3 V">A3 竖向</Option>
          </Select>
        </span>
      );
    }
  }
  
  class Demo extends Component {
    handleSubmit = (e) => {
      e.preventDefault();
      const print = this.props.print;
      if(print){
          print();
      }
    }

    paperChange = (rule, value, callback) => {
        const paperChange = this.props.paperChange;
        if(paperChange){
            paperChange(value.currency);
        }
    }    
  
    render() {
      const { getFieldDecorator } = this.props.form;
      const formItemLayout = {
        labelCol: {
          xs: { span: 24 },
          sm: { span: 8 },
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 16 },
        },
      };
      return (
        <Form onSubmit={this.handleSubmit}>
          <FormItem 
            { ...formItemLayout }
            label="纸张">
            {getFieldDecorator('price', {
              initialValue: { currency: 'A4 H' },
              rules: [{ validator: this.paperChange }],
            })(<PriceInput />)}
          </FormItem>
          <FormItem
             wrapperCol={{
                xs: { span: 24, offset: 0 },
                sm: { span: 16, offset: 8 },
              }}>
            <Button type="primary" htmlType="submit">导出</Button>
          </FormItem>
        </Form>
      );
    }
  }
  
const WrappedDemo = Form.create()(Demo);
export default WrappedDemo;
  