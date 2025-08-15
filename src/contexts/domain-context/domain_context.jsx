import { createContext,useContext } from "react";

export const DomainContext = createContext(
    {
        currentDomain: "",
        setDomain:() => {}
    }
)

export function changeDomain(){
    return useContext(DomainContext);
}
