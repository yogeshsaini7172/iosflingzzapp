import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>

      {/* Example Match Insights */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold text-gray-700 mb-2">Match Insights</h3>
        <p className="text-sm text-gray-500">You have 12 new likes today 🎉</p>
      </div>

      {/* Example Activity */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold text-gray-700 mb-2">Recent Activity</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>Emma viewed your profile</li>
          <li>David sent you a like</li>
          <li>Anna matched with you</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
