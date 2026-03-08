import { RefObject, useEffect } from "react";

export default function useClickOutside(refs: RefObject<HTMLElement>[], callback: () => void) {    
    useEffect(() => {
        function handleListener(e: MouseEvent) {
            const isCLickOutside =  refs.every((ref) => ref.current && !ref.current.contains(e.target as Node))
            if(isCLickOutside) {
                callback();
            }
        }

        document.addEventListener('mousedown', handleListener)
        return () => {
            document.removeEventListener('mousedown', handleListener)
        }
    }, [refs, callback])
}
