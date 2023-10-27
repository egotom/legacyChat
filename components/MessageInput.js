import { useState } from 'react'
import {Emojis} from '~/components/Emoji'

const MessageInput = ({ onSubmit }) => {
  const [messageText, setMessageText] = useState('')
  const [emj, setEmi] = useState(false)

  const submitOnEnter = (event) => {
    // Watch for enter key
    if (event.keyCode === 13) {
      onSubmit(messageText)
      setMessageText('')
    }
  }
  
  return (
    <div className="p-2 w-full flex items-center gap-2 relative">
      {emj &&<div className="absolute bottom-14 right-2 p-4 rounded bg-gray-900 w-full lg:w-1/2">
        <Emojis istEmj={(e)=>{setMessageText(messageText+`[${e}]`);setEmi(false)}}/>
      </div>}
      <input
        className="h-8 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        type="text"
        placeholder="输入信息"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyDown={(e) => submitOnEnter(e)}
      />
      <button className='text-blue-600 w-12 h-8 bg-white flex justify-center items-center rounded'
        onClick={()=>setEmi(!emj)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </button>
      <button className='text-blue-600 w-12 h-8 bg-white flex justify-center items-center rounded'
        onClick={()=>{onSubmit(messageText); setMessageText('')}}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      </button>
    </div>
  )
}

export default MessageInput
