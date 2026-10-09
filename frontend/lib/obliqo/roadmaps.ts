/**
 * Level-aware learning roadmaps. A roadmap is cumulative: aiming for Intermediate includes the Beginner
 * modules first, Advanced includes both. Hand-written for SQL, JavaScript, React, Python and Node.js;
 * every other skill gets a generic three-level template. Add a skill by adding a row to ROADMAPS.
 */
import type { Level, PlanStep, Schedule } from "./matching";
import { coursesFor } from "./courses";

/** [title, hours, summary, practice points, optional [resource label, url]] */
type Mod = [string, number, string, string[], [string, string]?];
type ByLevel = [Mod[], Mod[], Mod[]]; // Beginner, Intermediate, Advanced

const SQLBOLT: [string, string] = ["SQLBolt interactive lessons", "https://sqlbolt.com/"];
const MODE: [string, string] = ["Mode SQL tutorial", "https://mode.com/sql-tutorial/"];
const PG: [string, string] = ["PostgreSQL tutorial", "https://www.postgresql.org/docs/current/tutorial.html"];
const INDEX_LUKE: [string, string] = ["Use The Index, Luke", "https://use-the-index-luke.com/"];
const JSINFO: [string, string] = ["The Modern JavaScript Tutorial", "https://javascript.info/"];
const MDN_JS: [string, string] = ["MDN JavaScript guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"];
const REACT: [string, string] = ["React: Learn", "https://react.dev/learn"];
const PYDOC: [string, string] = ["Python tutorial", "https://docs.python.org/3/tutorial/"];
const CS50P: [string, string] = ["CS50P (Harvard)", "https://cs50.harvard.edu/python/"];
const PYTEST: [string, string] = ["pytest docs", "https://docs.pytest.org/"];
const NODE: [string, string] = ["Node.js: Learn", "https://nodejs.org/en/learn"];
const EXPRESS: [string, string] = ["Express guide", "https://expressjs.com/en/starter/installing.html"];
const OWASP: [string, string] = ["OWASP Top Ten", "https://owasp.org/www-project-top-ten/"];

const ROADMAPS: Record<string, ByLevel> = {
  SQL: [
    [
      ["Querying with SELECT", 6, "Read data from one table and shape the result.", ["SELECT, WHERE, ORDER BY, LIMIT", "Filter with AND/OR, IN, BETWEEN, LIKE", "Summarise with COUNT, SUM, AVG and GROUP BY", "Solve 15 practice queries"], SQLBOLT],
      ["Joins and relationships", 7, "Combine tables the way real databases are laid out.", ["Primary and foreign keys", "INNER and LEFT JOIN across 2-3 tables", "Joins with GROUP BY and HAVING", "Practice: customers, orders and products"], MODE],
      ["Writing data", 5, "Create tables and change data safely.", ["INSERT, UPDATE, DELETE (try them inside a transaction)", "CREATE TABLE with types and constraints", "Mini project: a 3-table database for internships, companies and applications"], PG],
    ],
    [
      ["Subqueries and CTEs", 8, "Break hard questions into readable steps.", ["Subqueries in WHERE and FROM", "WITH (CTE) to structure long queries", "EXISTS vs IN, and handling NULLs correctly"]],
      ["Window functions", 8, "Rank and compare rows without collapsing them.", ["ROW_NUMBER, RANK and running totals", "PARTITION BY and ORDER BY", "LAG and LEAD to compare rows", "Solve 10 top-N-per-group problems"]],
      ["Database design", 9, "Model data so it stays correct as it grows.", ["Normalisation (1NF to 3NF) with examples", "One-to-many vs many-to-many tables", "What an index is and when to add one", "Redesign a messy spreadsheet into tables"]],
      ["Analytics project", 10, "Answer business questions on a real dataset.", ["Load a public dataset with 10k+ rows", "Write 15 business questions as queries", "Publish queries and findings in a GitHub README"]],
    ],
    [
      ["Indexes and query performance", 10, "Find why a query is slow and fix it.", ["Read EXPLAIN / EXPLAIN ANALYZE output", "B-tree, composite and covering indexes", "Rewrite a slow query and measure the speed-up"], INDEX_LUKE],
      ["Transactions and concurrency", 8, "Keep data correct when many users write at once.", ["ACID and isolation levels", "Locks and deadlocks, and how to avoid them", "Write a safe money-transfer transaction"]],
      ["Advanced SQL patterns", 10, "Tools used on large, real schemas.", ["Recursive CTEs for trees and hierarchies", "Views and materialised views", "JSON columns and partitioning large tables"]],
      ["Capstone: design and optimise", 14, "Take one database from schema to tuned queries.", ["Draw an ER diagram for a real app", "Load 100k+ rows and write 20 queries", "Add indexes and show before/after EXPLAIN", "Write up your design trade-offs"]],
    ],
  ],
  JavaScript: [
    [
      ["Core syntax", 8, "The language basics you will use every day.", ["Variables, types, functions and scope", "Arrays, objects and loops", "map, filter and reduce", "Solve 20 small exercises"], JSINFO],
      ["The DOM and events", 7, "Make web pages respond to people.", ["Select and change elements", "Handle clicks, input and forms", "Build a counter and a form validator"], MDN_JS],
      ["Beginner project", 8, "Put the basics together without a tutorial.", ["Build a to-do app", "Save items with localStorage", "Push it to GitHub with a README"]],
    ],
    [
      ["Async JavaScript", 8, "Work with data that arrives later.", ["Callbacks, promises and async/await", "fetch an API and handle errors", "Build a weather app"], JSINFO],
      ["Modern JavaScript", 7, "The features current codebases rely on.", ["Destructuring, spread and rest", "ES modules, closures and this", "Classes"]],
      ["Tooling and debugging", 6, "Work like a professional.", ["npm and a bundler such as Vite", "Debug with browser DevTools", "Set up ESLint and Prettier"]],
      ["API-driven project", 14, "A real app with search and filters.", ["Fetch from a public API", "Add search, filter and sort", "Deploy it and add the link to your resume"]],
    ],
    [
      ["How JavaScript really works", 10, "Understand the engine, not just the syntax.", ["Call stack and the event loop", "Prototypes and inheritance", "Memory and garbage collection"], JSINFO],
      ["Testing and patterns", 10, "Make code you can change safely.", ["Unit tests with Vitest or Jest", "Module and observer patterns", "A consistent error-handling strategy"]],
      ["Performance and security", 8, "Fast and safe pages.", ["Debounce, throttle and lazy loading", "XSS and CORS basics", "Audit a page with Lighthouse"]],
      ["Capstone: framework-free SPA", 20, "Build something substantial from scratch.", ["Client-side routing and state management", "Tests for the core logic", "Deploy and write up architecture decisions"]],
    ],
  ],
  React: [
    [
      ["Components and props", 7, "Build the UI from small reusable pieces.", ["JSX and function components", "Pass data with props", "Render lists with keys"], REACT],
      ["State and events", 7, "Make components interactive.", ["useState and event handlers", "Controlled form inputs", "Lift state up"], REACT],
      ["Effects and data fetching", 8, "Talk to an API from a component.", ["useEffect and its cleanup", "Loading and error states", "Fetch and render API data"], REACT],
      ["Beginner project", 8, "A small app, start to finish.", ["Build a movie or job search app", "Split it into at least 5 components", "Push to GitHub with a README"]],
    ],
    [
      ["Routing, context and forms", 9, "Multi-page apps with shared state.", ["React Router with nested routes", "Context for shared state", "Form handling and validation"]],
      ["Custom hooks and patterns", 8, "Reuse logic cleanly.", ["Write 2 custom hooks (e.g. useFetch)", "Composition and children props", "useReducer for complex state"]],
      ["Data layer", 8, "Handle server data properly.", ["A data library such as TanStack Query", "Caching, refetching and mutations", "Optimistic updates"]],
      ["Testing and styling", 7, "Confidence and polish.", ["React Testing Library basics", "Tailwind CSS or CSS Modules", "Responsive layout"]],
      ["Intermediate project", 14, "A realistic app with auth and data.", ["Login with a backend or Firebase", "CRUD with a list and detail view", "Deploy it"]],
    ],
    [
      ["Performance", 8, "Find real bottlenecks before optimising.", ["Use the React Profiler", "memo, useMemo and useCallback when they help", "Code splitting with lazy and Suspense"]],
      ["Architecture and accessibility", 9, "Structure a growing codebase.", ["Folder structure and state management trade-offs (Redux Toolkit, Zustand)", "Error boundaries", "Keyboard and screen-reader accessibility"]],
      ["Server rendering with Next.js", 10, "SSR and SSG for real products.", ["App Router, server and client components", "Data fetching on the server", "Deploy to Vercel"]],
      ["Capstone", 20, "Ship a production-quality app.", ["Auth, data, tests and CI", "Lighthouse score of 90+", "Write up your architecture decisions"]],
    ],
  ],
  Python: [
    [
      ["Syntax and data types", 8, "The core of the language.", ["Variables, strings, lists, dicts, sets", "Conditions and loops", "Read and write files"], PYDOC],
      ["Functions and modules", 7, "Organise code you can reuse.", ["Functions, arguments and return values", "Import and write modules", "Handle errors with try/except"], CS50P],
      ["Practice problems", 8, "Build fluency.", ["Solve 20 small exercises", "Write a text-based game", "Push your solutions to GitHub"]],
    ],
    [
      ["Object-oriented Python", 8, "Model things with classes.", ["Classes, methods and inheritance", "Dunder methods and dataclasses", "Refactor a script into classes"]],
      ["Environments and libraries", 6, "Work with the ecosystem.", ["venv and pip", "requests and the standard library", "Read a library's docs"]],
      ["APIs and data", 9, "Get and process real data.", ["Call a JSON API with requests", "Read and write CSV and JSON", "pandas basics"]],
      ["Intermediate project", 14, "A tool people could use.", ["Build a CLI tool or a scraper", "Add a README and usage examples", "Publish to GitHub"]],
    ],
    [
      ["Testing and code quality", 8, "Code you can trust.", ["pytest and fixtures", "Type hints and mypy", "Format and lint with ruff"], PYTEST],
      ["Concurrency and performance", 9, "Make slow code faster.", ["Generators and iterators", "asyncio basics", "Profile with cProfile"]],
      ["Web APIs with FastAPI or Django", 12, "Serve your work over HTTP.", ["Routes, validation and a database", "Authentication", "Auto-generated API docs"]],
      ["Capstone", 20, "A deployed, tested service.", ["API with tests and CI", "Containerise with Docker", "Deploy and monitor it"]],
    ],
  ],
  "Node.js": [
    [
      ["Runtime basics", 6, "How Node runs your code.", ["Modules, npm and package.json", "File system and path", "Environment variables"], NODE],
      ["HTTP and Express", 8, "Your first web server.", ["Routes and middleware", "Request and response objects", "Serve JSON"], EXPRESS],
      ["CRUD API", 8, "A working API with in-memory data.", ["Create, read, update and delete routes", "Test with Postman or curl", "Organise routes and controllers"]],
    ],
    [
      ["Databases", 9, "Persist data.", ["MongoDB with Mongoose, or Postgres with Prisma", "Models and queries", "Seed and migrate data"]],
      ["Authentication", 8, "Know who is calling.", ["Password hashing with bcrypt", "JWTs or sessions", "Protect routes with middleware"]],
      ["Validation and error handling", 6, "Fail clearly.", ["Validate input (zod or Joi)", "Central error middleware", "Useful status codes"]],
      ["REST API project", 14, "A realistic backend.", ["Users, auth and 2 resources", "Pagination and filtering", "Deploy it"]],
    ],
    [
      ["Testing and CI", 8, "Catch bugs automatically.", ["Jest and Supertest", "Run tests in GitHub Actions", "Test coverage on core routes"]],
      ["Security and performance", 9, "Harden the service.", ["Common web vulnerabilities (OWASP Top Ten)", "Rate limiting and helmet", "Caching with Redis"], OWASP],
      ["Production readiness", 9, "Run it for real.", ["Structured logging", "Config per environment", "Docker image and deployment"]],
      ["Capstone", 20, "A service built to scale.", ["Background jobs with a queue", "Observability and health checks", "Write up architecture decisions"]],
    ],
  ],
};

function generic(skill: string): ByLevel {
  const free = coursesFor(skill).find((c) => c.free);
  const res: [string, string] | undefined = free ? [free.title, free.url] : undefined;
  return [
    [
      [`${skill} fundamentals`, 8, `Learn the core ideas of ${skill}.`, [`Work through a beginner guide to ${skill}`, "Write down key terms in your own words", "Re-create 3 examples without looking"], res],
      ["Guided tutorial", 8, "Build along with one good tutorial.", ["Pick one tutorial and finish it", "Note what each part does", "Change something to see what breaks"]],
      ["Mini project", 8, `Make something small with ${skill}.`, ["Choose a tiny idea", "Build it without a tutorial", "Push it to GitHub"]],
    ],
    [
      ["Core concepts in depth", 10, `Go beyond the basics of ${skill}.`, ["Read the official documentation sections you skipped", "Solve 10 intermediate exercises", "Learn the 5 mistakes beginners make"], res],
      ["Real project", 16, "A project with a real purpose.", ["Plan features before coding", "Build it in stages", "Deploy or share it"]],
      ["Tools, debugging and testing", 8, "Work like a professional.", ["Learn the standard tools for debugging", "Write basic tests", "Use version control properly"]],
    ],
    [
      ["Architecture and best practices", 12, "Structure larger work.", ["Study how open-source projects are organised", "Apply recognised patterns", "Review and refactor your earlier project"]],
      ["Performance, security and deployment", 12, "Production concerns.", ["Measure before optimising", "Learn the common security pitfalls", "Automate deployment"]],
      ["Capstone project", 20, `A portfolio-grade ${skill} project.`, ["Define scope and success criteria", "Build, test and deploy it", "Write a case study of your decisions"]],
    ],
  ];
}

export const hasHandWrittenRoadmap = (skill: string) => skill in ROADMAPS;

export interface Roadmap { steps: PlanStep[]; schedule: Schedule; goal: Level; totalHours: number; weeks: number; handWritten: boolean }
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

/** Build the roadmap for reaching `goal`, paced by hoursPerDay x daysPerWeek. */
export function buildRoadmap(skill: string, goal: Level, pace: { hoursPerDay: number; daysPerWeek: number }): Roadmap {
  const set = ROADMAPS[skill] ?? generic(skill);
  const hoursPerDay = Math.min(12, Math.max(0.5, pace.hoursPerDay));
  const daysPerWeek = Math.min(7, Math.max(1, Math.round(pace.daysPerWeek)));
  const hpw = hoursPerDay * daysPerWeek;
  let cum = 0, n = 0;
  const steps: PlanStep[] = [];
  for (let lv = 0; lv < goal; lv++) {
    for (const [title, hours, detail, points, res] of set[lv]) {
      steps.push({
        id: `r${n++}`, week: Math.floor(cum / hpw + 1e-9) + 1, title, detail, hours, points, phase: LEVELS[lv],
        ...(res ? { resource: { label: res[0], url: res[1] } } : {}),
      });
      cum += hours;
    }
  }
  const weeks = Math.min(52, Math.max(1, Math.ceil(cum / hpw - 1e-9)));
  steps.forEach((s) => { s.week = Math.min(s.week, weeks); });
  return { steps, schedule: { weeks, hoursPerDay, daysPerWeek }, goal, totalHours: cum, weeks, handWritten: skill in ROADMAPS };
}
