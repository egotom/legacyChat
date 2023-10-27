import { useContext } from 'react'
import UserContext from '~/lib/UserContext'
import { deleteMessage } from '~/lib/Store'
import TrashIcon from '~/components/TrashIcon'

const Message = ({key, message }) => {
  const { user, userRoles } = useContext(UserContext)
  return (
    <div className={user?.id === message.user_id ? "py-1 flex items-center space-x-2 self-end my-2": "py-1 flex space-x-2 items-center my-2"} key={key}>
      <div className="flex flex-col">
        <p className={user?.id === message.user_id ?"text-blue-700 font-bold self-end": "text-blue-700 font-bold"}>{message.author?.username}</p>
        <p className={user?.id === message.user_id ?"text-white self-end pl-20 md:pl-36 flex": "text-white pr-20 md:pr-36 flex"}>{message.message}</p>
      </div>
      <div className="text-gray-100 w-4">
        {(user?.id === message.user_id || userRoles.some((role) => ['admin', 'moderator'].includes(role))) && 
          <button onClick={() => deleteMessage(message.id)}>
            <TrashIcon />
          </button>
        }
      </div>
    </div>
  )
}
export default Message