interface SkeletonLoaderProps {
  theme: 'light' | 'dark';
}

export default function SkeletonLoader({ theme }: SkeletonLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative z-10">
      {/* Skeleton sidebar — desktop only */}
      <div className={`hidden lg:flex w-60 flex-col p-4 border-r animate-pulse ${
        theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white/60 border-slate-200/50'
      }`}>
        <div className={`w-28 h-7 rounded-lg mb-8 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'}`} />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`h-8 rounded-lg mb-2 ${
            i === 0 
              ? (theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-100') 
              : (theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100')
          }`} />
        ))}
        <div className="mt-auto space-y-2">
          <div className={`w-full h-10 rounded-xl ${theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'}`} />
          <div className={`w-full h-8 rounded-lg ${theme === 'dark' ? 'bg-slate-700/20' : 'bg-slate-50'}`} />
        </div>
      </div>
      {/* Skeleton main content */}
      <div className="flex-1 p-6 lg:p-8">
        {/* Skeleton header bar */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`lg:hidden w-28 h-7 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'}`} />
          <div className="flex-1" />
          <div className={`w-20 h-8 rounded-lg ${theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-200'}`} />
          <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-200'}`} />
          <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-slate-700/40' : 'bg-slate-200'}`} />
        </div>
        {/* Skeleton cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`p-5 rounded-2xl border animate-pulse ${
              theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/60 border-slate-200/50'
            }`}>
              <div className={`w-16 h-3 rounded mb-3 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'}`} />
              <div className={`w-24 h-6 rounded mb-1 ${theme === 'dark' ? 'bg-slate-600/50' : 'bg-slate-300'}`} />
              <div className={`w-12 h-3 rounded ${theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'}`} />
            </div>
          ))}
        </div>
        {/* Skeleton content block */}
        <div className={`rounded-2xl border p-6 animate-pulse h-64 ${
          theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white/40 border-slate-200/50'
        }`}>
          <div className={`w-40 h-5 rounded mb-4 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-200'}`} />
          <div className="space-y-2">
            <div className={`w-full h-4 rounded ${theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-100'}`} />
            <div className={`w-5/6 h-4 rounded ${theme === 'dark' ? 'bg-slate-700/20' : 'bg-slate-50'}`} />
            <div className={`w-4/6 h-4 rounded ${theme === 'dark' ? 'bg-slate-700/20' : 'bg-slate-50'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
