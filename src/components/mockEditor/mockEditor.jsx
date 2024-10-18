import { useEffect, useState, useRef } from 'react';
import JSONEditor from './jsonEditor'
import ReqMenu from '../mockReqMenu/reqMenu';
import { Button } from 'antd'
import eventButs from './eventBus';

let resDataIsNull = false;
let reqDataIsNull = false;

function MockEditor({
  value = {
    data: [{}]
  },
  onChange,
  onStateChange,
  mode = 'code',
}) {
  const [selectMockIndex, setSelectMockIndex] = useState(0);
  const [isEditRequest, setIsEditRequest] = useState(false);
  const reqData = value.data[selectMockIndex]?.requestData || {};
  const showRequest = isEditRequest || (value.data.length > 1 || Object.keys(reqData).length > 0);
  const reqEditorRef = useRef(null)
  const resEditorRef = useRef(null)
  const valueRef = useRef(value)
  const selectIndexRef = useRef(0)
  const {
    requestData = {},
    responseData = {},
  } = value.data[selectMockIndex] || {};
  useEffect(() => {
    resDataIsNull = false;
    reqDataIsNull = false;
  }, [])
  useEffect(() => {
    const {
      requestData = {},
      responseData = {},
    } = value.data[selectMockIndex] || {};
    reqEditorRef?.current?.set(requestData);
    resEditorRef?.current?.set(responseData);
    valueRef.current = value;
    selectIndexRef.current = selectMockIndex
    return () => {
      reqEditorRef.current?.set({});
      resEditorRef.current?.set({});
    }
  }, [selectMockIndex])

  useEffect(() => {
    const changeValue = (value) => {
      onChange(value)
    }
    eventButs.on('value', changeValue)
    return () => {
      eventButs.off('value', changeValue)
    }
  }, [onChange])

  useEffect(() => {
    const changeValue = () => {
      setTimeout(() => {
        setSelectMockIndex(0)
        reqEditorRef.current?.set({});
        resEditorRef.current?.set({});
        valueRef.current = {
          name: '请求参数',
          url: '',
          data: [{
            requestData: {},
            responseData: {}
          }]
        };;
        selectIndexRef.current = 0;
      }, 300)
    }
    eventButs.on('reset', changeValue)
    return () => {
      eventButs.off('reset', changeValue)
    }
    
  }, [])

  return <>
    <div className="mock-editor-title">
      {
        mode === 'code' && <div>MOCK数据</div>
      }
      {
        !showRequest && mode === 'code' && <Button variant="outlined" onClick={() => setIsEditRequest(true)} color="primary">修改入参</Button>
      }
      {
        showRequest && mode === 'code' && <Button variant="outlined" onClick={() => {
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
          hasSettting={mode === 'code'}
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
            mode={mode}
            jsonEditorRef={reqEditorRef}
            value={requestData}
            onError={(...argument) => {
              if (!reqDataIsNull) {
                onStateChange(true)
              }
            }}
            onChange={function (data) {
              onStateChange(false)
              resDataIsNull = data === null
              const value = valueRef.current
              const newData = {
                ...value,
                data: value.data.map((item, i) => {
                  if (i === selectIndexRef.current) {
                    return {
                      ...item,
                      requestData: data || {},
                    }
                  }
                  return item;
                })
              }
              valueRef.current = newData
              eventButs.emit('value', newData)
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
          onError={() => {
            if (!resDataIsNull) {
              onStateChange(true)
            }
          }}
          jsonEditorRef={resEditorRef}
          onChange={function (data) {
            onStateChange(false)
            resDataIsNull = data === null
            const value = valueRef.current
            const newData = {
              ...value,
              data: value.data.map((item, i) => {
                if (i === selectIndexRef.current) {
                  return {
                    ...item,
                    responseData: data || {},
                  }
                }
                return item;
              })
            }
            valueRef.current = newData
            eventButs.emit('value', newData)
          }}
          htmlElementProps={{
            className: showRequest ? 'editor-res' : 'only-res editor-res'
          }}
          mode={mode}
        />
      </div>

    </div>
  </>
}

export default MockEditor;