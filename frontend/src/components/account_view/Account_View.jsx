export default function AccountView({ state, setState }) {

    const handleBackButton = () => {
        setState(prev => ({
            ...prev,
            currentView: 'query',
            selectedDomainId: null
        }));
    };

    return (
        <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-md border border-gray-200 p-8 space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                        alt="avatar"
                        className="w-16 h-16 rounded-full border border-gray-200"
                    />
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">John Doe</h2>
                        <p className="text-sm text-gray-500">john.doe@example.com</p>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="space-y-6">
                    {/* Profile Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Profile
                        </h3>
                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Name</label>
                                <input
                                    type="text"
                                    defaultValue="John Doe"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    defaultValue="john.doe@example.com"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    {/*<div>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Security
                        </h3>
                        <div className="mt-3 space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">New Password</label>
                                <input
                                    type="password"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>*/}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300" onClick={handleBackButton}>
                            Go Back
                        </button>
                        <button className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
