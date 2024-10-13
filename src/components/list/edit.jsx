import { Modal } from "antd";
import GProxy from "../proxy/proxy";

export default function ApiEdit (props) {
  const {onCancel} = props;
  return <Modal width={800} centered={true} onCancel={onCancel} title="Basic Modal" open={props.visible}>
      <GProxy 
         deleteComfirm={true}
         proxyList={[]} 
         selectProxy={''}
         onProxyChange={async (data) => {
         }}
         onProxyDelete={async (data) => {
         }}
         onProxyCreate={async (data) => {
         }}
      />
    </Modal>
}