This is an isolated version of the problem faced by undo redo feature on MapMap.

- As we run the project open the app we see an add button.
- On clicking the add button a new map is created using.

  ```jsx
  // app.js line 49
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
        }}
  ```

- We see a new grey box which represents a new map on MapMap.
- On clicking any map, we add a new item inside the clicked map using.

  ```jsx
    // app.js line 15
  onClick={() => {
              store[key].value.stacks = [
                ...store[key].value.stacks,
                `${uuidv4()[0]}`,
              ];
            }}
  ```

- Whenever an item is added in the stacks array we call a subscribe on valtio and update the history using.

  ```js
  // mapStore.js line 109
  subscribe(store, (ops) => {
    console.log(ops);
    const firstKey = Object.values(ops[0][1])[0].toString();
    if (shouldSaveHistory(ops, map(firstKey))) {
      saveHistory(map(firstKey));
    }
  });

  // line 94
  const shouldSaveHistory = (
    ops: Parameters<Parameters<typeof subscribe>[1]>[0],
    proxyObject: dataType,
  ) => {
    return ops.every(
      (op) =>
        op[1][1] === "value" &&
        (op[0] !== "set" || op[2] !== proxyObject.history.wip),
    );
  };
  ```

- after adding 5 itmes the data looks like this

  ```js
  {
    "value": {
        "stacks": [
            "c",
            "c",
            "f"
        ]
    },
    "history": {
        "index": 3,
        "nodes": [
            {
                "createdAt": "2024-02-11T06:53:02.889Z",
                "snapshot": {
                    "stacks": []
                }
            },
            {
                "createdAt": "2024-02-11T06:53:16.774Z",
                "snapshot": {
                    "stacks": [
                        "c"
                    ]
                }
            },
            {
                "createdAt": "2024-02-11T06:53:26.841Z",
                "snapshot": {
                    "stacks": [
                        "c",
                        "c"
                    ]
                }
            },
            {
                "createdAt": "2024-02-11T06:53:37.659Z",
                "snapshot": {
                    "stacks": [
                        "c",
                        "c",
                        "f"
                    ]
                }
            }
        ]
    }
  }
  ```

- we click the undo and redo button and the data after 3 undos looks like

  ```js
  {
    "value": {
        "stacks": [
            "c",
            "c",
            "f"
        ]
    },
    "history": {
        "index": 3,
        "nodes": [
            {
                "createdAt": "2024-02-11T06:53:02.889Z",
                "snapshot": {
                    "stacks": []
                }
            },
            {
                "createdAt": "2024-02-11T06:53:16.774Z",
                "snapshot": {
                    "stacks": [
                        "c"
                    ]
                }
            },
            {
                "createdAt": "2024-02-11T06:53:26.841Z",
                "snapshot": {
                    "stacks": [
                        "c",
                        "c"
                    ]
                }
            },
            {
                "createdAt": "2024-02-11T06:53:37.659Z",
                "snapshot": {
                    "stacks": [
                        "c",
                        "c",
                        "f"
                    ]
                }
            },
            {
                "createdAt": "2024-02-11T07:52:41.479Z",
                "snapshot": {
                    "stacks": [
                        "c",
                        "c",
                        "f",
                        "e"
                    ]
                }
            },
            {
                "createdAt": "2024-02-11T07:52:41.860Z",
                "snapshot": {
                    "stacks": [
                        "c",
                        "c",
                        "f",
                        "e",
                        "d"
                    ]
                }
            }
        ],
        "wip": {
            "stacks": [
                "c",
                "c",
                "f"
            ]
        }
    }
  }
  ```

## Expected Behavior

Now when we add an itme by clicking on the grey box the item should get added to the value.stacks should be undated and also the history should be updated.

<!--- Tell us what should happen -->

## Current Behavior

Only the value.stack is updatd but not the stanpshots and index inside the history. as the index remains same the next undo removes all the changes since the last undo.
