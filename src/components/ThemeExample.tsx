import React from "react";

const ThemeExample: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-primary-800 mb-6">
        Custom Theme Colors Demo
      </h1>

      {/* Primary Color Palette */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary-700">
          Primary Color Palette
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
            <div key={shade} className="text-center">
              <div
                className={`w-16 h-16 rounded-lg mx-auto mb-2 bg-primary-${shade}`}
              ></div>
              <p className="text-sm text-black">primary-{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Example Components */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary-700">
          Example Components
        </h2>

        {/* Buttons */}
        <div className="flex gap-4">
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
            Primary Button
          </button>
          <button className="bg-primary-100 hover:bg-primary-200 text-primary-800 px-4 py-2 rounded-lg transition-colors">
            Light Button
          </button>
          <button className="border-2 border-primary-500 text-primary-500 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors">
            Outline Button
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="text-primary-800 font-semibold mb-2">Light Card</h3>
            <p className="text-primary-600">
              This card uses primary-50 background with primary-200 border.
            </p>
          </div>
          <div className="bg-primary-500 text-white rounded-lg p-4">
            <h3 className="font-semibold mb-2">Dark Card</h3>
            <p className="text-primary-100">
              This card uses primary-500 background with white text.
            </p>
          </div>
        </div>

        {/* Form Elements */}
        <div className="space-y-4">
          <div>
            <label className="block text-primary-700 font-medium mb-2">
              Input Field
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter text here..."
            />
          </div>

          <div>
            <label className="block text-primary-700 font-medium mb-2">
              Select Dropdown
            </label>
            <select className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeExample;
