import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        setIsDarkMode(savedTheme === 'dark');
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        const theme = newMode ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        document.documentElement.classList.toggle('dark', newMode);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 relative">
            <nav className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-40 relative">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        {/* Logo Section */}
                        <div className="flex">
                            <Link href="/" className="flex shrink-0 items-center">
                                <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-100" />
                            </Link>
                        </div>

                        {/* Desktop Navigation Links */}
                        <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                            <NavLink
                                href={route('dashboard')}
                                active={route().current('dashboard')}
                                className="text-gray-800 dark:text-gray-100"
                            >
                                Dashboard
                            </NavLink>
                            <NavLink
                                href={route('chirps.index')}
                                active={route().current('chirps.index')}
                                className="text-gray-800 dark:text-gray-100"
                            >
                                Chirps
                            </NavLink>
                        </div>

                        {/* Right Section with Dark Mode and Profile Dropdown */}
                        <div className="ml-auto hidden sm:flex items-center space-x-6">
                            {/* Dark Mode Toggle */}
                            <div onClick={toggleDarkMode} className="relative w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer flex items-center justify-between p-1">
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 flex items-center justify-center rounded-full text-sm transition-transform duration-300 transform ${isDarkMode ? 'translate-x-6 bg-gray-900 text-white' : 'bg-yellow-400 text-yellow-700'}`}>
                                    {isDarkMode ? '🌙' : '🌞'}
                                </div>
                            </div>

                            {/* Profile Dropdown */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)} className="inline-flex items-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300">
                                        {user.name}
                                        <svg className="-mr-0.5 ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a 1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                {showingNavigationDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg rounded-md z-50">
                                        <Dropdown.Link href={route('profile.edit')} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button" className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Log Out</Dropdown.Link>
                                    </div>
                                )}
                            </Dropdown>
                        </div>

                        {/* Mobile Menu Button */}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="sm:hidden p-2 text-gray-500 dark:text-gray-300 focus:outline-none z-50">
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden absolute top-16 right-4 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-4 space-y-4 z-[9999]">
                        <NavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            className="relative block w-full text-left px-4 py-2 rounded text-gray-900 dark:text-gray-100"
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            href={route('chirps.index')}
                            active={route().current('chirps.index')}
                            className="relative block w-full text-left px-4 py-2 rounded text-gray-900 dark:text-gray-100"
                        >
                            Chirps
                        </NavLink>

                        {/* Dark Mode Toggle with Matching Text Size */}
                        <div className="flex items-center justify-between mx-auto w-full px-4 py-2 rounded">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                            </span>
                            <div
                                onClick={toggleDarkMode}
                                className="relative w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer flex items-center justify-between p-1"
                            >
                                <div
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 flex items-center justify-center rounded-full text-xs transition-transform duration-300 transform ${isDarkMode ? 'translate-x-6 bg-gray-900 text-white' : 'bg-yellow-400 text-yellow-700'
                                        }`}
                                >
                                    {isDarkMode ? '🌙' : '🌞'}
                                </div>
                            </div>
                        </div>

                        {/* Profile Links */}
                        <NavLink
                            href={route('profile.edit')}
                            active={route().current('profile.edit')}
                            className="relative block w-full text-left px-4 py-2 rounded text-gray-900 dark:text-gray-100"
                        >
                            Profile
                        </NavLink>
                        <NavLink
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="block w-full text-left px-4 py-2 rounded text-gray-900 dark:text-gray-100"
                        >
                            Log Out
                        </NavLink>
                    </div>
                )}
            </nav>

            {/* Header */}
            {header && (
                <header className="bg-white dark:bg-gray-800 shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-100 leading-tight">
                            {header}
                        </h2>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-lg">
                {children}
            </main>
        </div>
    );
}
