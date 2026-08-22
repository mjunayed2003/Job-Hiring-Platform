import Image from "next/image";

const DeleteInstructions = () => {
  return (
    <div className="flex flex-col justify-between min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="space-y-6">

        {/* Header */}
        <div className="p-4 flex justify-between items-center bg-white shadow-sm border-b">
          <h1 className="text-xl font-semibold text-gray-800">
            How to delete your account?
          </h1>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

            {/* Warning Banner */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 p-6 mb-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-800">Important Notice</h3>
                  <p className="text-red-700 mt-1">
                    Account deletion is permanent and cannot be undone. All your data will be permanently removed.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions Container */}
            <div className="p-8 space-y-10">

              {/* Step 1 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Log in to your account</h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Use your registered email and password to access your account dashboard.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Go to Settings</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    Click on your profile icon at the top-right corner of the screen,
                    then select{" "}
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-semibold">
                      Settings
                    </span>{" "}
                    from the dropdown menu.
                  </p>
                  <div className="relative group w-[220px]">
                    <Image
                      src="/image/del-1.png"
                      alt="Profile dropdown showing Settings option"
                      width={220}
                      height={200}
                      className="rounded-xl border-2 border-gray-200 shadow-lg transition-transform group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Click on Delete Account</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    In the Settings page, scroll down and tap on the{" "}
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md font-semibold">
                      Delete Account
                    </span>{" "}
                    option at the bottom of the list.
                  </p>
                  <div className="relative group w-[400px]">
                    <Image
                      src="/image/del-2.png"
                      alt="Settings page with Delete Account option"
                      width={400}
                      height={300}
                      className="rounded-xl border-2 border-gray-200 shadow-lg transition-transform group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Confirm the deletion</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    A confirmation popup will appear. Press the{" "}
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md font-semibold">
                      Delete
                    </span>{" "}
                    button to permanently remove your account and all associated data.
                  </p>
                  <div className="relative group w-[280px]">
                    <Image
                      src="/image/del-3.png"
                      alt="Delete Account confirmation popup"
                      width={280}
                      height={220}
                      className="w-full rounded-xl border-2 border-gray-200 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"
                    />
                  </div>
                </div>
              </div>

              {/* Final Warning */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-center text-white shadow-xl">
                <div className="flex justify-center mb-4">
                  <svg className="h-12 w-12 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">⚠️ Final Reminder</h3>
                <p className="text-lg text-red-100 leading-relaxed">
                  Once you confirm deletion, your account and all associated data will be permanently
                  removed from our servers. This action cannot be reversed or undone.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteInstructions;