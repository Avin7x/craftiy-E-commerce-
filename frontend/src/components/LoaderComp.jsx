import { Loader, Loader2 } from 'lucide-react'
import React from 'react'

const LoaderComp = () => {
  return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <Loader2 className='w-20 h-20 text-emerald-500 ' />
    </div>
  )
}

export default LoaderComp