import ReqMenuItem from "./reqMenuItem"

export default function ReqMenu({
  active = 0,
  list = [],
  onChangeActive,
  onChangeName,
  onDelete,
  hasSettting = true
}) {
  
  return <div className="mock-editor-menu">
    {
      list.map((item, index) => {
        return <ReqMenuItem
          hasSettting={hasSettting}
          key={index} 
          name={item.name} 
          onDelete={onDelete} 
          index={index} 
          active={active} 
          onChangeName={onChangeName} 
          onSelect={onChangeActive}
          hideDelete={list.length === 1}
        />
      })
    }
</div>
}