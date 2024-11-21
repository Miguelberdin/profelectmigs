import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line, Doughnut } from 'react-chartjs-2';
import { FaClipboardList, FaThumbsUp, FaComments, FaCrown, FaUserCircle } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, ArcElement, Title, Tooltip, Legend, PointElement, Filler } from 'chart.js';
import moment from 'moment';
// Register chart components
ChartJS.register(CategoryScale, LinearScale, LineElement, ArcElement, Title, Tooltip, Legend, PointElement, Filler);

export default function Dashboard({ auth }) {
    const [stats, setStats] = useState({
        numberOfPosts: 0,
        reactionsReceived: 0,
        commentsReceived: 0,
        latestComments: [],
        topReactor: '',
        topCommenter: '',
        dailyStats: {
            dates: [],
            posts: [],
            reactions: [],
            comments: [],
        },
    });
    const [showAllComments, setShowAllComments] = useState(false);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const response = await axios.get(route('dashboard.stats', { user_id: auth.user.id }));
                // Fallback to ensure dailyStats is set properly if the response doesn't contain it
                const { dailyStats = { dates: [], posts: [], reactions: [], comments: [] }, ...restStats } = response.data;
                setStats({ ...restStats, dailyStats });
            } catch (error) {
                console.error('Error fetching dashboard statistics:', error);
            }
        };

        fetchStatistics();
    }, [auth.user.id]);

    const lineChartData = {
        labels: stats.dailyStats.dates,
        datasets: [
            {
                label: 'Posts',
                data: stats.dailyStats.posts,
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                fill: true,
            },
            {
                label: 'Reactions',
                data: stats.dailyStats.reactions,
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                fill: true,
            },
            {
                label: 'Comments',
                data: stats.dailyStats.comments,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: true,
            },
        ],
    };

    const doughnutData = {
        labels: ['Posts', 'Reactions', 'Comments'],
        datasets: [
            {
                data: [stats.numberOfPosts, stats.reactionsReceived, stats.commentsReceived],
                backgroundColor: ['#4F46E5', '#EF4444', '#10B981'],
                hoverBackgroundColor: ['#3730A3', '#B91C1C', '#047857'],
            },
        ],
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center space-x-4">
                                <FaClipboardList className="text-4xl text-blue-600" />
                                <div>
                                    <h3 className="text-xl font-bold">Number of Your Posts</h3>
                                    <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-200">{stats.numberOfPosts}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center space-x-4">
                                <FaThumbsUp className="text-4xl text-red-600" />
                                <div>
                                    <h3 className="text-xl font-bold">Reactions Received</h3>
                                    <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-200">{stats.reactionsReceived}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="flex items-center space-x-4">
                                <FaComments className="text-4xl text-green-600" />
                                <div>
                                    <h3 className="text-xl font-bold">Comments Received</h3>
                                    <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-200">{stats.commentsReceived}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                        <div className="bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-8">
                            <h3 className="text-2xl font-bold mb-6">Statistics Overview (Daily)</h3>
                            <div className="h-80">
                                <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-8">
                            <h3 className="text-2xl font-bold mb-6">Statistics Breakdown</h3>
                            <div className="h-80">
                                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-800 mt-12 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-2xl font-bold mb-6">Latest Comments on Your Posts</h3>
                        <div className="space-y-6">
                            {stats.latestComments.length > 0 ? (
                                <>
                                    {stats.latestComments.slice(0, showAllComments ? stats.latestComments.length : 1).map((comment, index) => (
                                        <div key={index} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg shadow-md relative">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                                                        {comment.user ? comment.user.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{comment.user}</p>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{comment.created_at ? moment(comment.created_at).format('MMMM Do YYYY, h:mm:ss a') : 'Unknown Date'}</p>
                                            </div>
                                            <div className="pl-12">
                                                <p className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setShowAllComments(!showAllComments)}
                                        className="text-blue-500 hover:underline mt-4"
                                    >
                                        {showAllComments ? 'Show Less' : 'Show More'}
                                    </button>
                                </>
                            ) : (
                                <div className="text-gray-500 dark:text-gray-400">No comments available.</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-200 dark:bg-gray-800 mt-12 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-2xl font-bold mb-6">Top Reactors</h3>
                        <div className="space-y-4">
                            {stats.topReactors && stats.topReactors.length > 0 ? (
                                stats.topReactors.map((reactor, index) => (
                                    <div key={index} className="flex items-center space-x-4">
                                        <FaCrown
                                            className={`text-2xl ${index === 0
                                                ? 'text-yellow-500' // Gold for 1st place
                                                : index === 1
                                                    ? 'text-gray-400' // Silver for 2nd place
                                                    : index === 2
                                                        ? 'text-amber-700' // Bronze for 3rd place
                                                        : 'text-gray-400' // Default gray for other places
                                                }`}
                                        />
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">{reactor.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Reactions: {reactor.reactions_count}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">No reactors available.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-200 dark:bg-gray-800 mt-12 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-2xl font-bold mb-6">Top Commenters</h3>
                        <div className="space-y-4">
                            {stats.topCommenters && stats.topCommenters.length > 0 ? (
                                stats.topCommenters.map((commenter, index) => (
                                    <div key={index} className="flex items-center space-x-4">
                                        <FaCrown
                                            className={`text-2xl ${index === 0
                                                ? 'text-yellow-500' // Gold for 1st place
                                                : index === 1
                                                    ? 'text-gray-400' // Silver for 2nd place
                                                    : index === 2
                                                        ? 'text-amber-700' // Bronze for 3rd place
                                                        : 'text-gray-400' // Default gray for other places
                                                }`}
                                        />
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">{commenter.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Comments: {commenter.comments_count}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">No commenters available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}