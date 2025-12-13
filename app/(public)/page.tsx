"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, Sparkles, Network, Database, Server, Terminal } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Cursor } from "@/components/ui/cursor";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session } = useSession();

  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Parallax Tilt
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const rotationX = (y / rect.height) * -20;
    const rotationY = (x / rect.width) * 20;

    setRotateX(rotationX);
    setRotateY(rotationY);
  };
  
  const handleMouseLeave = () => {
     setRotateX(0);
     setRotateY(0);
  };

  useEffect(() => {
    // Starfield Animation
    if (canvasRef.current) {
       const canvas = canvasRef.current;
       const ctx = canvas.getContext('2d');
       if (!ctx) return;
       
       const stars: {x: number, y: number, z: number, px: number, py: number}[] = [];
       const numStars = 800;
       
       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
       
       const centerX = canvas.width / 2;
       const centerY = canvas.height / 2;
       
       for(let i=0; i<numStars; i++) {
          stars.push({
             x: (Math.random() - 0.5) * canvas.width,
             y: (Math.random() - 0.5) * canvas.height,
             z: Math.random() * canvas.width,
             px: 0, 
             py: 0
          });
       }
       
       const animateStars = () => {
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          for(let i=0; i<numStars; i++) {
             const star = stars[i];
             star.z -= 2; // Warp speed
             
             if(star.z <= 0) {
                star.x = (Math.random() - 0.5) * canvas.width;
                star.y = (Math.random() - 0.5) * canvas.height;
                star.z = canvas.width;
                star.px = 0;
                star.py = 0;
             }
             
             const x = (star.x / star.z) * canvas.width + centerX;
             const y = (star.y / star.z) * canvas.height + centerY;
             
             if (x > 0 && x < canvas.width && y > 0 && y < canvas.height && star.px !== 0) {
                 ctx.beginPath();
                 ctx.lineWidth = (1 - star.z / canvas.width) * 2;
                 ctx.strokeStyle = `rgba(255, 255, 255, ${1 - star.z/canvas.width})`;
                 ctx.moveTo(star.px, star.py);
                 ctx.lineTo(x, y);
                 ctx.stroke();
             }
             
             star.px = x;
             star.py = y;
          }
          requestAnimationFrame(animateStars);
       };
       animateStars();
       
       const handleResize = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
       };
       window.addEventListener('resize', handleResize);
       return () => window.removeEventListener('resize', handleResize);
    }

  }, []);

  return (
    <div className="text-white overflow-hidden bg-[#030303] min-h-screen selection:bg-purple-500/30">
      <Cursor />
      
      {/* Animated Starfield Background */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-0 opacity-40 pointer-events-none"
      />

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-3 group cursor-pointer">
             <div className="relative w-10 h-10 transition-transform duration-500 group-hover:rotate-180">
                <Image src="/groq-coder-icon.jpg" alt="Groq Logo" fill className="object-contain" />
             </div>
             <span className="font-bold text-xl tracking-tighter group-hover:text-purple-400 transition-colors">GroqCoder</span>
           </Link>
           
           <div className="flex items-center gap-4">
              <Link 
                href="https://github.com/amankumarpandeyin/groq-coder" 
                target="_blank"
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                GitHub
              </Link>
              <Link
                href={session ? "/projects/new" : "/auth/register"}
                className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-gray-200 transition-all hover:scale-110"
               >
                {session ? "Dashboard" : "Get Started"}
               </Link>
           </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden perspective-1000 z-10">
        <div className="relative max-w-6xl mx-auto text-center perspective-1000">
           
           {/* Badge */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="inline-flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm"
           >
             <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </span>
             <span className="text-sm text-white/70 font-mono">Groq LPU™ + KatCoder + DeepSeek R1</span>
           </motion.div>

           {/* Main Headline */}
           <motion.h1 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.8, ease: "circOut" }}
             className="text-5xl sm:text-7xl lg:text-9xl font-bold tracking-tighter mb-8 leading-[0.9]"
           >
             Your Imagination. <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 animate-pulse">
               Compiled.
             </span>
           </motion.h1>

           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.4, duration: 1 }}
             className="text-lg sm:text-2xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
           >
             Production-ready AI code generation to Website UI. <br className="hidden sm:block"/>
             Powering the next generation of engineers with <span className="text-white">instant inference</span>.
           </motion.p>

           {/* CTAs */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.6 }}
             className="flex flex-col items-center justify-center gap-6"
           >
              <div className="flex flex-col sm:flex-row items-center gap-4">
               <Link
                 href={session ? "/projects/new" : "/auth/register"}
                 className="group relative px-10 py-5 bg-white text-black font-bold text-lg rounded-full overflow-hidden transition-all hover:scale-110 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.6)]"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                 <span className="relative z-10 flex items-center gap-2">
                   Start Building
                   <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </span>
               </Link>
              </div>

              {/* Framework Build Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-100" />
                  </div>
                  <span className="text-xs font-medium text-white/60">React & Next.js Support Coming Soon</span>
              </div>
           </motion.div>
           
           {/* Interactive Visual with Framer Motion + 3D Tilt */}
           <motion.div 
             initial={{ opacity: 0, rotateX: 20, z: -200 }}
             animate={{ opacity: 1, rotateX: 0, z: 0 }}
             transition={{ duration: 1, delay: 0.8, type: "spring" }}
             className="relative mt-24"
             onMouseMove={handleMouseMove}
             onMouseLeave={handleMouseLeave}
             style={{ perspective: 1000 }}
           >
             <motion.div
               ref={heroRef}
               className="mx-auto w-full max-w-5xl aspect-[16/9] bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden group cursor-none"
               animate={{ rotateX, rotateY }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               style={{ transformStyle: 'preserve-3d' }}
             >
                {/* Glare Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20" />
                
                {/* Terminal Header */}
                <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-[#050505] z-10">
                   <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/20" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                      <div className="w-3 h-3 rounded-full bg-green-500/20" />
                   </div>
                   <div className="ml-4 font-mono text-xs text-white/30">groq-coder — -zsh — 80x24</div>
                </div>
                
                {/* Content */}
                <div className="relative h-full pt-12 px-6 pb-6 flex">
                    <div className="flex-1 font-mono text-sm text-left opacity-90 leading-relaxed overflow-hidden">
                       <div className="typewriter-text text-green-400 mb-2">{"> initializing groq_lpu_inference_engine..."}</div>
                       <div className="typewriter-text text-blue-400 mb-2 delay-100">{"> loading model: deepseek-r1-distill-llama-70b..."}</div>
                       <motion.div 
                          className="mt-8 p-4 border border-white/10 rounded-lg bg-white/5 font-sans"
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                       >
                          <div className="flex items-center gap-3 mb-3">
                             <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                <Image src="/groq-mascot.jpg" alt="AI Agent" width={32} height={32} className="object-cover" />
                             </div>
                             <span className="text-sm font-bold text-white">Groq Agent</span>
                             <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Online</span>
                          </div>
                          <p className="text-white/70">
                             I&apos;ve analyzed your project requirements. Deploying a scalable RAG architecture with Qdrant and Next.js 15.
                             Ready to compile?
                          </p>
                       </motion.div>
                    </div>
                </div>
             </motion.div>
           </motion.div>
        </div>
      </section>

      {/* AI Mascots Section */}
      <section className="py-20 px-6 relative overflow-hidden z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Meet Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">AI Squad</span>
            </h2>
            <p className="text-white/50">Powered by next-gen intelligence, styled with anime magic ✨</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Rukia - Ice Queen */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-cyan-400/50 group-hover:border-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
                  <Image src="/anime-rukia.png" alt="Rukia AI" fill className="object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-[#030303]">
                  <span className="text-xs">❄️</span>
                </div>
              </motion.div>
              <div className="text-center mt-4">
                <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">Rukia</h3>
                <p className="text-xs text-white/40">Code Freezer</p>
                <p className="text-[10px] text-cyan-400/60 font-mono mt-1">Debugger Agent</p>
              </div>
            </motion.div>

            {/* Nemu - Dark Scientist */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                className="relative"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-purple-400/50 group-hover:border-purple-400 transition-colors shadow-lg shadow-purple-500/20">
                  <Image src="/anime-nemu.png" alt="Nemu AI" fill className="object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-2 border-[#030303]">
                  <span className="text-xs">🔬</span>
                </div>
              </motion.div>
              <div className="text-center mt-4">
                <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">Nemu</h3>
                <p className="text-xs text-white/40">Lab Architect</p>
                <p className="text-[10px] text-purple-400/60 font-mono mt-1">Research Agent</p>
              </div>
            </motion.div>

            {/* Orihime - Healer */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut", delay: 1 }}
                className="relative"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/30 to-yellow-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-orange-400/50 group-hover:border-orange-400 transition-colors shadow-lg shadow-orange-500/20">
                  <Image src="/anime-orihime.png" alt="Orihime AI" fill className="object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-[#030303]">
                  <span className="text-xs">✨</span>
                </div>
              </motion.div>
              <div className="text-center mt-4">
                <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors">Orihime</h3>
                <p className="text-xs text-white/40">Bug Healer</p>
                <p className="text-[10px] text-orange-400/60 font-mono mt-1">Refactor Agent</p>
              </div>
            </motion.div>

            {/* Makima - Control */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1.5 }}
                className="relative"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-red-500/30 to-rose-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-red-400/50 group-hover:border-red-400 transition-colors shadow-lg shadow-red-500/20">
                  <Image src="/anime-makima.png" alt="Makima AI" fill className="object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#030303]">
                  <span className="text-xs">🎯</span>
                </div>
              </motion.div>
              <div className="text-center mt-4">
                <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">Makima</h3>
                <p className="text-xs text-white/40">Flow Controller</p>
                <p className="text-[10px] text-red-400/60 font-mono mt-1">Orchestrator</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Models Ticker (Infinite Scroll) */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02] overflow-hidden">
         <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm text-white/30 uppercase tracking-widest mb-8">Powering Next-Gen Intelligence</p>
            <motion.div 
               className="flex gap-16"
               animate={{ x: [0, -1000] }}
               transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            >
               {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-16 shrink-0">
                     {["KatCoder", "DeepSeek R1", "GLM-4", "Llama 3", "Mixtral 8x7B", "Gemma 2"].map((model) => (
                        <div key={model} className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                           <Bot className="w-6 h-6 text-white" />
                           <span className="font-bold text-2xl text-white tracking-tighter">{model}</span>
                        </div>
                     ))}
                  </div>
               ))}
            </motion.div>
         </div>
      </section>

      {/* Creator Section */}
      <section className="py-32 px-6 relative overflow-hidden z-10">
         <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               {/* Image Side */}
               <motion.div 
                 className="relative group perspective-1000"
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
               >
                  <div className="absolute -inset-4 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
                  <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl transform transition-transform duration-700 group-hover:scale-[1.02] group-hover:rotate-1">
                     <Image 
                        src="/profile.jpg" 
                        alt="Aman Pandey"
                        fill
                        className="object-cover"
                     />
                     
                     {/* Overlay Stats */}
                     <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-4">
                        <motion.div 
                          className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10"
                          whileHover={{ scale: 1.05 }}
                        >
                           <div className="text-2xl font-bold text-white mb-1">1668</div>
                           <div className="text-xs text-white/50 uppercase tracking-wider">Codeforces Expert</div>
                        </motion.div>
                        <motion.div 
                           className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10"
                           whileHover={{ scale: 1.05 }}
                        >
                           <div className="text-2xl font-bold text-white mb-1">Top 10</div>
                           <div className="text-xs text-white/50 uppercase tracking-wider">International Rank</div>
                        </motion.div>
                     </div>
                  </div>
               </motion.div>

               {/* Bio Side */}
               <motion.div
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
               >
                  <div className="inline-flex items-center gap-2 border border-purple-500/30 bg-purple-500/10 text-purple-400 px-4 py-1 rounded-full text-xs font-medium uppercase tracking-wider mb-6 hover:bg-purple-500/20 transition-colors cursor-default">
                     <Sparkles className="w-3 h-3" />
                     The Architect
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                     Built from <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        Obsession.
                     </span>
                  </h2>
                  <div className="space-y-6 text-lg text-white/60 leading-relaxed font-light">
                     <p>
                        I don&apos;t just stitch features; I engineer intelligence. 
                        Building scalable, <span className="text-white font-medium">full-stack AI systems</span> that solve real problems.
                     </p>
                     <p>
                        From contributing to <span className="text-white border-b border-white/20">LangChain</span> & <span className="text-white border-b border-white/20">Astro</span> to ranking as a Codeforces Expert, 
                        I bridge the gap between algorithmic rigor and shipping products that matter.
                     </p>
                  </div>

                  <div className="mt-12 space-y-4">
                     <p className="text-sm text-white/30 uppercase tracking-widest">Mastering The Stack</p>
                     <div className="flex flex-wrap gap-2">
                        {["Python", "TypeScript", "Next.js", "LangChain", "RAG", "Docker", "FastAPI", "Vector Search"].map((skill, i) => (
                           <motion.span 
                              key={skill} 
                              className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors cursor-default"
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                           >
                              {skill}
                           </motion.span>
                        ))}
                     </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-bold text-white">Aman (Kumar) Pandey</h3>
                        <p className="text-sm text-white/40">AI Engineer (LLMs & Agents)</p>
                     </div>
                     <Link 
                        href="https://www.linkedin.com/in/amanxxpandey/" 
                        target="_blank"
                        className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg shadow-white/20"
                     >
                        <Network className="w-5 h-5" />
                     </Link>
                  </div>
               </motion.div>
            </div>
         </div>
      </section>

      {/* Engineering Excellence (Animated Widgets) */}
      <section className="py-32 px-6 bg-white/[0.02] relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
             className="text-center mb-20"
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Engineering Excellence</h2>
            <p className="text-white/50">Designed for those who demand performance.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
             {/* 1. Orchestration Widget */}
             <motion.div 
               className="p-8 rounded-3xl bg-[#080808] border border-white/5 hover:border-purple-500/30 transition-all group overflow-hidden"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               whileHover={{ y: -5 }}
             >
                <div className="h-40 mb-6 bg-white/5 rounded-2xl flex items-center justify-center relative">
                    {/* Animated Nodes */}
                    <motion.div 
                       className="absolute w-3 h-3 bg-purple-500 rounded-full z-10"
                       animate={{ scale: [1, 1.5, 1] }}
                       transition={{ repeat: Infinity, duration: 2 }}
                    />
                    {[0, 120, 240].map((angle, i) => (
                       <motion.div 
                          key={i}
                          className="absolute w-2 h-2 bg-purple-400/50 rounded-full"
                          animate={{ 
                             x: [0, Math.cos(angle * Math.PI / 180) * 40],
                             y: [0, Math.sin(angle * Math.PI / 180) * 40],
                             opacity: [0, 1, 0]
                          }}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                       />
                    ))}
                    <div className="absolute inset-0 border border-white/5 rounded-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                   <Network className="w-5 h-5 text-purple-400" /> Orchestration
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                   LangGraph multi-agent systems. Autonomous coordination for complex problem solving with cyclic graphs.
                </p>
             </motion.div>

             {/* 2. RAG Widget */}
             <motion.div 
               className="p-8 rounded-3xl bg-[#080808] border border-white/5 hover:border-blue-500/30 transition-all group overflow-hidden"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               whileHover={{ y: -5 }}
             >
                <div className="h-40 mb-6 bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    {/* Data Rows */}
                    <div className="space-y-2 w-3/4">
                       <div className="h-2 bg-white/10 rounded w-full" />
                       <div className="h-2 bg-white/10 rounded w-2/3" />
                       <div className="h-2 bg-white/10 rounded w-5/6" />
                       <div className="h-2 bg-white/10 rounded w-full" />
                    </div>
                    {/* Scanning Beam */}
                    <motion.div 
                       className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
                       animate={{ left: ["-20%", "120%"] }}
                       transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                </div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                   <Database className="w-5 h-5 text-blue-400" /> RAG Architecture
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                   High-performance vector retrieval with Qdrant. Dynamic knowledge injection at 50ms latency.
                </p>
             </motion.div>

             {/* 3. Scale Widget */}
             <motion.div 
               className="p-8 rounded-3xl bg-[#080808] border border-white/5 hover:border-green-500/30 transition-all group overflow-hidden"
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.4 }}
               whileHover={{ y: -5 }}
             >
                <div className="h-40 mb-6 bg-white/5 rounded-2xl flex items-center justify-center relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                        <motion.div 
                           className="absolute inset-0 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                           animate={{ rotate: 360 }}
                           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                        <div className="text-center">
                           <div className="text-2xl font-bold text-white">99</div>
                           <div className="text-[10px] text-white/50">SCORE</div>
                        </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 text-xs font-mono">
                       <span className="flex items-center gap-1 text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/> 12ms</span>
                       <span className="text-white/30">LATENCY</span>
                    </div>
                </div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                   <Server className="w-5 h-5 text-green-400" /> Production Scale
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                   Dockerized containers on Edge. Built for speed with Next.js 15 Partial Prerendering.
                </p>
             </motion.div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center relative z-10 bg-[#030303]">
         <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
            <Terminal className="w-4 h-4" />
            <span className="font-mono text-sm">git checkout future</span>
         </div>
         <p className="text-white/30 text-sm">
            © 2024 GroqCoder. Architected by Aman Pandey.
         </p>
      </footer>
    </div>
  );
}
