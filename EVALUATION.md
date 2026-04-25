---
 ***AI / Cursor Usage (CORE PART OF EVALUATION)***

---

## 1. Prompts Used

**Phase 1: Core Architecture**
* **"Create a Next.js API route that allows anonymous interest submission to Supabase while keeping the database secure using the service_role key."**
  * *Why:* To fulfill the requirement for a public endpoint while maintaining professional-grade security by keeping write-access restricted to the server.
* **"Write logic to group interests by name and display unique users sharing them, explicitly excluding the current logged-in user."**
  * *Why:* This required precise data transformation using `reduce` and `Set` to ensure the "Community Matches" UI was clean, logical, and accurate.

**Phase 2: QA & Hardening**
* **"Act as a Senior Lead Engineer and Security Auditor. Scan all API routes and frontend components for hardcoded credentials. Ensure compatibility with the new 'sb_publishable' key format and verify dynamic Auth redirects."**
  * *Why:* I shifted AI usage from "feature building" to "quality assurance." I used this prompt to force the AI to verify my infrastructure security against strict production standards.
* **"Implement a synonym expansion engine for the interest matching logic. If a user searches 'Cars', it should expand to query 'Formula 1' and 'Range Rover' using an array inclusion query (.in())."**
  * *Why:* Basic exact-string matching is insufficient for real-world applications. I wrote this prompt to build a semantic mapping layer that connects related concepts seamlessly.

---

## 2. Iteration & Problem Solving

* **The Security Leak & Credential Rotation:** During initial development, a legacy Supabase anon key was accidentally committed to the Git history. 
  * *Adjustment:* Instead of simply deleting the key from the code (which leaves it vulnerable in the commit history), I executed a full credential rotation. I permanently revoked the master JWT secret in the Supabase dashboard, neutralizing the leaked key. I then migrated the application to the modern, secure `sb_publishable` key format via Vercel environment variables.
* **Database Security (RLS Pivot):** Initially, Row Level Security (RLS) was disabled for rapid prototyping. 
  * *Adjustment:* I later re-enabled RLS, restricting public access to "Read-Only". I implemented the `service_role` key strictly within the backend API, ensuring the frontend remains locked down while the backend handles anonymous data insertion safely.
* **Environment Stability (Memory Management):** When the local development environment faced memory/RAM loops during testing, it threatened to slow down the 24-hour sprint.
  * *Adjustment:* I adjusted by breaking large logic blocks into smaller, modular components and regularly clearing Next.js build caches to maintain a stable development flow and prevent memory leaks.
* **Auth Redirect Hardcoding:** The initial Supabase authentication callback was hardcoded to `localhost`, breaking the production login flow. 
  * *Adjustment:* I implemented a dynamic `getBaseUrl()` helper function. It explicitly checks for `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_VERCEL_URL` before falling back to localhost, ensuring deterministic, environment-aware routing.

---

## 3. Context Efficiency

* **Modular Development:** I avoided broad, "build everything" prompts. Instead, I broke the project into distinct steps: Authentication, Database Schema, Matching Logic, and API Security. By using Cursor's `@file` referencing, I only fed the AI the context it needed for a specific task, preventing AI hallucinations.
* **AI as a QA Auditor:** Instead of feeding the AI massive blocks of code and asking "is this good?", I provided the AI with specific evaluation criteria (Security, Redirects, Privacy) and forced it to audit the codebase criterion-by-criterion. 

---

## 4. Decision Making

* **Privacy Evolution (Masked Emails vs. Verified Users):** Initially, the app displayed masked emails (e.g., `a***@gmail.com`) to prove matches were real humans. 
  * *Decision:* Upon review, I completely removed emails from the public UI to prioritize user privacy. I replaced them with a "Verified User" badge and a match counter (`x1`, `x2`). This perfectly satisfies the requirement to prove human interaction without compromising PII.
* **Semantic Mapping vs. Vector Database:** To solve the "Cars -> Formula 1" matching requirement, I built a hardcoded synonym expansion dictionary. 
  * *Decision:* While a vector database (like `pgvector`) is the ultimate solution for AI search, it is over-engineered for a 24-hour MVP. A semantic dictionary is lightweight, faster to implement, enforces strict data integrity (lowercasing/trimming), and is 100% accurate for demonstrating business logic capability.

---

## System Explanation

### End-to-End Flow
* **Frontend:** Built with Next.js 15 (App Router) and deployed on Vercel. 
* **Auth & Database:** Powered by Supabase. The system utilizes environment-aware configurations to manage local vs. production deployments safely.
* **API Security:** The public endpoint (`/api/interests`) allows anonymous submissions safely by utilizing server-side environment variables, ensuring the database layer is protected from client-side tampering.

### Interest Matching Engine
Matching is performed via a multi-tier client-side aggregation engine:
1. **Normalization:** User input is cleaned (trimmed and lowercased) and validated against existing interests to prevent database duplicates.
2. **Expansion:** The system checks the input against a semantic dictionary. If a user inputs "Cars", the engine expands the search array to `['cars', 'formula 1', 'range rover']`.
3. **Querying & Filtering:** A `.in()` query filters the global database for any users overlapping with the expanded array. It explicitly filters out the current user's ID so you only match with *other* people.
4. **Aggregation:** A `reduce` function and `Set` are used to group identical interests by name and aggregate a list of unique users, rendering the "Verified User" UI.

### Future Roadmap & Improvements
* **Scalability of the Synonym Map:** Upgrading from a hardcoded dictionary to NLP embeddings (OpenAI) and a Vector database would be required for a production launch to handle thousands of unmapped topics.
* **Rate Limiting:** The public anonymous API currently lacks abuse protection. Integrating Upstash/Redis to limit submissions by IP address would be necessary to prevent spam.
* **Data Management Suite:** A user dashboard allowing users to edit, delete, or manage the privacy of their specific interest tags.

---

## API Documentation

**Submit an Anonymous Interest**
The system provides a public endpoint to submit interests asynchronously. 

* **Endpoint:** `POST https://aura-rouge-delta.vercel.app/api/interests`
* **Headers:** `Content-Type: application/json`
* **Body:** `{"name": "Your Interest Here"}`

**cURL Example:**
```bash
curl -X POST https://aura-rouge-delta.vercel.app/api/interests \
-H "Content-Type: application/json" \
-d '{"name": "Machine Learning"}'
```

---

## Deliverables

* **GitHub Repository:** [https://github.com/asafet19/Aura](https://github.com/asafet19/Aura) 
* **Live Deployment (Vercel):** [https://aura-rouge-delta.vercel.app/](https://aura-rouge-delta.vercel.app/)