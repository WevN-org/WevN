import { createContext,useContext } from "react";

export const DomainContext = createContext(
    {
        currentDomain: null,
        setDomain:() => {}
    }
)

export function changeDomain(){
    return useContext(DomainContext);
}
