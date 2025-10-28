export default function AccountView({ state, setState, user, onLogout }) {

    const handleBackButton = () => {
        setState(prev => ({
            ...prev,
            currentView: 'query',
            selectedDomainId: null
        }));
    };

    // Construct proxied avatar URL
    const avatarUrl = user?.picture
        ? `https://images.weserv.nl/?url=${encodeURIComponent(user.picture)}&w=100&h=100&fit=cover&mask=circle`
        : "https://api.dicebear.com/7.x/avataaars/svg?seed=user";

    return (
        <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-md border border-gray-200 p-8 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={avatarUrl}
                            alt="User avatar"
                            className="w-16 h-16 rounded-full object-cover border border-gray-200"
                            onError={(e) => { e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=user"; }}
                        />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{user?.name || "John Doe"}</h2>
                            <p className="text-sm text-gray-500">{user?.email || "john.doe@example.com"}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (onLogout) onLogout();
                            localStorage.removeItem("accessToken");
                            localStorage.removeItem("userProfile");
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>

                {/* Account Settings */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Profile</h3>
                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.name || "John Doe"}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    defaultValue={user?.email || "john.doe@example.com"}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300"
                            onClick={handleBackButton}
                        >
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
