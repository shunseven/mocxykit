import { useState } from 'react';
import JSONEditor from './jsonEditor'
import ReqMenu from './reqMenu';
import { Button } from 'antd'

function MockEditor({
  value = {
    data: [{}]
  },
  onChange,
  onStateChange
}) {
  const [selectMockIndex, setSelectMockIndex] = useState(0);
  const [isEditRequest, setIsEditRequest] = useState(false);
  const showRequest = isEditRequest && (value.data.length > 0 || Object.keys(value.data[0]?.requestData).length > 0);
  const {
    requestData = {},
    responseData = {},
  } = value.data[selectMockIndex] || {};
  return <>
   <div className="mock-editor-title">
      <div>MOCK数据</div> 
      {
        !showRequest && <Button variant="outlined" onClick={()=>setIsEditRequest(true)} color="primary">修改入参</Button>
      }
      {
        showRequest && <Button variant="outlined" onClick={()=>{
          const data = [...value.data, {
            "name": `请求参数${value.data.length + 1}`,
            "requestData": {},
            "responseData": {}
          }]
          onChange({
            ...value,
            data
          })
          setSelectMockIndex(data.length - 1)
        }} color="primary">增加入参MOCK数据</Button>
      }
    </div>
    <div className="mock-editor-box">
      {
        showRequest && <ReqMenu  
          list={value.data} 
          active={selectMockIndex} 
          onChangeActive={setSelectMockIndex}
          onDelete={(index) => {
            onChange({
              ...value,
              data: value.data.filter((item, i) => i !== index)
            })
            if (selectMockIndex >= index) {
              setSelectMockIndex(selectMockIndex - 1)
            }
          }}
          onChangeName={(name, index) => {
          onChange({
            ...value,
            data: value.data.map((item, i) => {
              if (i === index) {
                return {
                  ...item,
                  name,
                }
              }
              return item;
            })
          })
        }} />
      }
      <div className="mock-editor-warp">
        {
          showRequest && <div className='mock-editor-q'>
          入参:
        </div>
        }
        {
          showRequest && <JSONEditor
          htmlElementProps={{
            className: 'editor-req'
          }}
          mode="code"
          value={requestData}
          onError={(...argument)=> {
            onStateChange(true)
          }}
          onChange={data => {
            onStateChange(false)
            onChange({
              ...value,
              data: value.data.map((item, i) => {
                if (i === selectMockIndex) {
                  return {
                    ...item,
                    requestData: data || {},
                  }
                }
                return item;
              })
            })
          }}
        />
        }
        {
          showRequest && <div className='mock-editor-q'>
          出参:
        </div>
        }
        <JSONEditor 
          value={responseData}
          onError={()=> onStateChange(true)}
          onChange={data => {
            onStateChange(false)
            onChange({
              ...value,
              data: value.data.map((item, i) => {
                if (i === selectMockIndex) {
                  return {
                    ...item,
                    responseData: data || {},
                  }
                }
                return item;
              })
            })
          }}
          htmlElementProps={{
          className: showRequest ? 'editor-res' : 'only-res editor-res'
        }} 
          mode="code" 
        />
      </div>

    </div>
  </>
}

export default MockEditor;