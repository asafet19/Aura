Project Evaluation & AI Usage: Aura
AI / Cursor Usage
1. Prompts Used
"Create a Next.js API route that allows anonymous interest submission to Supabase while keeping the database secure."

Why: To fulfill the requirement for a public endpoint while maintaining professional-grade security.

"Write logic to group interests by name and display unique emails of users sharing them, excluding the current user."

Why: This required precise data transformation using reduce and Set to ensure the "Community Matches" UI was clean, logical, and accurate.

2. Iteration & Problem Solving
The Security Pivot: Initially, RLS was disabled for rapid prototyping. I later re-enabled RLS and implemented the service_role key strictly within the backend API. This ensures the frontend remains locked down while the backend handles data insertion safely.

Environment Stability: When the local development environment faced memory/RAM loops, I adjusted by breaking large logic blocks into smaller, modular components and clearing build caches to maintain a stable development flow.

3. Context Efficiency
Modular Development: I avoided broad, "build everything" prompts. Instead, I broke the project into four distinct steps: Authentication, Database Schema, Matching Logic, and API Security.

Targeted Context: I utilized Cursor's @ symbol to reference only the files necessary for specific tasks. This prevented "AI hallucinations" and kept the generated code lean and relevant to the existing architecture.

4. Decision Making

Privacy-First Architecture: I implemented email masking (a***@gmail.com) in the public view to ensure user privacy while still satisfying the requirement to identify shared interests.

Data Sanitization: I implemented input normalization (trimming and lowercase conversion) to ensure that the matching engine is robust against case-sensitivity and whitespace errors.

5. System Explanation
End-to-End Flow
Frontend: Built with Next.js 15 (App Router). It manages user sessions via Supabase Auth.

The API Route: All interest submissions (logged-in or anonymous) are routed through /api/interests.

Database Security: The system uses Row Level Security (RLS). The public is restricted to "Read" access only. The backend API uses a hidden Service Role Key to perform "Write" operations, making the database un-hackable from the client side.

Data Storage: Records store interest names, user emails, and unique IDs to facilitate matching.

Interest Matching Handling
Matching is performed via a client-side aggregation engine that ensures real-time reactivity:

It fetches the global interest list and filters out the current user's entries.

A reduce function groups identical interests by name.

A Set is used to aggregate a list of unique emails for each interest, satisfying the requirement to "identify and display" matching users.

Future Roadmap & Improvements
Privacy & User Masking: In a production release, I would implement a Username system. While emails are used here to demonstrate matching logic transparency for evaluation, usernames would be used to protect user privacy in a live environment.

Data Management Suite: The next phase of development includes a management dashboard allowing users to edit or delete their personal interest tags.

Advanced Analytics: Future versions will include "Match Strength" scoring based on the number of overlapping interests between users.

Rate Limiting: To protect the anonymous endpoint from spam, I would integrate Upstash/Redis to limit submissions by IP address.

Deliverables
GitHub Repository: [Insert Link]

Live Deployment (Vercel): [Insert Link]