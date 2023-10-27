import '~/styles/style.scss'
import React, { useState, useEffect } from 'react'
import UserContext from 'lib/UserContext'
import { supabase, fetchUserRoles } from 'lib/Store'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function SupabaseSlackClone({ Component, pageProps }) {
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [userRoles, setUserRoles] = useState([])
  const router = useRouter()

  useEffect(() => {
    function saveSession(ss) {
      setSession(ss)
      const currentUser = ss?.user
      setUser(currentUser ?? null)
      setUserLoaded(!!currentUser)
      if (currentUser) {
        signIn(currentUser.id, currentUser.email)
        router.push('/channels/[id]', `/channels/1`)      
      }
    }
    
    supabase.auth.getSession().then(({data: { session }})=>saveSession(session))    
    const { subscription: authListener } = supabase.auth.onAuthStateChange(async (event, ss) => {
      if (event === 'SIGNED_IN')
        saveSession(ss)
      if(event === 'SIGNED_OUT')
        setSession(null)
    })
    return () => authListener.unsubscribe()
  }, [])

  const signIn = async () => {
    await fetchUserRoles((userRoles) => setUserRoles(userRoles.map((userRole) => userRole.role)))
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) 
      router.push('/')
  }

  return (<>
    <Head>
      <title>Legacy Chat</title>
      <link rel="icon" href="/favicon.ico" sizes="any" />
    </Head>
    <UserContext.Provider value={{userLoaded, user, userRoles, signIn, signOut}}>
    <Component {...pageProps} />
    </UserContext.Provider>
  </>)
}
