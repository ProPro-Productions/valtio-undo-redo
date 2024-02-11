import { ReactNode } from "react";
import { store, undo, map, redo } from "./mapStore";
import { useSnapshot } from "valtio";
import { v4 as uuidv4 } from "uuid";

function App() {
  const storeSnapshot = useSnapshot(store);
  return (
    <div className='flex flex-wrap'>
      {Object.keys(storeSnapshot).map((key) =>
        key !== "_persist" ? (
          <div
            key={key}
            className='w-80 h-80 bg-slate-400 border-2 border-white'
            onClick={() => {
              console.log("snjsnsnjsnj");
              store[key].value.stacks = [
                ...store[key].value.stacks,
                `${uuidv4()[0]}`,
              ];
            }}>
            <button
              className='bg-white p-4'
              onClick={(e) => {
                e.stopPropagation();
                undo(map(key));
              }}>
              undo
            </button>
            <button
              className='bg-white p-4'
              onClick={(e) => {
                e.stopPropagation();
                redo(map(key));
              }}>
              redo
            </button>
            {(storeSnapshot[key].value.stacks as ReactNode[]).map(
              (item, index) => (
                <div className='bg-blue-400 border-white border-2' key={index}>
                  {item}
                </div>
              ),
            )}
          </div>
        ) : null,
      )}
      <button
        className='w-80 h-80 border-2'
        onClick={() => {
          const initVal = { stacks: [] };
          store[`map${uuidv4()}`] = {
            value: { ...initVal },
            history: {
              index: 0,
              nodes: [{ createdAt: new Date(), snapshot: { ...initVal } }],
              wip: undefined,
            },
          };
        }}>
        add
      </button>
    </div>
  );
}

export default App;
