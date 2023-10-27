import { useState,useEffect } from 'react'
import { supabase } from 'lib/Store'
const bgs=["/bg.jpg","/bg2.jpg","/bg3.jpg","/bg4.jpg"]

const Home = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rdbg,setRdbg] = useState("/bg.jpg")
  const [error,setErr] = useState("")

  const setGb = ()=>{    
    const id = Math.floor(Math.random()*bgs.length)
    localStorage.setItem("bg", bgs[id]);
    return bgs[id]
  }

  useEffect(()=>{
    const bg = localStorage.getItem("bg")
    if(bgs.includes(bg))
      setRdbg(bg)
    else
      setRdbg(setGb())
  },[])

  const handleLogin = async (type, username, password) => {
    if(username.trim()=='' || password.trim()=='') return 
    try {
      setErr('')
      const { error, data: { user } } =
        type === 'LOGIN'? await supabase.auth.signInWithPassword({ email: username, password })
          : await supabase.auth.signUp({ email: username, password })
      // If the user doesn't exist here and an error hasn't been raised yet,
      // that must mean that a confirmation email has been sent.
      // NOTE: Confirming your email address is required by default.
      if (error) {
        setErr(error.message)
      } 
      else if (!user) 
        setErr('注册成功，请登录注册邮箱，完成确认。')
    } catch (error) {
      console.log('error', error)
      setErr(error)
    }
  }

  return (
    <div className="w-full h-full flex justify-center items-center p-4 bg-gray-300">
      <img src={rdbg} className='w-full h-full absolute hover:cursor-pointer' onClick={()=>setRdbg(setGb())} />
      <div className="w-full sm:w-1/2 xl:w-1/3 fixed">
        <div className="border-teal p-10 border-t-12 mb-6 rounded-lg shadow-lg bg-slate-200">
          <div className="mb-4">
            <label className="font-bold text-grey-darker block mb-2">邮箱</label>
            <input type="text"
              className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="font-bold text-grey-darker block mb-2">密码</label>
            <input type="password"
              className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="my-2 text-red-500">
            {error}
          </div>
          <div className="flex flex-col gap-2">
            <a onClick={(e) => {
                e.preventDefault()
                handleLogin('SIGNUP', username, password)
              }}
              href={'/channels'}
              className="btn-primary "
            >注册</a>
            <a onClick={(e) => {
                e.preventDefault()
                handleLogin('LOGIN', username, password)
              }}
              href={'/channels'}
              className="btn-outline"
            >登录</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
