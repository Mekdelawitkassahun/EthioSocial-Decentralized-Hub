import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEthioSocial } from '../hooks/useEthioSocial';
import { FaPaperPlane, FaSpinner, FaArrowLeft, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { getIPFSUrl } from '../utils/ipfs';
import { Message } from '../types';

export default function MessagesPage() {
  const router = useRouter();
  const { u: initialUser } = router.query;
  const { 
    account, 
    profile, 
    sendMessage, 
    getMessages, 
    getConversations,
    getProfileByUsername,
    connectWallet,
    logout,
    isContractOwner,
    followUser,
    unfollowUser,
    isFollowing
  } = useEthioSocial();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!account) return;
    try {
      const convos = await getConversations();
      const convoProfiles = await Promise.all(
        convos.map(async (addr: string) => {
          const p = await getProfileByUsername(addr);
          return p || { userAddress: addr, displayName: 'Unknown', username: addr.slice(0, 8) };
        })
      );
      setConversations(convoProfiles);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [account, getConversations, getProfileByUsername]);

  const loadMessages = useCallback(async (userAddress: string) => {
    setIsLoadingMessages(true);
    try {
      const msgs = await getMessages(userAddress);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [getMessages]);

  useEffect(() => {
    if (account) {
      loadConversations();
    }
  }, [account, loadConversations]);

  useEffect(() => {
    if (initialUser && account) {
      const initChat = async () => {
        const p = await getProfileByUsername(initialUser as string);
        if (p) {
          setSelectedUser(p);
          loadMessages(p.userAddress);
        }
      };
      initChat();
    }
  }, [initialUser, account, getProfileByUsername, loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || isSending) return;

    if (!profile) {
      toast.error('You need to create a profile before you can send messages!');
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(selectedUser.userAddress, newMessage);
      setNewMessage('');
      await loadMessages(selectedUser.userAddress);
      await loadConversations(); // Update list to show most recent
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          account={account} profile={profile} isContractOwner={isContractOwner}
          onConnectWallet={connectWallet} onLogout={logout} onShowProfileModal={() => {}} 
          getProfileByUsername={getProfileByUsername}
          followUser={followUser}
          unfollowUser={unfollowUser}
          isFollowing={isFollowing}
        />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-65px)]">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Connect your wallet to chat</h2>
          <button 
            onClick={connectWallet}
            className="px-8 py-3 bg-black text-white rounded-2xl font-black shadow-xl"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
      <Head>
        <title>EthioSocial | Messages</title>
      </Head>

      <Navbar 
        account={account}
        profile={profile}
        isContractOwner={isContractOwner}
        onConnectWallet={connectWallet}
        onLogout={logout}
        onShowProfileModal={() => {}}
        getProfileByUsername={getProfileByUsername}
        followUser={followUser}
        unfollowUser={unfollowUser}
        isFollowing={isFollowing}
      />

      <div className="flex-1 flex max-w-6xl mx-auto w-full bg-white border-x border-gray-100 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-black text-gray-900">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="p-8 flex justify-center">
                <FaSpinner className="animate-spin text-blue-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 font-bold text-sm">No conversations yet 🇪🇹</p>
                <p className="text-xs text-gray-400 mt-2">Start a chat from a user's profile!</p>
              </div>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.userAddress}
                  onClick={() => {
                    setSelectedUser(convo);
                    loadMessages(convo.userAddress);
                  }}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-gray-50 border-b border-gray-50 ${selectedUser?.userAddress === convo.userAddress ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-ethiopian-green via-ethiopian-yellow to-ethiopian-red flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold text-xl shadow-sm">
                    {convo.avatarHash ? (
                      <img src={getIPFSUrl(convo.avatarHash)} className="w-full h-full object-cover" />
                    ) : (
                      convo.displayName.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{convo.displayName}</h4>
                    <p className="text-xs text-blue-500 font-bold truncate">@{convo.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-gray-50/30 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-4">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                >
                  <FaArrowLeft className="text-gray-400" />
                </button>
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => router.push(`/profile/${selectedUser.username}`)}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ethiopian-green via-ethiopian-yellow to-ethiopian-red flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold shadow-sm">
                    {selectedUser.avatarHash ? (
                      <img src={getIPFSUrl(selectedUser.avatarHash)} className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.displayName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 leading-none">{selectedUser.displayName}</h3>
                    <p className="text-xs font-bold text-blue-500">@{selectedUser.username}</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-10">
                    <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaPaperPlane className="text-blue-500 text-2xl" />
                    </div>
                    <p className="text-gray-400 font-bold">No messages yet. Say hi! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender.toLowerCase() === account.toLowerCase();
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                          isMe 
                            ? 'bg-black text-white rounded-br-none' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}>
                          <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${isMe ? 'text-gray-400' : 'text-gray-300'}`}>
                            {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-20 shadow-lg shadow-black/10 active:scale-95"
                  >
                    {isSending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-6">
                <FaUser className="text-gray-300 text-3xl" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-400 font-bold max-w-xs">Choose an existing chat or visit a profile to start a new one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
