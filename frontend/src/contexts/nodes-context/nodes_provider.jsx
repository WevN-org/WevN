import { useCallback,useEffect,useState } from "react";
import { NodesContext } from "./nodes_context";
import { useLog } from "../log-context/log_context";

export default function NodesProvider({children}){
    const [nodesList,setNodesList] = useState()
    const {addLog} = useLog();

    const setNodes = useCallback(
        nodes =>{
            setNodesList(nodes);
            addLog(`Updated list of nodes`)
            
        },[addLog]);


        return(
            <NodesContext.Provider value={{nodesList,setNodes}}>
                {children}
            </NodesContext.Provider>
        )
}


