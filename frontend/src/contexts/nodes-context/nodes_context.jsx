import { createContext,useContext } from "react";

export const NodesContext = createContext(
    {
        nodesList: null,
        setNodes:() => {}
    }
)

export function useNodes(){
    return useContext(NodesContext);
}
