import JSONEditor from './jsonEditor'
import { Menu, Button } from 'antd'
function MockEditor({
  showRequest
}) {
  const show = showRequest;
  return <>
    <div className="mock-editor-box">
      {
        show && <div className="mock-editor-menu">
        <Menu
          onClick={() => { }}
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['sub1']}
          mode="inline"
          items={[{
            key: '1',
            label: '请求参数'
          }]}
        />
      </div>
      }
      <div className="mock-editor-warp">
        {
          show && <div className='mock-editor-q'>
          入参:
        </div>
        }
        {
          show && <JSONEditor
          htmlElementProps={{
            className: 'editor-req'
          }}
          mode="code" />
        }
        {
          show && <div className='mock-editor-q'>
          出参:
        </div>
        }
        <JSONEditor htmlElementProps={{
          className: show ? 'editor-res' : 'only-res editor-res'
        }} mode="code" />
      </div>

    </div>
  </>
}

export default MockEditor;