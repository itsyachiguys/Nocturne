/**
 * Curated course catalog, keyed by skill. Static on purpose: generated links go stale or 404.
 * To add a skill, add a row to CATALOG. Any skill without a row still gets search links (see searchLinks).
 * Prices change often, so we only say Free or Paid, never an amount.
 */
export interface Course {
  id: string;
  title: string;
  provider: string;
  url: string;
  free: boolean;
  note?: string;
  custom?: boolean; // added by the user
}

type Row = [title: string, provider: string, url: string, free: boolean, note?: string];

const WEB_FREE: Row[] = [
  ["Learn HTML", "web.dev", "https://web.dev/learn/html", true, "Short, official, practical"],
  ["Learn CSS", "web.dev", "https://web.dev/learn/css", true, "Covers layout, flexbox and grid"],
];
const WEB_PAID: Row[] = [
  ["HTML, CSS, and Javascript for Web Developers", "Coursera (Johns Hopkins)", "https://www.coursera.org/learn/html-css-javascript-for-web-developers", false, "Structured, with graded assignments"],
];

const CATALOG: Record<string, Row[]> = {
  HTML: [...WEB_FREE, ...WEB_PAID],
  CSS: [...WEB_FREE, ...WEB_PAID],
  JavaScript: [
    ["The Modern JavaScript Tutorial", "javascript.info", "https://javascript.info/", true, "Best free reference-style course"],
    ["JavaScript Algorithms and Data Structures", "freeCodeCamp", "https://www.freecodecamp.org/learn", true, "Interactive, in-browser exercises"],
    ["The Complete JavaScript Course", "Udemy (Jonas Schmedtmann)", "https://www.udemy.com/course/the-complete-javascript-course/", false, "Long and project-heavy"],
    ["Programming with JavaScript", "Coursera (Meta)", "https://www.coursera.org/learn/programming-with-javascript", false, "Short, certificate included"],
  ],
  React: [
    ["Learn React", "react.dev", "https://react.dev/learn", true, "The official tutorial"],
    ["Full Stack Open", "University of Helsinki", "https://fullstackopen.com/en/", true, "React, Node, TypeScript. Very thorough"],
    ["React - The Complete Guide", "Udemy (Maximilian Schwarzmüller)", "https://www.udemy.com/course/react-the-complete-guide-incl-redux/", false, "Most popular paid React course"],
    ["React Basics", "Coursera (Meta)", "https://www.coursera.org/learn/react-basics", false, "Gentle start"],
  ],
  "Next.js": [
    ["Learn Next.js", "nextjs.org", "https://nextjs.org/learn", true, "Official, builds a dashboard app"],
    ["Next.js & React - The Complete Guide", "Udemy (Maximilian Schwarzmüller)", "https://www.udemy.com/course/nextjs-react-the-complete-guide/", false],
  ],
  TypeScript: [
    ["TypeScript Handbook", "typescriptlang.org", "https://www.typescriptlang.org/docs/handbook/intro.html", true, "Official"],
    ["Total TypeScript tutorials", "Total TypeScript", "https://www.totaltypescript.com/tutorials", true, "Free tutorials and exercises"],
    ["Understanding TypeScript", "Udemy (Maximilian Schwarzmüller)", "https://www.udemy.com/course/understanding-typescript/", false],
  ],
  "Node.js": [
    ["Node.js: Learn", "nodejs.org", "https://nodejs.org/en/learn", true, "Official guides"],
    ["Full Stack Open", "University of Helsinki", "https://fullstackopen.com/en/", true, "Part 3 onward is Node and Express"],
    ["Node.js, Express, MongoDB & More", "Udemy (Jonas Schmedtmann)", "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/", false, "Builds a full project"],
  ],
  Python: [
    ["CS50's Introduction to Programming with Python", "Harvard (CS50)", "https://cs50.harvard.edu/python/", true, "Rigorous, with problem sets"],
    ["Automate the Boring Stuff with Python", "Al Sweigart", "https://automatetheboringstuff.com/", true, "Practical, project-first"],
    ["Python for Everybody", "Coursera (Univ. of Michigan)", "https://www.coursera.org/specializations/python", false, "Beginner friendly"],
    ["100 Days of Code: Python Pro Bootcamp", "Udemy (Angela Yu)", "https://www.udemy.com/course/100-days-of-code/", false, "One project a day"],
  ],
  Django: [
    ["Django Girls Tutorial", "Django Girls", "https://tutorial.djangogirls.org/en/", true, "Build a blog step by step"],
    ["Django: Getting started", "djangoproject.com", "https://docs.djangoproject.com/en/stable/intro/", true, "Official tutorial"],
    ["Django for Everybody", "Coursera (Univ. of Michigan)", "https://www.coursera.org/specializations/django", false],
  ],
  SQL: [
    ["SQLBolt", "SQLBolt", "https://sqlbolt.com/", true, "Interactive lessons, about 2 hours"],
    ["SQL Tutorial", "Mode", "https://mode.com/sql-tutorial/", true, "Good for analytics-style SQL"],
    ["SQL for Data Science", "Coursera (UC Davis)", "https://www.coursera.org/learn/sql-for-data-science", false],
    ["The Complete SQL Bootcamp", "Udemy (Jose Portilla)", "https://www.udemy.com/course/the-complete-sql-bootcamp/", false],
  ],
  MongoDB: [["MongoDB University", "MongoDB", "https://learn.mongodb.com/", true, "Free official courses"]],
  Git: [
    ["Pro Git (book)", "git-scm.com", "https://git-scm.com/book/en/v2", true, "The reference"],
    ["GitHub Skills", "GitHub", "https://skills.github.com/", true, "Hands-on, inside a real repo"],
    ["Version Control with Git", "Coursera (Atlassian)", "https://www.coursera.org/learn/version-control-with-git", false],
  ],
  Angular: [
    ["Angular tutorials", "angular.dev", "https://angular.dev/tutorials", true, "Official"],
    ["Angular - The Complete Guide", "Udemy (Maximilian Schwarzmüller)", "https://www.udemy.com/course/the-complete-guide-to-angular-2/", false],
  ],
  Flutter: [
    ["Flutter: Write your first app", "flutter.dev", "https://docs.flutter.dev/get-started/codelab", true, "Official codelab"],
    ["Flutter & Dart - The Complete Guide", "Udemy (Maximilian Schwarzmüller)", "https://www.udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/", false],
  ],
  Docker: [
    ["Docker: Get started", "docs.docker.com", "https://docs.docker.com/get-started/", true, "Official"],
    ["Docker & Kubernetes: The Practical Guide", "Udemy (Maximilian Schwarzmüller)", "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/", false],
  ],
  Firebase: [["Firebase codelabs", "Google", "https://firebase.google.com/codelabs", true, "Official, hands-on"]],
  PHP: [["PHP: The Right Way", "phptherightway.com", "https://phptherightway.com/", true, "Modern best practices"]],
};

const toCourses = (skill: string, rows: Row[]): Course[] =>
  rows.map(([title, provider, url, free, note], i) => ({ id: `${skill}:${i}`, title, provider, url, free, ...(note ? { note } : {}) }));

export function coursesFor(skill: string): Course[] {
  return toCourses(skill, CATALOG[skill] ?? []);
}

/** Always-available search links, so every skill (even uncatalogued ones) has somewhere to go. */
export function searchLinks(skill: string): { label: string; url: string; free: boolean }[] {
  const q = encodeURIComponent(skill);
  return [
    { label: "YouTube (free)", url: `https://www.youtube.com/results?search_query=${q}+full+course`, free: true },
    { label: "Coursera", url: `https://www.coursera.org/search?query=${q}`, free: false },
    { label: "Udemy", url: `https://www.udemy.com/courses/search/?q=${q}`, free: false },
  ];
}

/** Only http(s) links are ever stored or rendered as hrefs. */
export function safeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch { return null; }
}
