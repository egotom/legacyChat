import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState,useRef } from 'react'
import UserContext from '~/lib/UserContext'
import { addChannel, deleteChannel,searchChannel, searchUsers, createInvite , rejectInvite, acceptInvite } from '~/lib/Store'
import TrashIcon from '~/components/TrashIcon'
import Modal from './Modal'

export default function Layout(props) {
  const { signOut, user, userRoles } = useContext(UserContext)
  const [show, setShow] = useState(false)
  const [ss, setSs] = useState(false)
  const [expend,setExp] = useState(false)
  const [coll, setColl] = useState(false)
  const refWdith = useRef(null)
  useEffect(()=>{
    setColl(refWdith.current?.offsetWidth<660) 
    window.addEventListener('resize', ()=>{
        setColl(refWdith.current?.offsetWidth<660)
    })
  },[])

  const slugify = (text) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      // .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  } 

  const confirm =(slug)=>{
    setShow(false);
    if (slug) 
      addChannel(slugify(slug), user.id);
  }

  return (<>
    <Head>
      <title>Chat ...</title>
    </Head>
  
    <main className="main flex h-screen w-screen overflow-hidden" ref={refWdith}>      
      <nav className=" flex justify-between items-center bg-gray-900 text-gray-100" >
      {!coll &&
        <div className="bg-gray-900 text-gray-100 overflow-scroll h-full p-2 " style={{ maxWidth: '35%', minWidth: 350}}>
          <div className="p-2 flex flex-col space-y-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={()=>{setExp(!expend)}}>
              <h6 className="text-xs " >{user?.email}</h6>
              <button>
                {expend?
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
                </svg>:
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
                </svg>}
              </button>            
            </div>
          </div>
          <div className={expend?"px-2":"hidden"}>
            <button className="btn-primary w-full my-1" onClick={() => signOut()}>退 出</button>
            <button className="btn-primary w-full my-1" onClick={() => setShow(true)}>创建群组</button>
            <button className="btn-primary w-full my-1" onClick={() => setSs(true)}>搜 索</button>
          </div>
          {props.invites?.length>0 && <div className='my-3'>添加好友请求</div>}
          {props.invites?.map(it=>
            <div className="flex justify-between my-3">
              <div className='px-2'>{it.sender.username}</div>  
              <div className='flex gap-2'>
                <button onClick={()=>acceptInvite(it)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button className='text-red-600' onClick={()=>rejectInvite(it.id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          <hr className="my-4 mx-2" />
          <ul className="">
            {props.channels?.map((x) => (
              <SidebarItem isActiveChannel={x.id === props.activeChannelId}
                channel={x}
                key={x.id}                
                user={user}
                userRoles={userRoles}
              />
            ))}
          </ul>
        </div>}
        <button onClick={()=>setColl(!coll)} className='bg-gray-900 text-gray-100'>
          {coll?
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
          </svg> : 
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
          }
        </button>
      </nav>      
      <div className="flex-1 bg-gray-800 h-screen">{props.children}</div>
      {show && <Modal children ={<PromptChannel enable={confirm} />} />}
      {ss && <Modal children ={<PromptFriend enable={()=>setSs(!ss)} user={user}/>} />}
    </main>
  </>)
}

const PromptChannel=({enable})=>{
  const [titile, setTitile] = useState('')
  return (
  <div className='flex flex-col justify-between items-center w-full h-full py-6'>
    <div className="text-xl font-medium">输入群组名称</div>
    <div className="w-2/3 border border-gray-400 p-1 flex justify-between rounded bg-white">
      <input type="text" className='grow outline-none' value={titile} placeholder='输入群组名' onChange={(e)=>setTitile(e.target.value)}/>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    </div>
    <div className="flex gap-10">      
      <button onClick={()=>enable(titile)} className='btn-outline mx-2'>创建</button>
      <button onClick={()=>enable()} className='btn-outline'>关闭</button>
    </div>
  </div>)
}

const PromptFriend=({enable,user})=>{
  const [eml, setEml] = useState('')
  const [us,setUs] = useState([])
  const [result,setRs] = useState('')
  const [swt,setSwt] = useState('people')
  const [grp, setGrp] = useState('')

  const search=()=>{    
    setRs('')
    if(swt=="people"){  
      const key= eml.trim()
      if(key.length<3) return    
      searchUsers(key,user.id).then(data=>setUs(data))
    }      
    else{
      const key= eml.trim()
      const gp = grp.trim()
      searchChannel(key, gp).then(data=>{
        
      })
    }
  }

  const addFriend=(user,id)=>{
    if(swt == 'people')
      createInvite(user,id).then(b=>{
        if(b) setRs('发送好友请求成功！')
        else setRs('发送好友请求失败！')
      })
    else{

    }
  }
  return (
  <div className='flex flex-col justify-between items-center w-full h-full'>
    <div className="text-xl font-medium">搜索群组或联系人</div>
    <div className="flex flex-col w-full gap-2 items-center">
      <select className="w-2/3 border border-gray-400 p-1.5 flex justify-between rounded bg-white" onChange={e=>setSwt(e.target.value)}>
        <option value ="people">联系人</option>
        <option value ="group">群组</option>
      </select>
      <div className="w-2/3 border border-gray-400 p-1 flex justify-between rounded bg-white">
        <input type="text" className='grow outline-none' value={eml} placeholder='输入联系人或群组创建者邮箱'onChange={(e)=>setEml(e.target.value)}/>
        <button onClick={search}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </button>
      </div>
      {swt=="group" && <div className="w-2/3 border border-gray-400 p-1 flex justify-between rounded bg-white">
        <input type="text" className='grow outline-none' value={grp} placeholder='输入群组名称' onChange={(e)=>setGrp(e.target.value)}/>
        <button >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </button>
      </div>}
    </div>

    <div className="flex flex-col w-2/3">
      {us.map(it=>
      <div className="flex justify-between items-center my-2">
        <div>{it.username}</div>
        <button className='btn-outline' onClick={()=>addFriend(user?.id, it.id)}>添加好友</button>
      </div>)}
      <div className="px-8 text-indigo-700 ">{result}</div>
    </div>

    <div className="w-full flex justify-center gap-10">
      <button onClick={search} className='btn-outline'>搜索</button>
      <button onClick={()=>enable(eml)} className='btn-outline'>关闭</button>
    </div>    
  </div>)
}

const SidebarItem = ({ channel, isActiveChannel, userRoles }) => {
  const router = useRouter()
  return(
  <li className={channel.peer? "flex items-center justify-between pl-4 my-2":"my-2 flex items-center justify-between channel-a"}>
    <Link href={`/channels/${channel.id}`} >
      <a className={isActiveChannel ? 'font-bold' : ''}>{channel.slug}</a>
    </Link>
    {channel.id !== 1 && (channel.peer || userRoles.includes('admin')) && (
      <button onClick={() => deleteChannel(channel.id)}>
        <TrashIcon />
      </button>
    )}
  </li>)
}