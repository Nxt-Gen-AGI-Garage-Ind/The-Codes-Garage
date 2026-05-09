import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111827] to-[#1f2937] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 text-[#f97316]">
            🛠️ THE CODE GARAGE
          </h1>
          <p className="text-xl mb-8">
            "Where broken code comes for a complete overhaul."
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {/* THE OVERHAUL */}
            <div className="bg-[#1f2937] border-2 border-[#f97316] p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">🚀 THE OVERHAUL</h2>
              <p>Deep structural repairs for broken logic and syntax errors. (Fixer Mode)</p>
            </div>
            
            {/* THE TUNING */}
            <div className="bg-[#1f2937] border-2 border-[#f97316] p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">🔧 THE TUNING</h2>
              <p>Optimization for performance, readability, and modern standards. (Refiner Mode)</p>
            </div>
            
            {/* THE SCAN */}
            <div className="bg-[#1f2937] border-2 border-[#f97316] p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">🔍 THE SCAN</h2>
              <p>Logical trace-through to identify edge-case bugs. (Debugger Mode)</p>
            </div>
          </div>

          <div className="mt-12">
            <button className="bg-[#f97316] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#ea580c] transition-colors">
              🔧 Start Diagnosis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App