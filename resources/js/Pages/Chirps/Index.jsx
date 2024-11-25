import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, Head } from '@inertiajs/react';
import axios from 'axios';
import { FaThumbsUp, FaHeart, FaRegComment, FaSadTear, FaSurprise, FaAngry, FaLaughBeam, FaBell, FaEllipsisV, FaPaperPlane } from 'react-icons/fa';
import { motion } from 'framer-motion';
import moment from 'moment';

export default function Index({ auth, chirps: initialChirps }) {
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
    const notificationPopupRef = useRef(null);
    const reactionPopupRef = useRef(null);
    const [pressStart, setPressStart] = useState(null);
    const longPressThreshold = 500;
    const reactionPopupTimeout = useRef(null);
    const [chirps, setChirps] = useState(initialChirps);
    const [editData, setEditData] = useState({ message: '' });
    const [editingChirpId, setEditingChirpId] = useState(null);
    const [dropdownOpenId, setDropdownOpenId] = useState(null);
    const dropdownRef = useRef(null);

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
            const sortedNotifications = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
        fetchNotifications();
    };

    const handleEditToggle = (chirp) => {
        setEditingChirpId(chirp.id);
        setEditData({ message: chirp.message });
        setDropdownOpenId(null);
    };


    const handleEditSubmit = async (chirpId) => {
        try {
            const response = await axios.put(route('chirps.update', { chirp: chirpId }), { message: editData.message });

            // Close edit mode
            setEditingChirpId(null);

            // Update the chirps list with the edited chirp, including the new updated_at timestamp
            setChirps((prevChirps) =>
                prevChirps.map((chirp) =>
                    chirp.id === chirpId ? { ...chirp, ...response.data.chirp } : chirp
                )
            );
        } catch (error) {
            console.error('Error updating chirp:', error);
        }
    };


    const handleDelete = async (chirpId) => {
        try {
            await axios.delete(route('chirps.destroy', { chirp: chirpId }));

            // Remove the deleted chirp from the state
            setChirps((prevChirps) => prevChirps.filter((chirp) => chirp.id !== chirpId));
            setDropdownOpenId(null); // Close dropdown after delete
        } catch (error) {
            console.error('Error deleting chirp:', error);
        }
    };

    const toggleDropdown = (chirpId) => {
        setDropdownOpenId(dropdownOpenId === chirpId ? null : chirpId);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close dropdown if clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpenId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        try {
            // Send chirp post request
            const response = await axios.post(route('chirps.store'), data);

            // Reset form input
            reset();

            // Add new chirp to the list at the top
            setChirps([response.data.chirp, ...chirps]);
        } catch (error) {
            console.error('Error posting chirp:', error);
        }
    };


    const handleReaction = async (chirpId, type) => {
        try {
            const response = await axios.post(route('reactions.store', { chirp: chirpId }), { type });
            const updatedReactions = response.data.reactions;
            setReactions((prevReactions) => ({ ...prevReactions, [chirpId]: updatedReactions }));
            setUserReactions((prevUserReactions) => ({ ...prevUserReactions, [chirpId]: type }));
            setIsReactionPopupOpen(null);  // Close popup after reaction is clicked
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    const removeReaction = async (chirpId) => {
        try {
            await axios.delete(route('reactions.destroy', { chirp: chirpId }));
            // Update state to remove user's reaction
            setReactions((prevReactions) => ({
                ...prevReactions,
                [chirpId]: prevReactions[chirpId].filter(reaction => reaction.user_id !== auth.user.id)
            }));
            setUserReactions((prevUserReactions) => {
                const updatedUserReactions = { ...prevUserReactions };
                delete updatedUserReactions[chirpId];
                return updatedUserReactions;
            });
        } catch (error) {
            console.error('Error removing reaction:', error);
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
        if (notificationPopupRef.current && !notificationPopupRef.current.contains(event.target)) {
            setIsNotificationOpen(false);
        }
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
                                ref={notificationPopupRef}
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
                    {chirps.map((chirp) => (
                        <motion.div key={chirp.id} className="p-8 border-b bg-gray-200 dark:bg-gray-950 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-lg">
                            <div className="mb-4 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    {/* User avatar and name */}
                                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                                        {chirp.user.name[0]}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-lg text-gray-700 dark:text-gray-200">{chirp.user.name}</span>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {moment(chirp.created_at).fromNow()}
                                            {chirp.updated_at && chirp.updated_at !== chirp.created_at && (
                                                <span className="text-xs ml-[-2px] sm:ml-2 text-gray-500 dark:text-gray-400 block sm:inline">
                                                    (edited {moment(chirp.updated_at).fromNow()})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Edit and Delete Dropdown */}
                                {chirp.user.id === auth.user.id && (
                                    <div ref={dropdownRef} className="relative">
                                        <button onClick={() => toggleDropdown(chirp.id)} className="text-gray-500 hover:text-gray-700">
                                            <FaEllipsisV />
                                        </button>
                                        {dropdownOpenId === chirp.id && (
                                            <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 py-1">
                                                <button
                                                    onClick={() => handleEditToggle(chirp)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(chirp.id)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-500 dark:hover:bg-gray-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Chirp Message or Edit Form */}
                            {editingChirpId === chirp.id ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleEditSubmit(chirp.id);
                                    }}
                                >
                                    <textarea
                                        value={editData.message}
                                        className="w-full border-gray-300 rounded-md shadow-lg p-4 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 resize-none"
                                        rows="3"
                                        onChange={(e) => setEditData({ message: e.target.value })}
                                    ></textarea>
                                    <div className="flex justify-end mt-2">
                                        <PrimaryButton type="submit">Save</PrimaryButton>
                                        <button
                                            type="button"
                                            onClick={() => setEditingChirpId(null)}
                                            className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <p className="text-gray-800 dark:text-gray-300 text-lg mb-4">{chirp.message}</p>
                            )}

                            <div className="flex items-center mt-4 space-x-6 relative">
                                <div
                                    onMouseDown={() => handleMouseDown(chirp.id)}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseEnter={() => setIsReactionPopupOpen(chirp.id)} // Show popup on hover
                                    onClick={() => userReactions[chirp.id] ? removeReaction(chirp.id) : setIsReactionPopupOpen(chirp.id)}
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
                                    <div className="flex items-center mb-4 space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="flex-1 p-3 border rounded-lg shadow-sm w-full dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                                        />
                                        <motion.button
                                            onClick={() => handleCommentSubmit(chirp.id)}
                                            className="p-2 rounded-full text-gray-500 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                                            whileTap={{ scale: 0.95 }}
                                            title="Add Comment"
                                        >
                                            <FaPaperPlane size={25} />
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