import { Divider } from 'antd'
import Proxy from './components/proxy'
import List from './components/list'


function App(props) {
  return (
    <div>
      <Proxy />
      <Divider />
      <List />
    </div>
  );
}
export default App;