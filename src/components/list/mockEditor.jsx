import JSONEditor from './jsonEditor'
import ReqMenu from './reqMenu';

function MockEditor({
  showRequest,
  value = {},
  onChange,
  onStateChange
}) {
  const show = showRequest;
  const {
    requestData = {},
    responseData = {},
  } = value;
  return <>
    <div className="mock-editor-box">
      {
        show && <ReqMenu />
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
          mode="code"
          value={requestData}
          onError={(...argument)=> {
            console.log(111, argument);
            onStateChange(true)
          }}
          onChange={data => {
            onStateChange(false)
            onChange({
              ...value,
              requestData: data || {},
            })
          }}
        />
        }
        {
          show && <div className='mock-editor-q'>
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
              responseData: data || {},
            })
          }}
          htmlElementProps={{
          className: show ? 'editor-res' : 'only-res editor-res'
        }} 
          mode="code" 
        />
      </div>

    </div>
  </>
}

export default MockEditor;