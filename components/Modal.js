import { useState } from "react"
export default function Modal({show,children}){
    return(
        <div className="w-full h-full bg-gray-600/80 fixed flex items-center justify-center">
            <div className="w-full h-full md:w-3/4 md:h-5/6 lg:w-1/2 lg:h-2/3 bg-slate-200 rounded p-6">
                {children}
            </div>
        </div>
    )
}