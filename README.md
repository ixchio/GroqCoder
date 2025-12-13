<div align="center">
  <img src="public/groq-llama.jpg" alt="Groq Coder Llama" width="200" height="auto" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
  <h1>⚡ Groq Coder ⚡</h1>
  <h3>Your Imagination. Compiled. Instantly.</h3>

  <div align="center">
     <img src="https://img.shields.io/badge/Powered%20By-Groq%20LPU-orange?style=for-the-badge&logo=groq&logoColor=white" alt="Powered By Groq">
     <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15">
     <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
     <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
  </div>
</div>

---

## 🚀 What is Groq Coder?

**Groq Coder** is not just another AI playground—it's a production-grade acceleration engine for web development. By leveraging the **Groq LPU™ (Language Processing Unit)**, we bypass the latency bottlenecks typical of GPU-based inference. This allows us to deliver **DeepSeek R1** and **Llama 3.3** reasoning capabilities at speeds that feel instantaneous.

Imagine "thinking" in code and seeing the result before your fingers leave the keyboard. That's Groq Coder. We treat AI inference not as a batched comprehensive request, but as a real-time stream of logic, enabling developers to iterate on complex UI/UX designs at the speed of thought.

## 🔓 Why Open Source?

**Because intelligence shouldn't be gated.**

In an era where the most powerful coding assistants are locked behind $20/month paywalls, Groq Coder stands as a testament to the open ecosystem. We believe:
1.  **Access is a Right**: Every developer, regardless of location or budget, deserves access to SOTA (State of the Art) tooling.
2.  **Community > Corporation**: The best features come from a thousand different use cases, not a single product roadmap.
3.  **Transparency is Trust**: You should know exactly what prompt engineering is happening behind the curtain.

Unclench your wallet. Clone the repo. Build the future.

## 🏗️ System Architecture

Groq Coder employs a sophisticated **Edge-First Architecture** designed to minimize Time-To-First-Byte (TTFB) and maximize inference throughput. The system is decoupled into three primary layers: Use Interaction, Orchestration, and Inference.

### The "Deep Flow" Architecture

```mermaid
graph TD
    User[User / Client] -->|HTTP/2 Stream| Edge[Next.js Edge Runtime]
    
    subgraph "Orchestration Layer"
        Edge -->|Auth Guard| Session[NextAuth Session]
        Edge -->|Rate Limit| Redis[Upstash Redis]
        Edge -->|Prompt Engineering| Meta[Metadata & Context Injector]
    end
    
    subgraph "Inference Engine"
        Meta -->|JSON Schema| Groq[Groq LPU Cloud]
        Meta -->|Fallback strategy| Cerebras[Cerebras Wafer-Scale Engine]
        Groq -->|Token Stream (800 T/s)| StreamHandler[Stream Transformer]
    end
    
    subgraph "Persistence & State"
        StreamHandler -->|Async Write| Mongo[MongoDB Atlas]
        Mongo -->|Vector Embeddings| Qdrant[Qdrant Vector DB]
    end
    
    StreamHandler -->|Server-Sent Events| User
```

**Key Technical Decisions:**
*   **Next.js 15 (App Router)**: Utilizing React Server Components (RSC) to keep the client bundle minimal while handling heavy logic on the server.
*   **Groq SDK**: Direct integration with the LPU for sub-50ms latency.
*   **MongoDB**: Flexible schema design to store complex, nested project structures (HTML/CSS/JS JSON blobs).
*   **Tailwind CSS + Shadcn Elements**: For a "Vercel-like" premium aesthetic that is fully accessible and responsive.

## 💼 For Recruiters

If you are reading this, you are likely looking for an engineer who doesn't just "use" libraries but understands the systems behind them. Here is what Groq Coder demonstrates about my engineering capability:

*   **Full-Stack Mastery**: From database schema design (MongoDB) to frontend state management (Zustand/Context), I own the entire stack.
*   **Performance Obsession**: I specifically chose Groq because I understand the business value of low-latency applications. Every millisecond counts.
*   **AI Integration**: I know how to handle LLM context windows, stream responses, and gracefully handle hallucinations or API failures.
*   **Product Sense**: This isn't just code; it's a product. The onboarding tour, the gallery, and the social "sharing" features show I care about user acquisition and retention.

**I built this to prove that high-performance, complex AI applications can be built by a single determined engineer.**

## 🛠️ Quick Start

Want to spin this up yourself?

### 1. Clone & Install
```bash
git clone https://github.com/ixchio/GroqCoder.git
cd GroqCoder
npm install
```

### 2. Configure Environment
Rename `.env.example` to `.env.local` and add your keys:
```bash
MONGODB_URI=...
GROQ_API_KEY=...
GITHUB_CLIENT_ID=...
```

### 3. Ignition
```bash
npm run dev
```

---

<div align="center">
  <b>Built with ❤️ by a 10x Engineer</b>
</div>