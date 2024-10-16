import { Input } from 'antd'
import DeleteSVG from '../../assets/delete.svg'
import EditSVG from '../../assets/edit.svg'
import { useRef, useState } from 'react'

export default function ReqMenuItem({
  active,
  index,
  name = '',
  onChangeName,
  onDelete,
  onSelect,
  hideDelete = false,
  hasSettting = true
}) {
  const [isEdit, setIsEdit] = useState(false)
  const ref = useRef(null)
  return <div className={active === index ? 'req-menu-item active' : 'req-menu-item'}>
    <div className='req-menu-input-box'>
      {
        isEdit && <Input 
          placeholder="输入请求参数名称" 
          ref={ref} value={name} 
          variant="borderless" 
          onChange={event => onChangeName(event.target.value, index)} 
          onBlur={() => setIsEdit(false)} 
        />
      }
      {
        !isEdit && <div onClick={() => onSelect(index)} className='req-menu-name'>{name}</div>
      }
    </div>
    {
      hasSettting && <div className='req-menu-option'>
      <img className='req-menu-icon' src={EditSVG} onClick={() => {
        setIsEdit(true)
        setTimeout(() => {
          ref.current.focus()
        }, 0)
      }} />
      {
        !hideDelete && <img className='req-menu-icon' src={DeleteSVG} onClick={() => onDelete(index)} />
      }
    </div>
    }
  </div>
}