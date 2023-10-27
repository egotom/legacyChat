import { useState, useEffect, useContext  } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import UserContext from '~/lib/UserContext'
import {insetEmoji} from '~/components/Emoji'

export const supabase = createPagesBrowserClient({ multiTab: false })

/**
 * @param {number} channelId the currently selected Channel
 */
export const useStore = (props) => {
  const [channels, setChannels] = useState([])
  const [invites, setInvites] = useState([])
  const [messages, setMessages] = useState([])
  const [users] = useState(new Map())
  const [newMessage, handleNewMessage] = useState(null)
  const [newChannel, handleNewChannel] = useState(null)
  const [newOrUpdatedUser, handleNewOrUpdatedUser] = useState(null)
  const [deletedChannel, handleDeletedChannel] = useState(null)
  const [deletedMessage, handleDeletedMessage] = useState(null)
  const [updateInvite, handleUpdateInvite] = useState(null)
  const [newInvite, handleNewInvite] = useState(null)
  const { user } = useContext(UserContext)
  // console.log(user)
  // Load initial data and set up listeners
  useEffect(() => {
    fetchChannels(setChannels, user?.id)
    fetchInvites(setInvites, user?.id)
    // Listen for new and deleted messages
    const messageListener = supabase.channel('public:messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => handleNewMessage(payload.new)
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => handleDeletedMessage(payload.old)
      ).subscribe()

    // Listen for changes to our users
    const userListener = supabase.channel('public:users')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => handleNewOrUpdatedUser(payload.new)
      ).subscribe()

    // Listen for new and deleted channels
    const channelListener = supabase.channel('public:channels')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channels' },
        (payload) => handleNewChannel(payload.new)
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'channels' },
        (payload) => handleDeletedChannel(payload.old)
      ).subscribe()

    const inviteListener = supabase.channel('public:invite')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'invite' },
        (payload) => handleUpdateInvite(payload.old)
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invite' },
        (payload) => handleNewInvite(payload.new)
      ).subscribe()
      
    return () => {
      supabase.removeChannel(supabase.channel(messageListener))
      supabase.removeChannel(supabase.channel(userListener))
      supabase.removeChannel(supabase.channel(channelListener))
      supabase.removeChannel(supabase.channel(inviteListener))
    }
  }, [])

  // Update when the route changes
  useEffect(() => {
    if (props?.channelId > 0) {
      fetchMessages(props.channelId, (messages) => {
        messages.forEach((x) => {
          users.set(x.user_id, x.author)
          x.message=insetEmoji(x.message)
        })
        setMessages(messages)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.channelId])

  // New message received from Postgres
  useEffect(() => {
    if (newMessage && newMessage.channel_id === Number(props.channelId)) {
      const handleAsync = async () => {
        let authorId = newMessage.user_id
        if (!users.get(authorId)) await fetchUser(authorId, (user) => handleNewOrUpdatedUser(user))
        newMessage.message=insetEmoji(newMessage.message)
        setMessages(messages.concat(newMessage))
      }
      handleAsync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage])

  // Deleted message received from postgres
  useEffect(() => {
    if (deletedMessage) setMessages(messages.filter((message) => message.id !== deletedMessage.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedMessage])

  // New channel received from Postgres
  useEffect(() => {
    if (newChannel && user) //setChannels(channels.concat(newChannel))
    fetchChannels(setChannels, user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newChannel])

  // Deleted channel received from postgres
  useEffect(() => {
    if (deletedChannel) setChannels(channels.filter((channel) => channel.id !== deletedChannel.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedChannel])

  // New or updated user received from Postgres
  useEffect(() => {
    if (newOrUpdatedUser) users.set(newOrUpdatedUser.id, newOrUpdatedUser)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newOrUpdatedUser])

  useEffect(() => {    
    if (updateInvite) setInvites(invites.filter(it=>it.id!=updateInvite.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateInvite])
  useEffect(() => {
    if (newInvite && user) {
      fetchInvites(setInvites, user.id)
    // setInvites(newOrUpdatedUser.id, newOrUpdatedUser)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [newInvite])
  return {
    // We can export computed values here to map the authors to each message
    messages: messages.map((x) => ({ ...x, author: users.get(x.user_id) })),
    channels: channels !== null ?channels.sort((a, b) => a.peer>b.peer) :[],// channels.sort((a, b) => a.slug.localeCompare(b.slug)) : [],
    users,
    invites,
  }
}

/**
 * Fetch a single user
 * @param {number} userId
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchUser = async (userId, setState) => {
  try {
    let { data } = await supabase.from('users').select(`*`).eq('id', userId)
    let user = data[0]
    if (setState) setState(user)
    return user
  } catch (error) {
    console.log('error', error)
  }
}

export const searchUsers = async (user,id) => {
  try {
    let { data:frd } = await supabase.from('channels').select('member')
      .filter('member','cs',`{${id}}`)
      .is('slug',null)
    let frds=[]
    for(const it of frd){
      frds=frds.concat(it.member)
    }

    let { data } = await supabase.from('users').select('*')
      .ilike('username', `%${user}%`)
      .not('id','in',`(${frds})`).limit(1)

    return data?data:[]
  } catch (error) {
    console.log('error', error)
    return []
  }
}

/**
 * Fetch all roles for the current user
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchUserRoles = async (setState) => {
  try {
    let { data } = await supabase.from('user_roles').select(`*`)
    if (setState) setState(data)
    return data
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Fetch all messages and their authors
 * @param {number} channelId
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchMessages = async (channelId, setState) => {
  const dateStart = new Date()
  dateStart.setDate(dateStart.getDate() - 2)
  const ds = dateStart.toISOString()
  console.log(ds,'---------------------------------------')
  try {
    let { data } = await supabase.from('messages').select(`*, author:user_id(*)`)
      .eq('channel_id', channelId)
      .gt('inserted_at', ds)
      .order('inserted_at', { ascending: true })
    if (setState) setState(data)
    return data
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Insert a new message into the DB
 * @param {string} message The message text
 * @param {number} channel_id
 * @param {number} user_id The author
 */
export const addMessage = async (message, channel_id, user_id) => {
  if(message.trim().length<1) return
  try {
    let { data } = await supabase.from('messages').insert([{ message, channel_id, user_id }]).select()
    return data
  } catch (error) {
    console.log('error', error)
  }
}


/**
 * Delete a message from the DB
 * @param {number} message_id
 */
export const deleteMessage = async (message_id) => {
  try {
    let { data } = await supabase.from('messages').delete().match({ id: message_id })
    return data
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Fetch all channels
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchChannels = async (setState, id) => {
  try {
    let { data } = await supabase.from('channels').select('*')
      .or(`member.is.null, member.cs.{${id}}`)
    for(const it of data){
      if(it.slug)
        it['peer'] = false 
      else{
        const p = it.member.find(it=>it!==id)
        const { data } = await supabase.from('users').select('*').eq('id',p)
        it['slug'] = data[0].username
        it['peer'] = true
      }
    }
    // console.log(JSON.stringify(data,null,2),"(((((")
    if (setState) setState(data)
    return data
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Insert a new channel into the DB
 * @param {string} slug The channel name
 * @param {number} user_id The channel creator
 */
export const addChannel = async (slug, user_id) => {
  try {
    let { data } = await supabase.from('channels').insert([{ slug, created_by: user_id, member:[user_id] }]).select()
    return data
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Delete a channel from the DB
 * @param {number} channel_id
 */
export const deleteChannel = async (channel_id) => {
  try {
    let { data } = await supabase.from('channels').delete().match({ id: channel_id })
    console.log('data : ', data)
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export const searchChannel = async (users, group) =>{
  try{
    const { data:{user} } = await supabase.auth.getUser()
    if(users.length>3 && group.length>2){
      const {data, error } = await supabase.from('channels').select('slug, created_by(id, username)')
        .or(`created_by.username.ilike.%${users}%, slug.ilike.%${group}%`)
        // .not('member', 'cs', `{"${user.id}"}`)
        // .not('member', 'is', null)
         // .neq('created_by.id', user.id)

      console.log(JSON.stringify(data, null, 2),'---------------------------------')
      rets(data,error)
    }
    if(users.length<3 && group.length>2){
      const {data, error } = await supabase.from('channels').select('slug, created_by(id, username)')
        .ilike('slug', `%${group}%`)
        .neq('created_by.id', user.id)
        .not('member' ,'cs', `{${user.id}}`)

      rets(data, error)
    }
    function rets(d,e){
      if(e) return e
      console.log(JSON.stringify(d, null, 2))
      return  d
    }    
  }catch(error){
    console.log('error',error)
    return false
  }
}

export const fetchInvites = async (setState, id) => {
  try {
    let { data } = await supabase.from('invite').select('*, sender(*)').eq('receiver',id).eq('status', 0)
    if (setState) setState(data)
    console.log(JSON.stringify(data,null,2),'=======================')
    return data
  } catch (error) {
    console.log('error', error)
  }
}

export const createInvite = async (id, fid) =>{
  if(id==fid) return 
  try{
    const { error } = await supabase.from('invite').insert([{sender:id, receiver:fid }])
    return error? false: true
  }catch(error){
    console.log('error',error)
    return false
  }
} 

export const rejectInvite  = async (id) =>{
  try{
    const { error } = await supabase.from('invite').update({ status: 1 }).eq('id', id)
    return error? false: true
  }catch(error){
    console.log('error',error)
    return false
  }
} 

export const acceptInvite = async (ivt) =>{
  try{
    const { error } = await supabase.from('channels').insert({ created_by: ivt.receiver, member: [ivt.receiver, ivt.sender.id] })
    let error2=true
    if(!error){
      const { error:e } = await supabase.from('invite').update({ status: 2 }).eq('id', ivt.id)
      error2=e
    }
    return (error || error2)? false: true
  }catch(error){
    console.log('error',error)
    return false
  }
}

// create policy "Individuals can insert a channel column created_by eq their own." 
// on channels for insert with check (auth.uid () = created_by);

// create policy "Individuals can delete channels it's contain their own." 
// on channels for delete using (auth.uid () in member);

// select c.slug, u.id, u.username from channels as c join users as u on u.id=c.created_by