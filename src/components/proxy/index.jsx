import {Select} from 'antd';

function Index(props) {
  return (
    <div>
     <div>全局代理:</div>
     <Select
      defaultValue="lucy"
      style={{
        width: 500,
      }}
      onChange={() => {}}
      options={[
        {
          value: 'jack',
          label: 'Jack',
        },
        {
          value: 'lucy',
          label: 'Lucy',
        },
        {
          value: 'Yiminghe',
          label: 'yiminghe',
        },
        {
          value: 'disabled',
          label: 'Disabled',
          disabled: true,
        },
      ]}
    />
    </div>
  );
}

export default Index;