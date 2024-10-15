import JSONEditor from './jsonEditor'
import ReqMenu from './reqMenu';

function MockEditor({
  showRequest
}) {
  const show = showRequest;
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