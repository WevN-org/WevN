import { useCallback,useEffect,useState } from "react";
import { DomainContext } from "./domain_context";
import { useLog } from "../logContext/log_context";

export default function DomainProvider({children}){
    const [cDomain,sDomain] = useState("")
    const {addLog} = useLog();

    const setDomain = useCallback(
        domainName =>{
            sDomain(domainName);
            localStorage.setItem("currentDomain",domainName)
            addLog(`Global Collection Changed to ${domainName}`)
        },[addLog]);

    useEffect(
        ()=>{
            const savedDomain = localStorage.getItem("currentDomain");
            if (savedDomain){
                setDomain(savedDomain)
                
            }
        },[setDomain])

        return(
            <DomainContext.Provider value={{cDomain,setDomain}}>
                {children}
            </DomainContext.Provider>
        )
}


