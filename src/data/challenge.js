const parseBank = (source) => source.trim().split("\n").map((line) => {
  const [id, ...titleParts] = line.split("|");
  const title = titleParts.join("|").trim();
  const slug = Number(id) === 432 ? "all-oone-data-structure" : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { id: Number(id), title, slug };
});

const EASY_FIRST = parseBank(`
1|Two Sum
9|Palindrome Number
13|Roman to Integer
14|Longest Common Prefix
20|Valid Parentheses
21|Merge Two Sorted Lists
26|Remove Duplicates from Sorted Array
27|Remove Element
28|Find the Index of the First Occurrence in a String
35|Search Insert Position
58|Length of Last Word
66|Plus One
67|Add Binary
69|Sqrt(x)
70|Climbing Stairs
83|Remove Duplicates from Sorted List
88|Merge Sorted Array
94|Binary Tree Inorder Traversal
100|Same Tree
101|Symmetric Tree
104|Maximum Depth of Binary Tree
108|Convert Sorted Array to Binary Search Tree
110|Balanced Binary Tree
111|Minimum Depth of Binary Tree
112|Path Sum
118|Pascal's Triangle
119|Pascal's Triangle II
121|Best Time to Buy and Sell Stock
125|Valid Palindrome
136|Single Number
141|Linked List Cycle
144|Binary Tree Preorder Traversal
145|Binary Tree Postorder Traversal
160|Intersection of Two Linked Lists
168|Excel Sheet Column Title
169|Majority Element
171|Excel Sheet Column Number
191|Number of 1 Bits
202|Happy Number
203|Remove Linked List Elements
206|Reverse Linked List
217|Contains Duplicate
219|Contains Duplicate II
225|Implement Stack using Queues
226|Invert Binary Tree
228|Summary Ranges
231|Power of Two
232|Implement Queue using Stacks
234|Palindrome Linked List
242|Valid Anagram
257|Binary Tree Paths
258|Add Digits
263|Ugly Number
268|Missing Number
283|Move Zeroes
290|Word Pattern
303|Range Sum Query - Immutable
326|Power of Three
344|Reverse String
345|Reverse Vowels of a String
`);

const EASY_SECOND = parseBank(`
367|Valid Perfect Square
374|Guess Number Higher or Lower
383|Ransom Note
387|First Unique Character in a String
389|Find the Difference
392|Is Subsequence
401|Binary Watch
404|Sum of Left Leaves
409|Longest Palindrome
412|Fizz Buzz
414|Third Maximum Number
415|Add Strings
434|Number of Segments in a String
441|Arranging Coins
448|Find All Numbers Disappeared in an Array
455|Assign Cookies
459|Repeated Substring Pattern
463|Island Perimeter
476|Number Complement
485|Max Consecutive Ones
496|Next Greater Element I
500|Keyboard Row
506|Relative Ranks
520|Detect Capital
530|Minimum Absolute Difference in BST
541|Reverse String II
543|Diameter of Binary Tree
557|Reverse Words in a String III
561|Array Partition
566|Reshape the Matrix
572|Subtree of Another Tree
575|Distribute Candies
589|N-ary Tree Preorder Traversal
590|N-ary Tree Postorder Traversal
594|Longest Harmonious Subsequence
605|Can Place Flowers
617|Merge Two Binary Trees
628|Maximum Product of Three Numbers
637|Average of Levels in Binary Tree
643|Maximum Average Subarray I
645|Set Mismatch
653|Two Sum IV - Input is a BST
657|Robot Return to Origin
661|Image Smoother
665|Non-decreasing Array
669|Trim a Binary Search Tree
674|Longest Continuous Increasing Subsequence
680|Valid Palindrome II
682|Baseball Game
693|Binary Number with Alternating Bits
696|Count Binary Substrings
697|Degree of an Array
700|Search in a Binary Search Tree
704|Binary Search
706|Design HashMap
709|To Lower Case
724|Find Pivot Index
728|Self Dividing Numbers
733|Flood Fill
744|Find Smallest Letter Greater Than Target
`);

const MEDIUM = parseBank(`
3|Longest Substring Without Repeating Characters
5|Longest Palindromic Substring
11|Container With Most Water
15|3Sum
17|Letter Combinations of a Phone Number
19|Remove Nth Node From End of List
22|Generate Parentheses
33|Search in Rotated Sorted Array
34|Find First and Last Position of Element in Sorted Array
36|Valid Sudoku
39|Combination Sum
40|Combination Sum II
46|Permutations
48|Rotate Image
49|Group Anagrams
53|Maximum Subarray
54|Spiral Matrix
55|Jump Game
56|Merge Intervals
57|Insert Interval
62|Unique Paths
64|Minimum Path Sum
73|Set Matrix Zeroes
74|Search a 2D Matrix
78|Subsets
79|Word Search
90|Subsets II
91|Decode Ways
98|Validate Binary Search Tree
102|Binary Tree Level Order Traversal
103|Binary Tree Zigzag Level Order Traversal
105|Construct Binary Tree from Preorder and Inorder Traversal
114|Flatten Binary Tree to Linked List
128|Longest Consecutive Sequence
130|Surrounded Regions
133|Clone Graph
138|Copy List with Random Pointer
139|Word Break
142|Linked List Cycle II
143|Reorder List
146|LRU Cache
150|Evaluate Reverse Polish Notation
153|Find Minimum in Rotated Sorted Array
162|Find Peak Element
198|House Robber
199|Binary Tree Right Side View
200|Number of Islands
207|Course Schedule
208|Implement Trie (Prefix Tree)
209|Minimum Size Subarray Sum
210|Course Schedule II
213|House Robber II
215|Kth Largest Element in an Array
216|Combination Sum III
221|Maximal Square
230|Kth Smallest Element in a BST
236|Lowest Common Ancestor of a Binary Tree
238|Product of Array Except Self
240|Search a 2D Matrix II
279|Perfect Squares
300|Longest Increasing Subsequence
`);

const HARD = parseBank(`
4|Median of Two Sorted Arrays
10|Regular Expression Matching
23|Merge k Sorted Lists
25|Reverse Nodes in k-Group
32|Longest Valid Parentheses
41|First Missing Positive
42|Trapping Rain Water
44|Wildcard Matching
51|N-Queens
52|N-Queens II
65|Valid Number
68|Text Justification
72|Edit Distance
76|Minimum Window Substring
84|Largest Rectangle in Histogram
85|Maximal Rectangle
87|Scramble String
115|Distinct Subsequences
123|Best Time to Buy and Sell Stock III
124|Binary Tree Maximum Path Sum
126|Word Ladder II
127|Word Ladder
132|Palindrome Partitioning II
135|Candy
140|Word Break II
149|Max Points on a Line
154|Find Minimum in Rotated Sorted Array II
174|Dungeon Game
188|Best Time to Buy and Sell Stock IV
212|Word Search II
214|Shortest Palindrome
218|The Skyline Problem
224|Basic Calculator
239|Sliding Window Maximum
273|Integer to English Words
282|Expression Add Operators
295|Find Median from Data Stream
297|Serialize and Deserialize Binary Tree
301|Remove Invalid Parentheses
315|Count of Smaller Numbers After Self
316|Remove Duplicate Letters
321|Create Maximum Number
327|Count of Range Sum
330|Patching Array
332|Reconstruct Itinerary
336|Palindrome Pairs
352|Data Stream as Disjoint Intervals
354|Russian Doll Envelopes
363|Max Sum of Rectangle No Larger than K
391|Perfect Rectangle
403|Frog Jump
407|Trapping Rain Water II
410|Split Array Largest Sum
420|Strong Password Checker
432|All O'one Data Structure
440|K-th Smallest in Lexicographical Order
460|LFU Cache
466|Count The Repetitions
472|Concatenated Words
493|Reverse Pairs
502|IPO
`);

const phase = (track, guideUrl, topics) => topics.map(([title, summary]) => ({ track, guideUrl, title, summary }));

const lessons = [
  ...phase("C# CORE", "https://www.geeksforgeeks.org/c-sharp/csharp-programming-language/", [
    ["C# syntax & types", "Set up a clean console project and work confidently with variables, types, and expressions."],
    ["Value types & conversion", "Compare value and reference types, then use safe parsing and explicit conversions."],
    ["Branching & pattern matching", "Make decisions with if, switch expressions, and readable guard clauses."],
    ["Loops, arrays & strings", "Traverse collections safely and build predictable string handling habits."],
    ["Methods & parameters", "Shape focused methods with optional, named, and out parameters."],
    ["Lists & dictionaries", "Choose the right collection and understand its lookup and update costs."],
    ["Classes & objects", "Model a small domain with constructors, properties, and sensible defaults."],
    ["Encapsulation & inheritance", "Keep state private and use inheritance only where the relationship is real."],
    ["Interfaces & polymorphism", "Use contracts and composition to make behavior easier to extend."],
    ["Exceptions & debugging", "Raise meaningful errors and follow a repeatable debugging workflow."],
    ["Generics & reusable code", "Build type-safe helpers and collections without giving up clarity."],
    ["LINQ fundamentals", "Filter, project, group, and sort data with readable LINQ pipelines."],
    ["Delegates & events", "Connect publishers and subscribers while keeping event ownership clear."],
    ["Async / await in C#", "Use Task-based async code without blocking threads or losing exceptions."],
    ["C# mini-build day", "Combine collections, LINQ, validation, and clean methods in a small CLI feature."]
  ]),
  ...phase(".NET CORE", "https://www.geeksforgeeks.org/c-sharp/asp-net-tutorial/", [
    ["The .NET platform", "Trace the SDK, runtime, project file, and the path from source code to execution."],
    ["Project structure & CLI", "Create and run a minimal ASP.NET Core app, then understand its key files."],
    ["Minimal APIs & endpoints", "Map a small HTTP surface with clear request and response contracts."],
    ["Dependency injection", "Register services and choose lifetimes that match how your app uses them."],
    ["Middleware pipeline", "Read the request pipeline in order and add focused middleware safely."],
    ["Routing & model binding", "Design routes and bind path, query, and body data into request models."],
    ["Validation & API errors", "Validate incoming data and return consistent problem responses."],
    ["Configuration & options", "Keep environment settings outside code and bind them to typed options."],
    ["Logging & exception handling", "Add useful structured logs and one predictable error boundary."],
    ["EF Core & DbContext", "Model entities and understand the unit-of-work role of DbContext."],
    ["Migrations & persistence", "Evolve a schema with migrations and keep database setup repeatable."],
    ["CRUD API design", "Build create, read, update, and delete endpoints with correct status codes."],
    ["Authentication & authorization", "Separate who a user is from what that user is allowed to do."],
    ["API testing & documentation", "Exercise endpoints and publish a useful OpenAPI contract."],
    [".NET API mini-build", "Ship a small, validated API with persistence, DI, and a readable README."]
  ]),
  ...phase("JAVASCRIPT", "https://www.geeksforgeeks.org/javascript/javascript-tutorial/", [
    ["JavaScript runtime & types", "Practice coercion, equality, and the values JavaScript treats as truthy."],
    ["Control flow & functions", "Write small functions and choose clear control flow for common cases."],
    ["Arrays & objects", "Transform application data without mutating shared values by accident."],
    ["Map, Set & lookup patterns", "Use the right keyed collection to make lookups and de-duplication simple."],
    ["Scope & closures", "Understand lexical scope and capture state intentionally in callbacks."],
    ["this, prototypes & classes", "Read method binding and prototype behavior in everyday JavaScript."],
    ["DOM & event flow", "Work with browser events, delegation, and the capture/bubble phases."],
    ["Modules & code boundaries", "Split features into importable modules with explicit dependencies."],
    ["Promises & chaining", "Compose asynchronous work and recover from failures at the right boundary."],
    ["Async / await & fetch", "Load API data with loading, success, empty, and error states."],
    ["Errors, forms & validation", "Validate user input and make errors actionable instead of silent."],
    ["Debounce, throttle & timers", "Control noisy events and understand when scheduled callbacks run."],
    ["Array methods & composition", "Compose map, filter, reduce, and sort into readable transformations."],
    ["Browser storage & modules", "Persist small client preferences while keeping browser APIs isolated."],
    ["JavaScript mini-build", "Create a small interactive feature with clean state and robust async handling."]
  ]),
  ...phase("REACT", "https://www.geeksforgeeks.org/reactjs/react/", [
    ["JSX & component boundaries", "Turn a screen into small components with one clear responsibility each."],
    ["Props & composition", "Pass data down and use composition instead of oversized boolean prop lists."],
    ["State & event handlers", "Keep interactive state minimal and update it from user actions."],
    ["Hooks & derived state", "Use hooks consistently and derive values during render when possible."],
    ["Effects & cleanup", "Synchronize with external systems and clean up subscriptions and timers."],
    ["Custom hooks", "Extract reusable stateful behavior without hiding important inputs."],
    ["Reducers & context", "Model related state transitions and share only the data that needs it."],
    ["Lists, keys & empty states", "Render stable collections and make empty/loading states feel deliberate."],
    ["Forms & validation", "Control form values and show clear, accessible validation feedback."],
    ["Routing & screen structure", "Organize a small multi-screen app around user tasks and URLs."],
    ["Fetching & request states", "Handle loading, retries, stale data, and failures without UI flicker."],
    ["Memoization & performance", "Measure first, then memoize expensive work and stabilize hot callbacks."],
    ["Accessible interaction", "Make dialogs, buttons, labels, and keyboard paths usable by everyone."],
    ["Architecture & persistence", "Choose boundaries for features, shared UI, and browser-persisted state."],
    ["React capstone day", "Polish the challenge tracker: responsive layout, durable progress, and deployment notes."]
  ])
];

const gfgSearch = (query) => `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(query)}`;

export const challengeDays = lessons.map((lesson, index) => {
  const day = index + 1;
  const problems = [EASY_FIRST[index], EASY_SECOND[index], MEDIUM[index], HARD[index]].map((problem, problemIndex) => ({
    ...problem,
    difficulty: problemIndex < 2 ? "Easy" : problemIndex === 2 ? "Medium" : "Hard",
    leetcodeUrl: `https://leetcode.com/problems/${problem.slug}/`,
    notesUrl: gfgSearch(`${problem.title} solution notes`)
  }));
  return {
    day,
    week: Math.ceil(day / 5),
    ...lesson,
    notesUrl: gfgSearch(`${lesson.track} ${lesson.title}`),
    problems
  };
});

export const projectLabs = [
  {
    id: "csharp-cli",
    title: "C# Inventory CLI",
    subtitle: "C# Core · Week 2",
    description: "A tidy command-line inventory tool with filtering, validation, and saved data.",
    skills: ["Classes & interfaces", "Collections + LINQ", "Input validation", "JSON persistence"]
  },
  {
    id: "dotnet-api",
    title: ".NET Core Task API",
    subtitle: ".NET Core · Week 5",
    description: "A small REST API with dependency injection, EF Core, and a useful OpenAPI contract.",
    skills: ["Minimal APIs", "Dependency injection", "EF Core", "Auth + API tests"]
  },
  {
    id: "js-playground",
    title: "JavaScript Event Lab",
    subtitle: "JavaScript · Week 8",
    description: "An interactive browser tool that makes async and event behavior easy to inspect.",
    skills: ["DOM + event flow", "Fetch + async", "Modules", "Browser storage"]
  },
  {
    id: "react-capstone",
    title: "Placement Tracker",
    subtitle: "React · Weeks 10–12",
    description: "A polished, persistent challenge dashboard you can deploy and share from Vercel.",
    skills: ["Component composition", "Hooks + forms", "Accessible UI", "Deployment + README"]
  }
];

export const trackMeta = [
  { name: "C# Core", label: "01", color: "mint", range: [1, 15] },
  { name: ".NET Core", label: "02", color: "blue", range: [16, 30] },
  { name: "JavaScript", label: "03", color: "gold", range: [31, 45] },
  { name: "React", label: "04", color: "coral", range: [46, 60] }
];

export const problemCounts = { easy: 2, medium: 1, hard: 1 };
