import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, Head } from '@inertiajs/react';
import axios from 'axios';
import { FaThumbsUp, FaHeart, FaRegComment, FaSadTear, FaSurprise, FaAngry, FaLaughBeam, FaBell } from 'react-icons/fa';
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
    const [pressStart, setPressStart] = useState(null); // To track the start time of the press
    const longPressThreshold = 500; // 500 ms for long press
    const reactionPopupTimeout = useRef(null); // Store timeout to control when to show the popup

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
        switch (type) {
            case 'like': return 'text-blue-500';
            case 'love': return 'text-red-500';
            case 'haha': return 'text-yellow-400';
            case 'sad': return 'text-blue-300';
            case 'wow': return 'text-yellow-500';
            case 'angry': return 'text-red-700';
            default: return 'text-gray-500';
        }
    };

    const handleMouseDown = (chirpId) => {
        setPressStart(Date.now());
        // Start a timeout to trigger the popup after a long press
        reactionPopupTimeout.current = setTimeout(() => {
            if (Date.now() - pressStart >= longPressThreshold) {
                setIsReactionPopupOpen(chirpId);
            }
        }, longPressThreshold);
    };
    
    const handleMouseUp = () => {
        setPressStart(null);
        clearTimeout(reactionPopupTimeout.current); // Clear timeout if press is released early
    };
    
    const handleMouseLeave = () => {
        setPressStart(null);
        clearTimeout(reactionPopupTimeout.current); // Clear timeout if mouse leaves button early
    };
    
    const closeReactionPopup = () => {
        setIsReactionPopupOpen(null);
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

    return (
        <AuthenticatedLayout>
            <Head title="Chirps" />
            <div className="max-w-3xl mx-auto p-6 sm:p-8 lg:p-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">Chirps</h1>
                    <div className="relative">
                        <button onClick={toggleNotificationPopup} className="relative hover:text-blue-500 dark:hover:text-yellow-400 transition-colors hover:scale-110 transform duration-200">
                            <FaBell className="text-gray-500 dark:text-gray-300 text-3xl hover:text-blue-500 dark:hover:text-blue-400" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-sm px-1">
                                {notifications.length > 0 ? notifications.length : ''}
                            </span>
                        </button>
                        {isNotificationOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 p-4 max-h-80 overflow-y-auto"
                            >
                                <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Notifications</h2>
                                {notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <motion.div
                                            key={notification.id}
                                            className="flex items-start p-3 border-b last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                            onClick={() => markNotificationAsRead(notification.id)}
                                            whileHover={{ scale: 1.02 }}
                                        >
                                            <div className="mr-4">
                                                {notification.type === 'reaction' && notification.reaction_type === 'like' && (
                                                    <FaThumbsUp className="text-blue-500 text-xl" />
                                                )}
                                                {notification.type === 'reaction' && notification.reaction_type === 'love' && (
                                                    <FaHeart className="text-red-500 text-xl" />
                                                )}
                                                {notification.type === 'reaction' && notification.reaction_type === 'haha' && (
                                                    <FaLaughBeam className="text-yellow-400 text-xl" />
                                                )}
                                                {notification.type === 'reaction' && notification.reaction_type === 'sad' && (
                                                    <FaSadTear className="text-blue-300 text-xl" />
                                                )}
                                                {notification.type === 'reaction' && notification.reaction_type === 'wow' && (
                                                    <FaSurprise className="text-yellow-500 text-xl" />
                                                )}
                                                {notification.type === 'reaction' && notification.reaction_type === 'angry' && (
                                                    <FaAngry className="text-red-700 text-xl" />
                                                )}
                                                {notification.type === 'comment' && (
                                                    <FaRegComment className="text-green-500 text-xl" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-gray-800 dark:text-gray-200">
                                                    <span className="font-semibold">
                                                        {notification.notifier && notification.notifier.name ? notification.notifier.name : 'Unknown User'}
                                                    </span>{" "}
                                                    {notification.type === 'reaction' ? (
                                                        <>
                                                            reacted to your chirp with{" "}
                                                            <span className="font-semibold">{notification.reaction_type}</span>.
                                                        </>
                                                    ) : (
                                                        'commented on your chirp.'
                                                    )}
                                                </p>
                                                <span className="text-gray-500 dark:text-gray-400 text-sm">{moment(notification.created_at).fromNow()}</span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-2 text-gray-500 dark:text-gray-400 text-center">
                                        No new notifications
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
                <form onSubmit={submit} className="flex space-x-4 items-start mb-6">
                    <textarea
                        value={data.message}
                        placeholder="What's on your mind?"
                        className="flex-1 border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 rounded-md shadow-lg p-4 w-full sm:w-3/4 lg:w-full dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 resize-none"
                        rows="3"
                        onChange={e => setData('message', e.target.value)}
                    ></textarea>
                    <PrimaryButton
                        className="p-8 text-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transform hover:scale-105 transition-transform"
                        type="submit"
                        disabled={processing}
                    >
                        Chirp
                    </PrimaryButton>
                </form>
                <InputError message={errors.message} className="mt-2 dark:text-red-400" />

                <div className="mt-8 space-y-8">
                    {chirps.map(chirp => (
                        <motion.div
                            key={chirp.id}
                            className="p-8 border-b bg-gray-200 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-950 rounded-lg transition-shadow shadow-md hover:shadow-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <motion.div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold"
                                        whileHover={{ rotate: 10 }}>
                                        {chirp.user.name[0]}
                                    </motion.div>
                                    <div>
                                        <span className="font-semibold text-lg text-gray-700 dark:text-gray-200">{chirp.user.name}</span>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{moment(chirp.created_at).fromNow()}</div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-800 dark:text-gray-300 text-lg mb-4">{chirp.message}</p>

                            <div className="flex items-center mt-4 space-x-6 relative">
                                <div
                                    onMouseDown={() => handleMouseDown(chirp.id)}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseEnter={() => setIsReactionPopupOpen(chirp.id)} // Show popup on hover
                                    className={`flex items-center cursor-pointer reaction-button ${reactionColor(userReactions[chirp.id])} hover:scale-105 transition-transform space-x-2`}
                                >
                                    {userReactions[chirp.id] === 'like' && <FaThumbsUp className="mr-1" />}
                                    {userReactions[chirp.id] === 'love' && <FaHeart className="mr-1" />}
                                    {userReactions[chirp.id] === 'haha' && <FaLaughBeam className="mr-1" />}
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
                                            className="absolute bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md bottom-full mb-2 flex space-x-4 reaction-popup"
                                            style={{ width: '90vw', maxWidth: '257px' }}
                                        >
                                            <button onClick={() => handleReaction(chirp.id, 'like')} className="text-blue-500 hover:scale-125 transition-transform"><FaThumbsUp size={24} /></button>
                                            <button onClick={() => handleReaction(chirp.id, 'love')} className="text-red-500 hover:scale-125 transition-transform"><FaHeart size={24} /></button>
                                            <button onClick={() => handleReaction(chirp.id, 'haha')} className="text-yellow-400 hover:scale-125 transition-transform"><FaLaughBeam size={24} /></button>
                                            <button onClick={() => handleReaction(chirp.id, 'sad')} className="text-blue-300 hover:scale-125 transition-transform"><FaSadTear size={24} /></button>
                                            <button onClick={() => handleReaction(chirp.id, 'wow')} className="text-yellow-500 hover:scale-125 transition-transform"><FaSurprise size={24} /></button>
                                            <button onClick={() => handleReaction(chirp.id, 'angry')} className="text-red-700 hover:scale-125 transition-transform"><FaAngry size={24} /></button>
                                        </motion.div>
                                    )}
                                </div>
                                <button onClick={() => fetchComments(chirp.id)} className="flex items-center text-gray-500 dark:text-gray-300 hover:text-green-500 dark:hover:text-green-400 transition-colors">
                                    <FaRegComment className="mr-1" /> Comment ({comments[chirp.id]?.length || 0})
                                </button>
                            </div>

                            <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                                {reactions[chirp.id] && reactions[chirp.id].length > 0 && (
                                    <div className="flex items-center space-x-4">
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
                                                {type === 'haha' && <FaLaughBeam className="text-yellow-400" />}
                                                {type === 'sad' && <FaSadTear className="text-blue-300" />}
                                                {type === 'wow' && <FaSurprise className="text-yellow-500" />}
                                                {type === 'angry' && <FaAngry className="text-red-700" />}
                                                <span>{names.length}</span>

                                                {hoveredReaction.chirpId === chirp.id && hoveredReaction.type === type && (
                                                    <div className="absolute left-0 bottom-full mb-1 w-56 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg whitespace-normal">
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
                                <div className="mt-6 border-t pt-4 border-gray-300 dark:border-gray-700">
                                    <div className="flex items-start space-x-3 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="flex-1 p-3 border rounded-lg shadow-sm w-full dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                                        />
                                        <motion.button
                                            onClick={() => handleCommentSubmit(chirp.id)}
                                            className="bg-blue-500 text-white py-3 px-5 rounded-lg shadow-md whitespace-nowrap hover:bg-blue-600 transition-transform transform hover:scale-105"
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Comment
                                        </motion.button>
                                    </div>
                                    <div className="space-y-6">
                                        {(comments[chirp.id] || []).map((comment) => (
                                            <motion.div
                                                key={comment.id}
                                                className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-sm"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="flex justify-between">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{comment.user.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{moment(comment.created_at).fromNow()}</span>
                                                </div>
                                                <p className="text-gray-800 dark:text-gray-300 mt-2">{comment.content}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}