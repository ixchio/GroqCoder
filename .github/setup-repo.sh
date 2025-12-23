#!/bin/bash

# ================================
# GitHub Labels and Issues Setup Script
# ================================
# Run this script to create all labels and issues on your GitHub repo
# Prerequisites: gh CLI installed and authenticated

REPO="ixchio/GroqCoder"

echo "⚡ Setting up Groq Coder GitHub Repository"
echo "==========================================="
echo ""

# --------------------------------
# Step 1: Create Labels
# --------------------------------
echo "🏷️  Creating labels..."

# Type labels
gh label create "bug" --description "Something isn't working" --color "d73a4a" --repo "$REPO" --force
gh label create "enhancement" --description "New feature or request" --color "a2eeef" --repo "$REPO" --force
gh label create "documentation" --description "Improvements or additions to documentation" --color "0075ca" --repo "$REPO" --force
gh label create "question" --description "Further information is requested" --color "d876e3" --repo "$REPO" --force

# Priority labels
gh label create "priority: critical" --description "Critical priority - needs immediate attention" --color "b60205" --repo "$REPO" --force
gh label create "priority: high" --description "High priority" --color "d93f0b" --repo "$REPO" --force
gh label create "priority: medium" --description "Medium priority" --color "fbca04" --repo "$REPO" --force
gh label create "priority: low" --description "Low priority" --color "0e8a16" --repo "$REPO" --force

# Status labels
gh label create "needs triage" --description "Needs to be triaged by maintainers" --color "ededed" --repo "$REPO" --force
gh label create "blocked" --description "Blocked by something else" --color "b60205" --repo "$REPO" --force
gh label create "stale" --description "No recent activity" --color "fef2c0" --repo "$REPO" --force
gh label create "wontfix" --description "This will not be worked on" --color "ffffff" --repo "$REPO" --force
gh label create "duplicate" --description "This issue or pull request already exists" --color "cfd3d7" --repo "$REPO" --force

# Area labels
gh label create "area/core" --description "Core application logic" --color "5319e7" --repo "$REPO" --force
gh label create "area/ui" --description "User interface components" --color "1d76db" --repo "$REPO" --force
gh label create "area/api" --description "API and backend" --color "006b75" --repo "$REPO" --force
gh label create "area/p2p" --description "Peer-to-peer and WebRTC" --color "00d4aa" --repo "$REPO" --force
gh label create "area/config" --description "Configuration and setup" --color "bfdadc" --repo "$REPO" --force
gh label create "area/auth" --description "Authentication and authorization" --color "c5def5" --repo "$REPO" --force

# Contribution labels
gh label create "good first issue" --description "Good for newcomers" --color "7057ff" --repo "$REPO" --force
gh label create "help wanted" --description "Extra attention is needed" --color "008672" --repo "$REPO" --force
gh label create "hacktoberfest" --description "Hacktoberfest eligible" --color "ff6b00" --repo "$REPO" --force

# Complexity labels
gh label create "complex" --description "Complex implementation required" --color "e11d48" --repo "$REPO" --force
gh label create "architecture" --description "System architecture changes" --color "7c3aed" --repo "$REPO" --force

# Size labels
gh label create "size/XS" --description "Extra small PR (< 10 lines)" --color "00ff00" --repo "$REPO" --force
gh label create "size/S" --description "Small PR (10-50 lines)" --color "77ff00" --repo "$REPO" --force
gh label create "size/M" --description "Medium PR (50-200 lines)" --color "ffff00" --repo "$REPO" --force
gh label create "size/L" --description "Large PR (200-500 lines)" --color "ff9900" --repo "$REPO" --force
gh label create "size/XL" --description "Extra large PR (> 500 lines)" --color "ff0000" --repo "$REPO" --force

# Release labels
gh label create "breaking change" --description "This change breaks backward compatibility" --color "b60205" --repo "$REPO" --force
gh label create "security" --description "Security related" --color "ee0701" --repo "$REPO" --force

# CI/Testing labels
gh label create "ci/cd" --description "CI/CD and automation" --color "0366d6" --repo "$REPO" --force
gh label create "tests" --description "Test improvements" --color "bfe5bf" --repo "$REPO" --force
gh label create "dependencies" --description "Dependency updates" --color "0366d6" --repo "$REPO" --force

# Feature specific
gh label create "ai/models" --description "AI model integration" --color "ff6b00" --repo "$REPO" --force
gh label create "ai/streaming" --description "AI response streaming" --color "ff9500" --repo "$REPO" --force
gh label create "performance" --description "Performance improvements" --color "ffc107" --repo "$REPO" --force

echo ""
echo "✅ Labels created!"
echo ""

# --------------------------------
# Step 2: Create Issues
# --------------------------------
echo "📝 Creating issues..."

# Simple Issue - JSDoc Documentation
gh issue create --repo "$REPO" \
  --title "[Docs]: Add JSDoc comments to lib/providers.ts for better DX" \
  --label "good first issue,documentation,help wanted,hacktoberfest" \
  --body "## 📚 Documentation Enhancement

### Problem
The \`lib/providers.ts\` file contains important configuration for AI providers and models, but lacks JSDoc documentation. This makes it harder for new contributors to understand the codebase.

### Proposed Solution
Add comprehensive JSDoc comments to:

1. **Type definitions:**
   - \`ProviderType\` - explain what providers are supported
   - \`Provider\` interface - document each field
   - \`AIModel\` interface - document each field including optional flags

2. **Constants:**
   - \`FREE_PROVIDERS\` - explain the provider configuration
   - \`FREE_MODELS\` - document the model selection rationale

3. **Helper functions:**
   - \`getProviderById()\`
   - \`getModelById()\`
   - \`getModelsByProvider()\`
   - \`getFreeModels()\`
   - \`isProviderFree()\`

### Acceptance Criteria
- [ ] All exported types have JSDoc comments
- [ ] All exported functions have JSDoc comments with @param and @return
- [ ] Examples are provided where helpful
- [ ] Comments follow TypeScript best practices

---

**Estimated time:** 30-45 minutes
**Difficulty:** Easy ⭐
**Perfect for first-time contributors!**"

echo ""

# Hard Issue - P2P Connection Manager
gh issue create --repo "$REPO" \
  --title "[Feature]: Implement WebRTC P2P Connection Manager with Reconnection Logic" \
  --label "enhancement,priority: high,area/p2p,complex,architecture" \
  --body "## 🔗 P2P Connection Manager Implementation

### Overview
Implement a robust WebRTC-based peer-to-peer connection manager that handles real-time code collaboration between users. This is a **core architectural component** that enables decentralized collaboration without central servers.

### Background
The P2P architecture is documented in the README but not yet fully implemented. We need a production-ready connection manager that handles:
- ICE candidate negotiation
- STUN/TURN server communication
- Connection state management
- Automatic reconnection with exponential backoff
- Graceful degradation

### Technical Requirements

#### Data Channels (as per README spec)
| Channel | Purpose | Priority |
|---------|---------|----------|
| \`code-sync\` | Real-time code delta sync | Critical |
| \`cursor-pos\` | Cursor position broadcast | High |
| \`ai-stream\` | AI response streaming | Critical |
| \`presence\` | User presence/status | Normal |
| \`files\` | Large file transfer | Low |

### Implementation Phases

#### Phase 1: Core Manager
- [ ] Create \`lib/p2p/connection-manager.ts\`
- [ ] Implement RTCPeerConnection wrapper
- [ ] Add ICE candidate handling

#### Phase 2: Data Channels
- [ ] Implement data channel factory
- [ ] Create channel-specific message protocols

#### Phase 3: Reconnection
- [ ] Implement exponential backoff
- [ ] Add connection state machine
- [ ] Implement TURN fallback logic

#### Phase 4: React Integration
- [ ] Create \`useP2PConnection\` hook
- [ ] Add connection status indicator UI

### Acceptance Criteria
- [ ] Two peers can establish a WebRTC connection
- [ ] All 5 data channels are properly initialized
- [ ] Connection automatically reconnects on failure
- [ ] Unit test coverage > 80%

---

**Estimated time:** 10-15 hours
**Difficulty:** Hard ⭐⭐⭐⭐
**Prerequisites:** WebRTC experience, TypeScript, React hooks"

echo ""
echo "✅ Issues created!"
echo ""
echo "==========================================="
echo "🎉 Setup complete!"
echo ""
echo "Your repo now has:"
echo "  - 40+ carefully categorized labels"
echo "  - 1 simple 'good first issue' for newcomers"
echo "  - 1 complex issue for experienced contributors"
echo ""
echo "Next steps:"
echo "  1. Push the .github folder to your repo"
echo "  2. Run this script: bash .github/setup-repo.sh"
echo "  3. Watch your repo look professional! 🚀"
