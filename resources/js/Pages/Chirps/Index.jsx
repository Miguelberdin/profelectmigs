import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, Head } from '@inertiajs/react';
import axios from 'axios';
import { FaThumbsUp, FaHeart, FaRegComment, FaSadTear, FaSurprise, FaAngry, FaBell } from 'react-icons/fa';
import { motion } from 'framer-motion';
import moment from 'moment';

export default function Index({ auth, chirps }) {
    const { data, setData, post, processing, reset, errors } = useForm({ message: '' });
    const [isReactionPopupOpen, setIsReactionPopupOpen] = useState(null);
    const [reactions, setReactions] = useState({});
    const [userReactions, setUserReactions] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState('');
    const [openCommentSection, setOpenCommentSection] = useState(null);
    const [hoveredReaction, setHoveredReaction] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const reactionPopupRef = useRef(null);

    useEffect(() => {
        const initialReactions = {};
        const initialUserReactions = {};
        const initialComments = {};
        chirps.forEach(chirp => {
            initialReactions[chirp.id] = chirp.reactions || [];
            const userReaction = chirp.reactions?.find(r => r.user_id === auth.user.id);
            if (userReaction) {
                initialUserReactions[chirp.id] = userReaction.type;
            }
            initialComments[chirp.id] = chirp.comments || [];
        });
        setReactions(initialReactions);
        setUserReactions(initialUserReactions);
        setComments(initialComments);
    }, [chirps]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(route('notifications.index'));
            setNotifications(response.data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const toggleNotificationPopup = () => {
        setIsNotificationOpen(!isNotificationOpen);
    };

    const markNotificationAsRead = async (id) => {
        await axios.patch(route('notifications.markAsRead', { id }));
        fetchNotifications(); // Refresh notifications after marking as read
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('chirps.store'), { onSuccess: () => reset() });
    };

    const handleReaction = async (chirpId, type) => {
        try {
            const response = await axios.post(route('reactions.store', { chirp: chirpId }), { type });
            const updatedReactions = response.data.reactions;
            setReactions(prevReactions => ({ ...prevReactions, [chirpId]: updatedReactions }));
            setUserReactions(prevUserReactions => ({ ...prevUserReactions, [chirpId]: type }));
            setIsReactionPopupOpen(null);  // Close popup after reaction is clicked
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    const reactionColor = (type) => {
        switch(type) {
            case 'like': return 'text-blue-500';
            case 'love': return 'text-red-500';
            case 'sad': return 'text-blue-300';
            case 'wow': return 'text-yellow-500';
            case 'angry': return 'text-red-700';
            default: return 'text-gray-500';
        }
    };

    const fetchComments = async (chirpId) => {
        if (openCommentSection === chirpId) {
            setOpenCommentSection(null);
        } else {
            setOpenCommentSection(chirpId);
            const response = await axios.get(route('comments.index', chirpId));
            setComments(prev => ({ 
                ...prev, 
                [chirpId]: response.data.comments.reverse() // Show recent comments first
            }));
        }
    };

    const handleCommentSubmit = async (chirpId) => {
        if (!newComment.trim()) return;
        try {
            const response = await axios.post(route('comments.store', chirpId), { content: newComment });
            setComments(prev => ({
                ...prev,
                [chirpId]: [response.data.comment, ...(prev[chirpId] || [])],  // Add new comment at the beginning
            }));
            setNewComment('');
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    };

    const handleOutsideClick = (event) => {
        if (reactionPopupRef.current && !reactionPopupRef.current.contains(event.target)) {
            setIsReactionPopupOpen(null);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    // Updated JSX elements with Tailwind classes for responsiveness

return (
    <AuthenticatedLayout>
        <Head title="Chirps" />
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Chirps</h1>
                <div className="relative">
                    <button onClick={toggleNotificationPopup} className="relative">
                        <FaBell className="text-gray-500 text-2xl" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-sm px-1">
                            {notifications.length > 0 ? notifications.length : ''}
                        </span>
                    </button>
                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-md shadow-lg z-50 p-2 max-h-72 overflow-y-auto">
                            <h2 className="text-lg font-bold mb-2">Notifications</h2>
                            {notifications.length > 0 ? (
    notifications.map(notification => (
        <div
            key={notification.id}
            className="flex items-start p-2 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
            onClick={() => markNotificationAsRead(notification.id)}
        >
            <div className="mr-3">
                {notification.type === 'reaction' ? (
                    <FaThumbsUp className="text-blue-500" />
                ) : (
                    <FaRegComment className="text-green-500" />
                )}
            </div>
            <div>
                <p className="text-gray-800">
                    <span className="font-semibold">
                        {notification.notifier && notification.notifier.name ? notification.notifier.name : 'Unknown User'}
                    </span>{" "}
                    {notification.type === 'reaction' ? 'reacted to' : 'commented on'} your chirp.
                </p>
                <span className="text-gray-500 text-sm">{moment(notification.created_at).fromNow()}</span>
            </div>
        </div>
    ))
) : (
    <div className="p-2 text-gray-500 text-center">
        No new notifications
    </div>
)}

                        </div>
                    )}
                </div>
            </div>
            <form onSubmit={submit} className="flex space-x-4 items-start">
                <textarea
                    value={data.message}
                    placeholder="What's on your mind?"
                    className="flex-1 border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 rounded-md shadow-lg p-2 w-full sm:w-3/4 lg:w-full"
                    onChange={e => setData('message', e.target.value)}
                ></textarea>
                <PrimaryButton className="p-3" disabled={processing}>Chirp</PrimaryButton>
            </form>
            <InputError message={errors.message} className="mt-2" />

            <div className="mt-6 bg-white shadow-md rounded-lg divide-y">
                {chirps.map(chirp => (
                    <div key={chirp.id} className="p-6 border-b bg-gray-50 hover:bg-white rounded-lg transition-shadow shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="font-semibold text-gray-700">{chirp.user.name}</span>
                            <span className="text-xs text-gray-500">{moment(chirp.created_at).fromNow()}</span>
                        </div>
                        <p className="text-gray-800">{chirp.message}</p>

                        <div className="flex items-center mt-4 space-x-4 relative">
                            <div 
                                onClick={() => setIsReactionPopupOpen(isReactionPopupOpen === chirp.id ? null : chirp.id)}
                                className={`flex items-center cursor-pointer reaction-button ${reactionColor(userReactions[chirp.id])} hover:scale-105 transition-transform`}
                            >
                                {userReactions[chirp.id] === 'like' && <FaThumbsUp className="mr-1" />}
                                {userReactions[chirp.id] === 'love' && <FaHeart className="mr-1" />}
                                {userReactions[chirp.id] === 'sad' && <FaSadTear className="mr-1" />}
                                {userReactions[chirp.id] === 'wow' && <FaSurprise className="mr-1" />}
                                {userReactions[chirp.id] === 'angry' && <FaAngry className="mr-1" />}
                                {userReactions[chirp.id] || 'React'}
                                {isReactionPopupOpen === chirp.id && (
                                    <motion.div 
                                        ref={reactionPopupRef}
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }} 
                                        className="absolute bg-white p-3 rounded-md shadow-md bottom-full mb-2 flex space-x-4 reaction-popup"
                                        style={{ width: '90vw', maxWidth: '220px', padding: '10px' }}
                                    >
                                        <button onClick={() => handleReaction(chirp.id, 'like')} className="text-blue-500 hover:scale-125 transition-transform"><FaThumbsUp size={24} /></button>
                                        <button onClick={() => handleReaction(chirp.id, 'love')} className="text-red-500 hover:scale-125 transition-transform"><FaHeart size={24} /></button>
                                        <button onClick={() => handleReaction(chirp.id, 'sad')} className="text-blue-300 hover:scale-125 transition-transform"><FaSadTear size={24} /></button>
                                        <button onClick={() => handleReaction(chirp.id, 'wow')} className="text-yellow-500 hover:scale-125 transition-transform"><FaSurprise size={24} /></button>
                                        <button onClick={() => handleReaction(chirp.id, 'angry')} className="text-red-700 hover:scale-125 transition-transform"><FaAngry size={24} /></button>
                                    </motion.div>
                                )}
                            </div>
                            <button onClick={() => fetchComments(chirp.id)} className="flex items-center text-gray-500 hover:text-green-500">
                                <FaRegComment className="mr-1" /> Comment ({comments[chirp.id]?.length || 0})
                            </button>
                        </div>

                        <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                            {reactions[chirp.id] && reactions[chirp.id].length > 0 && (
                                <div className="flex items-center space-x-3">
                                    {Object.entries(reactions[chirp.id].reduce((acc, reaction) => {
                                        acc[reaction.type] = acc[reaction.type] ? [...acc[reaction.type], reaction.user.name] : [reaction.user.name];
                                        return acc;
                                    }, {})).map(([type, names]) => (
                                        <div 
                                            key={`${chirp.id}-${type}`} 
                                            className="relative flex items-center space-x-1"
                                            onMouseEnter={() => setHoveredReaction({ chirpId: chirp.id, type })}
                                            onMouseLeave={() => setHoveredReaction({})}
                                        >
                                            {type === 'like' && <FaThumbsUp className="text-blue-500" />}
                                            {type === 'love' && <FaHeart className="text-red-500" />}
                                            {type === 'sad' && <FaSadTear className="text-blue-300" />}
                                            {type === 'wow' && <FaSurprise className="text-yellow-500" />}
                                            {type === 'angry' && <FaAngry className="text-red-700" />}
                                            <span>{names.length}</span>

                                            {hoveredReaction.chirpId === chirp.id && hoveredReaction.type === type && (
                                                <div className="absolute left-0 bottom-full mb-1 w-52 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg whitespace-normal">
                                                    <div className="p-2 leading-tight">
                                                        {names.join(', ')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {openCommentSection === chirp.id && (
                            <div className="mt-4 border-t pt-4">
                                <div className="flex items-start space-x-2">
                                    <input 
                                        type="text" 
                                        placeholder="Add a comment..." 
                                        value={newComment} 
                                        onChange={(e) => setNewComment(e.target.value)} 
                                        className="flex-1 p-2 border rounded-lg shadow-sm w-full"
                                    />
                                    <button onClick={() => handleCommentSubmit(chirp.id)} className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md whitespace-nowrap">
                                        Post
                                    </button>
                                </div>
                                <div className="mt-4 space-y-4">
                                    {(comments[chirp.id] || []).map((comment) => (
                                        <div key={comment.id} className="bg-gray-100 p-3 rounded-lg shadow-sm">
                                            <div className="flex justify-between">
                                                <span className="font-semibold text-gray-700">{comment.user.name}</span>
                                                <span className="text-xs text-gray-500">{moment(comment.created_at).fromNow()}</span>
                                            </div>
                                            <p className="text-gray-800">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </AuthenticatedLayout>
);
}