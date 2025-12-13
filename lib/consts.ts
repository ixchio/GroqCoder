export const defaultHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Groq Coder - AI-Powered Web Builder</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      * { font-family: 'Inter', sans-serif; }
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }
      @keyframes blink {
        50% { border-color: transparent; }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-float-delay { animation: float 6s ease-in-out infinite 2s; }
      .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
      .gradient-text {
        background: linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4);
        background-size: 200% 200%;
        animation: gradient-shift 3s ease infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .glass {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    </style>
  </head>
  <body class="min-h-screen bg-black text-white flex items-center justify-center overflow-hidden relative">
    <!-- Animated background orbs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-glow"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 2s;"></div>
    </div>
    
    <!-- Floating elements -->
    <div class="absolute top-20 right-20 text-6xl animate-float opacity-20">⚡</div>
    <div class="absolute bottom-32 left-16 text-5xl animate-float-delay opacity-20">🚀</div>
    <div class="absolute top-40 left-1/4 text-4xl animate-float opacity-15" style="animation-delay: 1s;">✨</div>
    
    <!-- Main content -->
    <div class="relative z-10 text-center px-6 max-w-4xl mx-auto">
      <!-- Logo badge -->
      <div class="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
        <div class="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse"></div>
        <span class="text-sm font-medium text-gray-300">Groq Coder</span>
        <span class="text-xs px-2 py-0.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full text-pink-400 border border-pink-500/20">AI Ready</span>
      </div>
      
      <!-- Main heading -->
      <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
        <span class="text-gray-400 text-2xl md:text-3xl block mb-2 font-medium">Welcome to</span>
        <span class="gradient-text">Groq Coder</span>
      </h1>
      
      <!-- Subtitle -->
      <p class="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
        Build stunning websites with the power of <span class="text-white font-semibold">AI</span>. 
        Just describe what you want, and watch the magic happen.
      </p>
      
      <!-- Feature cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div class="glass rounded-2xl p-6 text-left hover:border-pink-500/30 transition-all duration-300">
          <div class="text-3xl mb-3">⚡</div>
          <h3 class="font-semibold text-white mb-1">Lightning Fast</h3>
          <p class="text-sm text-gray-400">Powered by Groq's LPU for instant code generation</p>
        </div>
        <div class="glass rounded-2xl p-6 text-left hover:border-purple-500/30 transition-all duration-300">
          <div class="text-3xl mb-3">🎨</div>
          <h3 class="font-semibold text-white mb-1">Beautiful Design</h3>
          <p class="text-sm text-gray-400">Modern, responsive layouts out of the box</p>
        </div>
        <div class="glass rounded-2xl p-6 text-left hover:border-cyan-500/30 transition-all duration-300">
          <div class="text-3xl mb-3">🚀</div>
          <h3 class="font-semibold text-white mb-1">Ship Faster</h3>
          <p class="text-sm text-gray-400">From idea to production in minutes</p>
        </div>
      </div>
      
      <!-- Call to action hint -->
      <div class="flex items-center justify-center gap-3 text-gray-500">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/20">
          <span class="text-sm">💬</span>
        </div>
        <p class="text-sm">Start typing in the chat below to create something amazing</p>
        <svg class="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
    
    <!-- Bottom gradient line -->
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
  </body>
</html>
`;
