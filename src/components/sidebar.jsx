/*
 * on smaller screens the width is 80% and acts as fixed
 */

export default function Sidebar() {
    return (
        <aside id="sidebar" class="sidebar h-screen flex-col border-r border-gray-200 md:flex">
            {/* Sidebar Header*/}
            <button id="toggle-sidebar-btn" class="logo-toggle-button">
                <h1 id="app-title" class="text-3xl font-extrabold text-gray-800 transition-opacity duration-300">WevN</h1>
                <img src="logo.png" alt="WevN Logo" class="h-8 sidebar-logo mr-2" />
            </button>

            {/* <!-- Collapsed Search Icon (only visible when collapsed) --> */}
            <button id="collapsed-search-btn" class="hidden my-4 mx-auto w-12 h-12 flex items-center justify-center text-gray-500 hover:text-blue-500 rounded-lg transition-colors duration-200 border border-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* <!-- Domain Management --> */}
            <div id="domain-management-container" class="mb-6">

                <div class="relative mb-4 mt-5">
                    <input type="text" id="domain-search" placeholder="Search domains..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <ul id="domain-list" class="space-y-2 custom-scrollbar overflow-y-auto max-h-[300px]">
                    <DomainItem domainName={"Personal Knowledge"} />
                    <DomainItem domainName={"fyndr Bot"} />
                    <DomainItem domainName={"Project A Documentation"} />
                </ul>
            </div>

            {/* only rendered if there is no domain present */}
            <div id="sidebar-placeholder" class="flex flex-col items-center justify-center text-gray-400 opacity-60">
                <p class="text-center">No existing domains found!</p>
                <button class="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium">
                    + create new ?
                </button>
            </div>

            {/* <!-- Account Icon --> */}
            <div class="flex justify-center mt-auto p-4 border-t-2 border-gray-200">
                <button class="text-blue-500 hover:text-blue-600 transition-colors duration-200 text-sm font-medium outline p-[var(--padding-card)] rounded-md">
                    + New Domain
                </button>
            </div>
        </aside>
    )
}

const DomainItem = ({ domainName }) => (
    <li class="flex items-center justify-between p-3 rounded-lg transition-colors duration-200 cursor-pointer bg-[var(--color-accent)]" data-id="1">
        <span class="text-sm font-medium text-gray-700">{domainName}</span>
        <div class="flex space-x-2">
            {/* rename icon */}
            <button class="text-gray-400 hover:text-blue-500 transition-colors duration-200 edit-domain-btn" data-id="1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
            </button>
            {/* delete icon */}
            <button class="text-gray-400 hover:text-red-500 transition-colors duration-200 delete-domain-btn" data-id="1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    </li>
)