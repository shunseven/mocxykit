import { Input } from 'antd'
import DeleteSVG from '../../assets/delete.svg'
import EditSVG from '../../assets/edit.svg'

export default function ReqMenu() {
  return <div className="mock-editor-menu">
  <div className='req-menu-item active'>
      <div>
        <Input placeholder="请求参数" value='请求参数' variant="borderless" />
      </div>
      <div className='req-menu-option'>
         <img className='req-menu-icon' src={EditSVG} />
          <img className='req-menu-icon' src={DeleteSVG} />
      </div>
    </div>
    <div className='req-menu-item'>
      <div><div className='req-menu-name'>请求参数</div></div>
      <div>
        <img className='req-menu-icon' src={DeleteSVG} />
        <img className='req-menu-icon' src={EditSVG} />
      </div>
    </div>
</div>
}