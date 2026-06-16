const bcrypt = require('bcryptjs');
const db = require('./db');

const COMMUNITIES = [
  {
    name: 'Indie Makers Collective',
    slug: 'indie-makers',
    description: 'A community for independent makers building products, sharing lessons, and supporting each other.',
    purpose: 'Help indie makers succeed by sharing honest experiences and practical advice.',
    template: 'creator',
  },
  {
    name: 'Sustainable Living Forum',
    slug: 'sustainable-living',
    description: 'Discussing practical ways to live more sustainably.',
    purpose: 'Share actionable tips for reducing environmental impact.',
    template: 'civic',
  },
  {
    name: 'Programming Help Hub',
    slug: 'programming-help',
    description: 'Get help with programming problems from experienced developers.',
    purpose: 'Help each other solve coding challenges and learn best practices.',
    template: 'opensource',
  },
];

const USERS = [
  { username: 'sarah_chen', email: 'sarah@example.com', displayName: 'Sarah Chen', bio: 'Full-stack developer. Building tools for creators.', password: 'password123' },
  { username: 'alex_rivera', email: 'alex@example.com', displayName: 'Alex Rivera', bio: 'Indie maker. Currently building a note-taking app.', password: 'password123' },
  { username: 'jordan_park', email: 'jordan@example.com', displayName: 'Jordan Park', bio: 'Product designer. Passionate about accessibility.', password: 'password123' },
  { username: 'taylor_brown', email: 'taylor@example.com', displayName: 'Taylor Brown', bio: 'Marketing strategist for startups.', password: 'password123' },
  { username: 'casey_morgan', email: 'casey@example.com', displayName: 'Casey Morgan', bio: 'Software engineer. Open source contributor.', password: 'password123' },
  { username: 'drew_wilson', email: 'drew@example.com', displayName: 'Drew Wilson', bio: 'Backend developer. Rust enthusiast.', password: 'password123' },
  { username: 'jamie_lee', email: 'jamie@example.com', displayName: 'Jamie Lee', bio: 'Data scientist. Building ML-powered tools.', password: 'password123' },
  { username: 'riley_johnson', email: 'riley@example.com', displayName: 'Riley Johnson', bio: 'DevOps engineer. Automating everything.', password: 'password123' },
  { username: 'morgan_adams', email: 'morgan@example.com', displayName: 'Morgan Adams', bio: 'Frontend developer. React and Vue enthusiast.', password: 'password123' },
  { username: 'sam_collins', email: 'sam@example.com', displayName: 'Sam Collins', bio: 'Writer and content creator.', password: 'password123' },
  { username: 'quinn_parker', email: 'quinn@example.com', displayName: 'Quinn Parker', bio: 'Mobile developer. Flutter and Kotlin.', password: 'password123' },
  { username: 'avery_brooks', email: 'avery@example.com', displayName: 'Avery Brooks', bio: 'Tech entrepreneur. 2x founder.', password: 'password123' },
  { username: 'blake_reed', email: 'blake@example.com', displayName: 'Blake Reed', bio: 'Cybersecurity researcher.', password: 'password123' },
  { username: 'cameron_lee', email: 'cameron@example.com', displayName: 'Cameron Lee', bio: 'Data engineer. Python and SQL.', password: 'password123' },
  { username: 'dakota_smith', email: 'dakota@example.com', displayName: 'Dakota Smith', bio: 'UX researcher. Design thinking practitioner.', password: 'password123' },
  { username: 'emerson_tate', email: 'emerson@example.com', displayName: 'Emerson Tate', bio: 'DevOps engineer. Kubernetes enthusiast.', password: 'password123' },
  { username: 'finley_gray', email: 'finley@example.com', displayName: 'Finley Gray', bio: 'Product manager. Building developer tools.', password: 'password123' },
  { username: 'harper_james', email: 'harper@example.com', displayName: 'Harper James', bio: 'Technical writer. Documentation advocate.', password: 'password123' },
  { username: 'jordan_wells', email: 'jordanw@example.com', displayName: 'Jordan Wells', bio: 'AI researcher. NLP and ethics.', password: 'password123' },
  { username: 'kelly_quinn', email: 'kelly@example.com', displayName: 'Kelly Quinn', bio: 'Open source maintainer. Three popular npm packages.', password: 'password123' },
  { username: 'logan_frost', email: 'logan@example.com', displayName: 'Logan Frost', bio: 'Startup advisor. Former CTO.', password: 'password123' },
  { username: 'marley_moore', email: 'marley@example.com', displayName: 'Marley Moore', bio: 'Community manager. Building inclusive spaces.', password: 'password123' },
  { username: 'nicky_patil', email: 'nicky@example.com', displayName: 'Nicky Patil', bio: 'Backend engineer. Go and microservices.', password: 'password123' },
  { username: 'parker_jones', email: 'parker@example.com', displayName: 'Parker Jones', bio: 'Game developer. Unity and C#.', password: 'password123' },
  { username: 'reese_taylor', email: 'reese@example.com', displayName: 'Reese Taylor', bio: 'Design engineer. Design systems.', password: 'password123' },
  { username: 'skyler_wang', email: 'skyler@example.com', displayName: 'Skyler Wang', bio: 'Cloud architect. AWS and GCP.', password: 'password123' },
  { username: 'tracy_adler', email: 'tracy@example.com', displayName: 'Tracy Adler', bio: 'Accessibility specialist. WCAG auditor.', password: 'password123' },
  { username: 'val_keller', email: 'val@example.com', displayName: 'Val Keller', bio: 'Blockchain developer. Web3 enthusiast.', password: 'password123' },
  { username: 'wren_fisher', email: 'wren@example.com', displayName: 'Wren Fisher', bio: 'Technical recruiter. Matching great engineers.', password: 'password123' },
  { username: 'zoe_martinez', email: 'zoe@example.com', displayName: 'Zoe Martinez', bio: 'Engineering manager. Growing diverse teams.', password: 'password123' },
];

const RULES = [
  { title: 'Be Respectful', summary: 'Treat everyone with respect. No personal attacks or harassment.', purpose: 'Maintain a welcoming environment.', severity: 'critical', keywords: ['insult', 'attack', 'harass'] },
  { title: 'Stay On Topic', summary: 'Keep posts relevant to the community purpose.', purpose: 'Ensure content is useful to members.', severity: 'standard', keywords: ['off-topic'] },
  { title: 'No Spam', summary: 'Do not post promotional content without context.', purpose: 'Prevent commercialization of the space.', severity: 'standard', keywords: ['buy now', 'click here', 'subscribe'] },
  { title: 'Share Sources', summary: 'Cite sources when making factual claims.', purpose: 'Maintain information quality.', severity: 'minor', keywords: ['study shows', 'research says', 'according to'] },
  { title: 'Constructive Feedback', summary: 'Provide feedback that helps improve, not just criticism.', purpose: 'Foster growth-oriented discussions.', severity: 'standard', keywords: ['terrible', 'awful', 'worst'] },
  { title: 'No Self-Promotion', summary: 'Share your work only in designated spaces.', purpose: 'Prevent the community from becoming a marketing channel.', severity: 'minor', keywords: ['check out my', 'buy my', 'use my'] },
];

const POSTS = [
  { title: 'How I grew my side project to $10k MRR', content: "I've been building my note-taking app for 18 months. Here's what I learned about product-market fit, pricing, and marketing. The biggest lesson: talk to your users before building features.\n\nI started with a simple markdown editor. Users kept asking for folders. I added folders. Then they wanted tags. Then collaboration. Each feature took me further from the core value.\n\nThe breakthrough came when I stopped adding features and started understanding why people used the app. Turns out, they didn't want a note-taking app. They wanted a thinking tool. That insight changed everything.", postType: 'guide', tags: ['growth', 'lessons'] },
  { title: 'What tools do you use for your indie business?', content: "I'm curious what tools other indie makers use for their businesses. I'll start:\n\n- **Notion**: Documentation and planning\n- **Figma**: Design\n- **Vercel**: Hosting\n- **Stripe**: Payments\n- **Linear**: Issue tracking\n\nWhat are your essentials?", postType: 'discussion', tags: ['tools', 'resources'] },
  { title: 'My product failed. Here is what I learned.', content: "After 6 months of building, I shut down my SaaS product last week. It had 150 users, $500 MRR, but I was burning out.\n\nThe problem wasn't the product. It was me. I built what I wanted, not what the market needed. I spent months on features nobody used.\n\nIf you're just starting out, here's my advice: validate first, build second. Talk to 50 potential users before writing a line of code.", postType: 'discussion', tags: ['failure', 'lessons'] },
  { title: 'Best practices for accessible web design?', content: "I'm working on making my app more accessible. What are the most important things to focus on? I've already added:\n\n- Alt text for images\n- Keyboard navigation\n- High contrast mode\n\nWhat else should I consider?", postType: 'question', tags: ['accessibility', 'design'] },
  { title: 'Weekly check-in: What are you working on?', content: "It's Monday! Share what you're working on this week. Big or small, we'd love to hear about it.\n\nI'm working on adding real-time collaboration to my note-taking app. Should be interesting!", postType: 'announcement', tags: ['check-in', 'weekly'] },
  { title: 'The case for boring technology', content: "I've been thinking about the hype cycle in tech. We chase new frameworks, new databases, new architectures. But the most successful products I've built used boring, proven technology.\n\nPostgreSQL over MongoDB. Rails over the latest framework. jQuery (sometimes) over React.\n\nWhat do you think? Is there value in choosing boring technology?", postType: 'discussion', tags: ['technology', 'philosophy'] },
  { title: 'How to price your SaaS product', content: "Pricing is hard. Here's a framework I use:\n\n1. **Value-based pricing**: What's the value to the customer?\n2. **Competitor analysis**: What do others charge?\n3. **Cost-plus**: What do you need to charge to survive?\n\nMost indie makers undercharge. Don't be afraid to charge what you're worth.", postType: 'guide', tags: ['pricing', 'strategy'] },
  { title: 'Free design resources for indie makers', content: "I've compiled a list of free design resources that I use regularly:\n\n- **Unsplash**: Free photos\n- **Pexels**: Free videos\n- **Google Fonts**: Free fonts\n- **Heroicons**: Free icons\n- **Tailwind CSS**: Free CSS framework\n\nHope this helps someone!", postType: 'guide', tags: ['resources', 'design'] },
  { title: 'Burnout is real. How do you cope?', content: "I've been working 12-hour days for months. I know it's not sustainable, but I feel guilty when I'm not working. How do other indie makers handle burnout?\n\nI've tried:\n- Taking weekends off (felt anxious)\n- Exercise (helps temporarily)\n- Meditation (can't focus)\n\nWhat actually works for you?", postType: 'question', tags: ['burnout', 'wellness'] },
  { title: 'My landing page got 10k visitors. Here is how.', content: "I launched my landing page last month and got 10,000 visitors. Here's what worked:\n\n1. **Product Hunt launch**: Got 2,000 visitors\n2. **Reddit posts**: Got 3,000 visitors\n3. **Twitter thread**: Got 2,500 visitors\n4. **Hacker News**: Got 1,500 visitors\n5. **Indie Hackers**: Got 1,000 visitors\n\nThe key: I didn't just post links. I shared my story and engaged with the communities.", postType: 'guide', tags: ['marketing', 'growth'] },
  { title: 'Why I switched from React to Svelte', content: "After three years with React, I decided to give Svelte a try for my latest project. Here's what surprised me:\n\n1. Less boilerplate\n2. Faster compile times\n3. Smaller bundle sizes\n4. Reactive declarations are intuitive\n\nI still use React for work, but Svelte is now my go-to for personal projects.", postType: 'discussion', tags: ['frontend', 'frameworks'] },
  { title: 'Tips for effective code reviews', content: "Code review can be one of the most valuable practices in software development, but only if done well. Here are my tips:\n\n- Review in small batches (under 400 lines)\n- Focus on logic, not style (use linters for style)\n- Ask questions instead of making demands\n- Celebrate good solutions, not just catch bugs", postType: 'guide', tags: ['best-practices', 'teamwork'] },
  { title: 'How I reduced my AWS bill by 60%', content: "I was spending $800/month on AWS for a side project. After a weekend of optimization, I got it down to $320. Here's how:\n\n1. Right-sized EC2 instances\n2. Moved to spot instances for non-critical workloads\n3. Set up S3 lifecycle policies\n4. Used CloudFront for static assets\n5. Turned off dev environments on weekends", postType: 'guide', tags: ['cloud', 'optimization'] },
  { title: 'Is GraphQL worth the complexity?', content: "I've been using GraphQL for two years now. The developer experience is amazing, but I'm starting to question whether it's overkill for most projects.\n\nFor simple CRUD apps, REST is fine. For complex data requirements with multiple clients, GraphQL shines. But there's a real complexity cost.\n\nWhat's your experience?", postType: 'discussion', tags: ['graphql', 'api'] },
  { title: 'Building in public: Week 1', content: "I'm committing to building in public for the next 12 weeks. I'm working on a CLI tool for project scaffolding.\n\nThis week:\n- Set up the project structure\n- Wrote the basic CLI parser\n- Implemented three templates\n\nNext week:\n- Add template variables\n- Write tests\n- Create documentation", postType: 'text', tags: ['build-in-public', 'cli'] },
  { title: 'How do you handle imposter syndrome?', content: "I've been a professional developer for 5 years and I still feel like I don't know what I'm doing. Every time I start a new project, I feel like a fraud.\n\nI know this is common, but I'd love to hear how others cope with it. Does it ever go away?", postType: 'question', tags: ['career', 'mental-health'] },
  { title: 'The best books I read this year', content: "Here are the books that had the biggest impact on me this year:\n\n1. **The Pragmatic Programmer** - Timeless advice\n2. **Staff Engineer** - Great for career growth\n3. **Designing Data-Intensive Applications** - Deep and practical\n4. **Atomic Habits** - Changed how I work\n5. **The Mom Test** - Essential for product validation\n\nWhat books would you recommend?", postType: 'discussion', tags: ['books', 'learning'] },
  { title: 'Docker compose for local development', content: "I finally set up docker-compose for my local dev environment and it's a game changer.\n\nNo more \"it works on my machine\". No more installing databases locally. No more conflicting versions.\n\nHere's my setup:\n```yaml\nversion: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - \"3000:3000\"\n    depends_on:\n      - db\n  db:\n    image: postgres:15\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n```", postType: 'guide', tags: ['docker', 'dev-tools'] },
  { title: 'How to give good technical talks', content: "I've given 15 conference talks over the past 3 years. Here's what I've learned:\n\n1. **Start with the problem**, not the solution\n2. **Tell stories**, don't just present facts\n3. **Live demos will fail** - pre-record them\n4. **Practice out loud** at least 3 times\n5. **Leave time for questions** - it's the most valuable part", postType: 'guide', tags: ['speaking', 'career'] },
  { title: 'Monthly sustainability challenge: Zero waste kitchen', content: "This month I'm challenging myself to produce zero kitchen waste. Here are the rules:\n\n1. No plastic packaging for food\n2. Compost all food scraps\n3. Use reusable containers only\n4. Buy in bulk when possible\n5. Grow some herbs at home\n\nAnyone want to join me?", postType: 'discussion', tags: ['sustainability', 'challenge'] },
  { title: 'What is the best way to reduce plastic use?', content: "I'm trying to reduce my plastic footprint but it's harder than I thought. Everything seems to come in plastic.\n\nWhat are the most impactful changes I can make? I've already switched to reusable bags and water bottles.", postType: 'question', tags: ['plastic', 'sustainability'] },
  { title: 'Solar panel installation experience', content: "I finally got solar panels installed on my house. Here's the process:\n\n1. Got quotes from 5 installers\n2. Chose a local company with good reviews\n3. Installation took 2 days\n4. Inspection and grid connection took 2 weeks\n\nThe system is 6kW and I'm already seeing savings. Payback period is about 7 years.", postType: 'guide', tags: ['solar', 'energy'] },
  { title: 'How to start composting at home', content: "Composting is easier than you think. Here's how to start:\n\n**What you need:**\n- A bin or pile\n- Green materials (kitchen scraps)\n- Brown materials (leaves, paper)\n- Water\n- Air\n\n**What NOT to compost:**\n- Meat and dairy\n- Oily foods\n- Diseased plants\n\nStart small. A simple pile in the corner of your yard works fine.", postType: 'guide', tags: ['composting', 'garden'] },
  { title: 'Electric car after 6 months: Honest review', content: "I've had my EV for 6 months and 10,000 miles. Here's the honest truth:\n\n**Pros:**\n- Cheaper to run ($40/month vs $200 for gas)\n- Quieter\n- Less maintenance\n- Instant torque is fun\n\n**Cons:**\n- Charging infrastructure is inconsistent\n- Road trips require planning\n- Upfront cost is higher\n\nOverall: Would do it again, but only if you have home charging.", postType: 'discussion', tags: ['ev', 'sustainability'] },
  { title: 'Sustainable fashion: Building a capsule wardrobe', content: "I've been working on building a capsule wardrobe for the past year. The idea is to own fewer, higher-quality pieces that mix and match.\n\nMy rules:\n- 33 items total (including shoes)\n- All natural fibers\n- Buy used when possible\n- One in, one out\n\nIt's simplified my life and reduced my fashion footprint significantly.", postType: 'guide', tags: ['fashion', 'minimalism'] },
  { title: 'How to talk to family about climate change', content: "I struggle to talk about climate change with my family without it turning into an argument. They're skeptical and I don't want to damage our relationship.\n\nAny advice on how to have productive conversations about this?", postType: 'question', tags: ['climate', 'communication'] },
  { title: 'Rainwater harvesting setup guide', content: "I set up a rainwater harvesting system last spring. Here's what I learned:\n\n**Parts needed:**\n- Gutters and downspouts\n- First flush diverter\n- Storage tank\n- Pump\n- Filtration\n\nI collected 2,000 gallons over the summer, which covered all my garden watering needs.", postType: 'guide', tags: ['water', 'diy'] },
  { title: 'Meal prep for reducing food waste', content: "I've been meal prepping for 3 months and my food waste has dropped dramatically. Here's my system:\n\nSunday: Plan meals, shop, prep\n- Wash and chop all vegetables\n- Cook grains and proteins\n- Portion into containers\n\nHaving prepped ingredients makes it easy to cook during the week instead of ordering takeout.", postType: 'guide', tags: ['food', 'meal-prep'] },
  { title: 'Best way to learn Rust in 2025?', content: "I want to learn Rust this year. I have experience with C++ and Python. What's the best path?\n\nI've heard good things about:\n- The Rust Book\n- Rustlings\n- Exercism\n\nWhat worked for you?", postType: 'question', tags: ['rust', 'learning'] },
  { title: 'Microservices vs monolith: When to use which?', content: "I keep seeing teams jump to microservices when a monolith would work fine. Here's my rule of thumb:\n\n**Use a monolith when:**\n- Team has fewer than 10 developers\n- Domain is well-understood\n- You need to move fast\n\n**Use microservices when:**\n- Multiple teams need to work independently\n- Different scaling requirements\n- Polyglot persistence makes sense\n\nWhat's your experience?", postType: 'discussion', tags: ['architecture', 'microservices'] },
  { title: 'My Neovim setup after switching from VS Code', content: "I switched from VS Code to Neovim 6 months ago. Here's my current setup:\n\n**Plugins:**\n- lazy.nvim (package manager)\n- telescope.nvim (search)\n- treesitter (syntax)\n- lspconfig (language support)\n- cmp (autocomplete)\n\n**Pros:** Blazing fast, keyboard-driven, lightweight\n**Cons:** Configuration takes time, some things are harder\n\nWorth it? For me, yes. But only if you enjoy tinkering with your editor.", postType: 'guide', tags: ['neovim', 'tools'] },
  { title: 'How do you stay focused while working remote?', content: "I've been working remote for 3 years. My biggest challenge is staying focused. Here's what I've tried:\n\n- Pomodoro technique\n- Blocking distracting websites\n- Having a dedicated workspace\n- Setting daily goals\n\nWhat strategies work for you?", postType: 'question', tags: ['remote', 'productivity'] },
  { title: 'Understanding JavaScript Promises', content: "Promises can be confusing at first. Here's a simple mental model:\n\nA Promise is like ordering food at a restaurant:\n1. You place an order (create a Promise)\n2. The kitchen starts cooking (pending)\n3. Food arrives (resolved)\n4. Or something goes wrong (rejected)\n\n```javascript\nconst order = new Promise((resolve, reject) => {\n  cookFood().then(resolve).catch(reject)\n})\norder.then(food => eat(food)).catch(err => complain(err))\n```", postType: 'guide', tags: ['javascript', 'tutorial'] },
  { title: 'The worst code I wrote this year', content: "Let's share our worst code and learn from it. I'll go first:\n\n```javascript\nfunction processData(data) {\n  let result = [];\n  for (let i = 0; i < data.length; i++) {\n    for (let j = 0; j < data[i].items.length; j++) {\n      for (let k = 0; k < 100; k++) {\n        result.push(data[i].items[j] * k);\n      }\n    }\n  }\n  return result;\n}\n```\n\nO(n*m*100) complexity. What was I thinking?", postType: 'discussion', tags: ['funny', 'code-quality'] },
  { title: 'Deploying a Node.js app to production', content: "A quick guide to deploying Node.js apps:\n\n1. Use a process manager (PM2)\n2. Set up a reverse proxy (Nginx)\n3. Enable HTTPS (Let's Encrypt)\n4. Set up logging (Winston)\n5. Monitor (PM2 metrics or similar)\n6. Have a rollback plan\n\nEach step is important. Don't skip monitoring - that's how you wake up to a crashed server at 3 AM.", postType: 'guide', tags: ['devops', 'nodejs'] },
  { title: 'Should I learn TypeScript in 2025?', content: "Short answer: Yes.\n\nLong answer: TypeScript has become the standard for professional JavaScript development. It catches bugs early, improves IDE support, and makes code easier to refactor.\n\nThat said, for quick scripts and prototypes, plain JS is still fine. The key is knowing when to reach for which tool.", postType: 'discussion', tags: ['typescript', 'javascript'] },
  { title: 'Building a REST API with Go', content: "I've been building APIs with Go for the past year. Here's my stack:\n\n- **Router**: chi\n- **Database**: sqlx with PostgreSQL\n- **Auth**: JWT with middleware\n- **Validation**: go-playground/validator\n\nWhy Go? Fast compile times, great standard library, excellent concurrency, and single binary deployments.", postType: 'guide', tags: ['go', 'backend'] },
  { title: 'How to conduct effective 1:1 meetings', content: "As an engineering manager, I've learned that good 1:1s are the foundation of a healthy team. Here's my format:\n\n**Every week:**\n- What's going well?\n- What's blocked?\n- How are you feeling?\n\n**Monthly:**\n- Career growth discussion\n- Feedback (both ways)\n- Long-term planning", postType: 'guide', tags: ['management', 'leadership'] },
  { title: 'Why you should write integration tests', content: "Unit tests are great, but integration tests catch the bugs that matter. Here's why:\n\n1. They test real interactions between components\n2. They catch database schema issues\n3. They validate API contracts\n4. They test error handling end-to-end\n\nMy rule: 70% integration, 20% unit, 10% e2e.", postType: 'discussion', tags: ['testing', 'quality'] },
  { title: 'Command line tools I cannot live without', content: "My essential CLI tools:\n\n- **fzf**: Fuzzy finder\n- **ripgrep**: Fast search\n- **jq**: JSON processor\n- **htop**: Process monitoring\n- **tmux**: Terminal multiplexer\n- **bat**: Cat with syntax highlighting\n- **fd**: Fast file finder\n\nWhat are yours?", postType: 'discussion', tags: ['cli', 'productivity'] },
  { title: 'Learning functional programming concepts', content: "I've been exploring functional programming. Here are the concepts that changed how I write code:\n\n1. **Immutability**: Don't mutate, transform\n2. **Pure functions**: Same input, same output\n3. **Function composition**: Build complex behavior from simple functions\n4. **Monads** (still learning this one)\n\nEven in OOP languages, these concepts make code more predictable and testable.", postType: 'guide', tags: ['functional', 'programming'] },
  { title: 'How to negotiate your salary', content: "After 10 years in tech, here's what I've learned about negotiation:\n\n1. **Do research first** - Levels.fyi, Glassdoor, Blind\n2. **Never give the first number**\n3. **Focus on total compensation** (salary, equity, bonus, benefits)\n4. **Have other options** - leverage is everything\n5. **Be willing to walk away**\n\nThe best time to negotiate is when you have another offer.", postType: 'guide', tags: ['career', 'salary'] },
  { title: 'Open source contribution: A beginner guide', content: "Want to contribute to open source but don't know where to start?\n\n1. Find projects you actually use\n2. Look for 'good first issue' labels\n3. Read the contributing guidelines\n4. Start with documentation improvements\n5. Fix a small bug\n6. Submit your PR\n\nIt's scary the first time. It gets easier. The community is generally welcoming.", postType: 'guide', tags: ['opensource', 'beginners'] },
  { title: 'CSS Grid tricks I wish I knew earlier', content: "CSS Grid has been a game changer for layout. Here are some things I wish I knew sooner:\n\n```css\n/* Auto-fill responsive grid */\ngrid-template-columns: repeat(auto-fill, minmax(250px, 1fr));\n\n/* Centering (finally easy!) */\nplace-items: center;\n\n/* Named grid areas */\ngrid-template-areas:\n  'header header'\n  'sidebar main'\n  'footer footer';\n```", postType: 'guide', tags: ['css', 'frontend'] },
  { title: 'What I wish I knew before starting my PhD', content: "I'm in my third year of a CS PhD. Here are things I wish someone had told me:\n\n1. The first year is the hardest\n2. Your advisor is the most important decision\n3. Publish early, publish often\n4. Imposter syndrome is universal\n5. Take care of your mental health\n\nA PhD is a marathon, not a sprint.", postType: 'discussion', tags: ['phd', 'academia'] },
  { title: 'Building a personal website with Astro', content: "I rebuilt my personal site with Astro and I'm loving it. Here's why:\n\n- Zero JS by default (fast!) \n- Island architecture (interactive only where needed)\n- Markdown content with MDX\n- Easy to deploy anywhere\n\nMy stack: Astro + Tailwind + Netlify\nBuild time: 0.3 seconds for 20 pages.", postType: 'guide', tags: ['astro', 'web'] },
  { title: 'Technical debt: When to pay it off', content: "Not all technical debt is bad. Intentional debt with a plan to repay is a strategic decision.\n\n**Pay off when:**\n- It's slowing down development\n- It's causing bugs\n- The team is spending too much time working around it\n\n**Keep when:**\n- You're still validating product-market fit\n- The feature is rarely touched\n- The cost of refactoring exceeds the benefit", postType: 'discussion', tags: ['engineering', 'strategy'] },
  { title: 'How to debug effectively', content: "Debugging is a skill that improves with practice. Here's my process:\n\n1. **Reproduce consistently** - Can't fix what you can't see\n2. **Isolate variables** - Change one thing at a time\n3. **Read the error message** carefully\n4. **Binary search** - Comment out half the code\n5. **Rubber duck** - Explain it to someone or something\n6. **Take breaks** - Walk away and come back", postType: 'guide', tags: ['debugging', 'skills'] },
  { title: 'My experience with ADHD as a developer', content: "I was diagnosed with ADHD last year at age 32. It explained so much about my career:\n\n- Difficulty finishing side projects\n- Context switching between tasks\n- Hyperfocus on interesting problems\n- Procrastination on documentation\n\nGetting treatment and developing systems has been life-changing. Anyone else have similar experiences?", postType: 'discussion', tags: ['adhd', 'mental-health'] },
  { title: 'Zero waste bathroom: What I switched', content: "I've been working on making my bathroom zero waste. Here are the swaps I've made:\n\n- Shampoo bars instead of bottles\n- Safety razor instead of disposable\n- Bamboo toothbrush\n- DIY deodorant\n- Cloth instead of cotton pads\n\nIt's not perfect, but it's progress. Every swap reduces plastic waste.", postType: 'guide', tags: ['zero-waste', 'bathroom'] },
  { title: 'Bike commuting: A practical guide', content: "I've been bike commuting for 2 years. Here's what you need to know:\n\n**Gear:**\n- Reliable bike (doesn't need to be expensive)\n- Good lights (front and rear)\n- Fenders (for wet weather)\n- Lock (U-lock + cable)\n- Panniers (backpack gets sweaty)\n\n**Tips:**\n- Start with 1-2 days a week\n- Have a backup plan for bad weather\n- Shower at work or find a route with fewer hills", postType: 'guide', tags: ['bike', 'commuting'] },
  { title: 'How to read research papers efficiently', content: "Reading academic papers is a skill. Here's my approach:\n\n1. **Read the abstract** - Should I read this?\n2. **Skim the introduction and conclusion** - What did they do?\n3. **Look at the figures** - What are the key results?\n4. **Read the methodology** - Can I trust the results?\n5. **Full read** - Only if it passes steps 1-4\n\nMost papers, I only do steps 1-2. Life is too short.", postType: 'guide', tags: ['research', 'productivity'] },
];

const COMMENT_TEXTS = [
  "This is really helpful, thanks for sharing!",
  "I had a similar experience. What worked for me was focusing on one thing at a time.",
  "Great point! I would add that communication is key.",
  "Thanks for the honest perspective. It is refreshing.",
  "I disagree. I think the opposite is true in most cases.",
  "This is exactly what I needed to hear today.",
  "Have you tried using a different approach? I found that X worked better.",
  "Love this! Can you share more details about how you implemented it?",
  "I have been thinking about this too. My take is that we should focus on the fundamentals.",
  "Solid advice. Bookmarked for later.",
  "This changed my perspective on the topic. Thank you.",
  "Interesting take. I would push back on point 3 though.",
  "Can you elaborate on the first point? I am curious how you arrived at that conclusion.",
  "I tried something similar and it did not work for me. Glad it worked for you though.",
  "The key insight here is really about understanding your users. Everything else follows.",
  "This deserves more upvotes. Seriously underrated post.",
  "I have been doing this for years and can confirm it works.",
  "Great writeup! Added to my reading list.",
  "One thing I would add: start small and iterate. Perfection is the enemy of progress.",
  "This reminds me of a talk I saw last year. The speaker made similar points about sustainability.",
  "Question: how do you handle edge cases? I ran into issues with large datasets.",
  "I appreciate the nuance in this post. It is not as simple as people make it seem.",
  "Bookmarking this for my team. We have been discussing this exact issue.",
  "The comparison table really helps visualize the differences. Thanks for putting this together.",
  "I have mixed feelings about this. On one hand, the approach is sound. On the other, there are edge cases.",
  "This is the kind of content I come here for. Practical, actionable advice.",
  "Could you share the specific tools you used? I am looking to set up something similar.",
  "I love how you broke this down. Makes a complex topic accessible.",
  "Been there, done that. My advice: stick with it, it gets better.",
  "Great discussion! I would love to see more posts like this.",
  "This resonated with me deeply. Thank you for sharing your experience.",
  "I respectfully disagree with the premise. Let me explain why...",
  "Thanks for the detailed write-up. This will save me hours of research.",
  "The real lesson here is about listening to feedback. Everything else is execution.",
  "I wish I had read this a year ago. Would have saved me from making the same mistake.",
];

function seed() {
  console.log('Seeding database...');

  db.exec('DELETE FROM feature_flags');
  db.exec('DELETE FROM audit_log');
  db.exec('DELETE FROM notifications');
  db.exec('DELETE FROM proposal_votes');
  db.exec('DELETE FROM proposals');
  db.exec('DELETE FROM appeals');
  db.exec('DELETE FROM decisions');
  db.exec('DELETE FROM moderation_cases');
  db.exec('DELETE FROM reports');
  db.exec('DELETE FROM post_tags');
  db.exec('DELETE FROM tags');
  db.exec('DELETE FROM reactions');
  db.exec('DELETE FROM comments');
  db.exec('DELETE FROM posts');
  db.exec('DELETE FROM rules');
  db.exec('DELETE FROM constitutions');
  db.exec('DELETE FROM community_members');
  db.exec('DELETE FROM communities');
  db.exec('DELETE FROM users');

  const insertUser = db.prepare('INSERT INTO users (username, email, password_hash, display_name, bio, email_verified, reputation, trust_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertCommunity = db.prepare('INSERT INTO communities (name, slug, description, purpose, template, created_by) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMember = db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)');
  const insertConstitution = db.prepare("INSERT INTO constitutions (community_id, version, status, created_by, effective_at) VALUES (?, ?, ?, ?, datetime('now'))");
  const insertRule = db.prepare('INSERT INTO rules (constitution_id, rule_number, title, summary, purpose, severity, keywords) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertPost = db.prepare("INSERT INTO posts (community_id, user_id, title, content, post_type, status, ai_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))");
  const insertTag = db.prepare('INSERT INTO tags (community_id, name) VALUES (?, ?)');
  const insertPostTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)');
  const insertComment = db.prepare("INSERT INTO comments (post_id, user_id, content, status, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))");
  const insertCase = db.prepare("INSERT INTO moderation_cases (community_id, case_type, status, priority, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))");
  const insertDecision = db.prepare("INSERT INTO decisions (case_id, decision, rationale, decided_by, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))");
  const insertAppeal = db.prepare("INSERT INTO appeals (case_id, decision_id, user_id, ground, explanation, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))");
  const insertProposal = db.prepare("INSERT INTO proposals (community_id, proposer_id, title, description, proposed_text, motivation, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))");
  const insertProposalVote = db.prepare('INSERT OR IGNORE INTO proposal_votes (proposal_id, user_id, vote, rationale) VALUES (?, ?, ?, ?)');
  const insertNotification = db.prepare("INSERT INTO notifications (user_id, notification_type, title, message, link, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))");

  const transaction = db.transaction(() => {
    const userIds = [];
    for (const user of USERS) {
      const hash = bcrypt.hashSync(user.password, 10);
      const result = insertUser.run(user.username, user.email, hash, user.displayName, user.bio, 1, Math.floor(Math.random() * 200), Math.floor(Math.random() * 4));
      userIds.push(result.lastInsertRowid);
    }

    const communityIds = [];
    for (const comm of COMMUNITIES) {
      const result = insertCommunity.run(comm.name, comm.slug, comm.description, comm.purpose, comm.template, userIds[0]);
      communityIds.push(result.lastInsertRowid);
    }

    for (let i = 0; i < communityIds.length; i++) {
      insertMember.run(communityIds[i], userIds[0], 'owner');
      insertMember.run(communityIds[i], userIds[1], 'admin');
      for (let j = 2; j < userIds.length; j++) {
        if (Math.random() > 0.25) {
          insertMember.run(communityIds[i], userIds[j], j < 5 ? 'moderator' : 'member');
        }
      }
    }

    for (const commId of communityIds) {
      const constResult = insertConstitution.run(commId, 1, 'active', userIds[0]);
      const constId = constResult.lastInsertRowid;

      for (let i = 0; i < RULES.length; i++) {
        const rule = RULES[i];
        insertRule.run(constId, i + 1, rule.title, rule.summary, rule.purpose, rule.severity, JSON.stringify(rule.keywords));
      }
    }

    const usedTitles = new Set();
    for (let i = 0; i < POSTS.length; i++) {
      const post = POSTS[i];
      if (usedTitles.has(post.title)) continue;
      usedTitles.add(post.title);

      const randomUser = userIds[Math.floor(Math.random() * userIds.length)];
      const randomCommunity = communityIds[Math.floor(Math.random() * communityIds.length)];
      const daysAgo = -Math.floor(Math.random() * 45);
      const statusRoll = Math.random();
      let status;
      if (statusRoll > 0.12) status = 'approved';
      else if (statusRoll > 0.05) status = 'pending';
      else status = 'rejected';

      insertPost.run(randomCommunity, randomUser, post.title, post.content, post.postType, status, (Math.random() * 0.3).toFixed(2), `${daysAgo} days`);

      const postId = db.prepare('SELECT last_insert_rowid() as id').get().id;

      for (const tagName of post.tags) {
        let tag = db.prepare('SELECT id FROM tags WHERE community_id = ? AND name = ?').get(randomCommunity, tagName);
        if (!tag) {
          const tagResult = insertTag.run(randomCommunity, tagName);
          tag = { id: tagResult.lastInsertRowid };
        }
        insertPostTag.run(postId, tag.id);
      }
    }

    const allPostIds = db.prepare('SELECT id FROM posts').all().map(p => p.id);
    for (let i = 0; i < 100 && i < allPostIds.length * 3; i++) {
      const postId = allPostIds[Math.floor(Math.random() * allPostIds.length)];
      const randomUser = userIds[Math.floor(Math.random() * userIds.length)];
      const randomComment = COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];
      const daysAgo = -Math.floor(Math.random() * 40);
      const approved = Math.random() > 0.08;
      insertComment.run(postId, randomUser, randomComment, approved ? 'approved' : 'pending', `${daysAgo} days`);
    }

    const caseTypes = ['content', 'content', 'content', 'behavior', 'spam'];
    const priorities = ['normal', 'normal', 'high', 'normal', 'low'];
    for (let i = 0; i < 12; i++) {
      const randomCommunity = communityIds[Math.floor(Math.random() * communityIds.length)];
      const daysAgo = -Math.floor(Math.random() * 30);
      const status = i < 8 ? 'decided' : 'open';
      insertCase.run(randomCommunity, caseTypes[i % caseTypes.length], status, priorities[i % priorities.length], `${daysAgo} days`);

      const caseId = db.prepare('SELECT last_insert_rowid() as id').get().id;

      if (status === 'decided') {
        const decisions = ['approved', 'rejected', 'approved', 'approved_with_reminder', 'rejected'];
        const rationales = [
          'Content follows community guidelines and adds value to the discussion.',
          'This content violates Rule 1 (Be Respectful). The language used targets another member personally.',
          'Content is appropriate and on-topic. Approved.',
          'Content is acceptable but could benefit from additional context. Approved with reminder.',
          'This is self-promotional content that does not add value to the community. Violates Rule 3 (No Spam).',
        ];
        const d = decisions[i % decisions.length];
        const r = rationales[i % rationales.length];
        const reviewer = userIds[Math.floor(Math.random() * 5) + 1];
        insertDecision.run(caseId, d, r, reviewer, `${daysAgo + 1} days`);

        if (i >= 3 && i < 7) {
          const decisionId = db.prepare('SELECT last_insert_rowid() as id').get().id;
          const appealGrounds = ['rule_misapplied', 'missing_context', 'disproportional', 'satire_parody'];
          const appealStatuses = ['pending', 'resolved', 'rejected', 'resolved'];
          const resolutions = [
            '',
            'After review, the original decision stands. The content clearly violates the cited rule.',
            '',
            'The appeal is granted. The content was satirical and does not violate community rules.',
          ];
          const aGround = appealGrounds[i % appealGrounds.length];
          const aStatus = appealStatuses[i % appealStatuses.length];
          const aResolution = resolutions[i % resolutions.length];
          const appellant = userIds[Math.floor(Math.random() * 10) + 5];
          insertAppeal.run(caseId, decisionId, appellant, aGround,
            `I believe this decision was incorrect because the content did not actually violate the cited rule. The reviewer may have missed important context about the discussion.`,
            aStatus, `${daysAgo + 2} days`);
          if (aStatus !== 'pending') {
            insertNotification.run(appellant, 'appeal', 'Appeal ' + aStatus,
              'Your appeal has been ' + aStatus + '. ' + (aResolution || 'The original decision was reviewed.'),
              '/appeals', `${daysAgo + 3} days`);
          }
        }
      }
    }

    const proposalData = [
      { title: 'Add a weekly showcase thread', description: 'Create a weekly pinned thread where members can share their projects.', proposed_text: 'The moderation team will create a weekly "Showcase Sunday" thread where members can share what they are building.', motivation: 'This gives members a dedicated space to share without cluttering the main feed.', expected_benefits: 'More engagement, less self-promotion in main feed', possible_harms: 'Could reduce organic sharing', affected_groups: 'All members' },
      { title: 'Update Rule 2: Expand on-topic guidelines', description: 'Clarify what counts as on-topic for the community.', proposed_text: 'Rule 2: Keep posts relevant to the community purpose. Posts about adjacent topics are allowed if they include a clear connection to the community focus.', motivation: 'Currently the rule is too vague and is applied inconsistently.', expected_benefits: 'Clearer expectations for members and moderators', possible_harms: 'May still require moderator judgment', affected_groups: 'New members especially' },
      { title: 'Implement a mentorship program', description: 'Match experienced members with newcomers for 1-on-1 guidance.', proposed_text: 'Members with trust level 3+ can opt in as mentors. New members with trust level 0 can request a mentor. Mentorship lasts 4 weeks.', motivation: 'Help new members integrate and learn community norms faster.', expected_benefits: 'Better retention, faster ramp-up for new members', possible_harms: 'Additional coordination overhead', affected_groups: 'New members and experienced members' },
      { title: 'Reduce promotion threshold to trust level 2', description: 'Allow members to share their own content at a lower trust level.', proposed_text: 'Members with trust level 2 or above may share their own projects in the designated weekly thread.', motivation: 'Encourage more participation from newer members.', expected_benefits: 'More content diversity, faster onboarding', possible_harms: 'Potential increase in low-quality self-promotion', affected_groups: 'Members at trust level 2' },
      { title: 'Add reaction limits per post', description: 'Prevent vote manipulation by limiting reactions.', proposed_text: 'Members may not add more than 10 reactions to a single post within a 24-hour period.', motivation: 'Prevent coordinated reaction campaigns.', expected_benefits: 'Fairer representation of community opinion', possible_harms: 'May limit legitimate enthusiastic responses', affected_groups: 'Power users' },
    ];

    for (let i = 0; i < proposalData.length; i++) {
      const p = proposalData[i];
      const randomCommunity = communityIds[Math.floor(Math.random() * communityIds.length)];
      const proposer = userIds[Math.floor(Math.random() * 10) + 2];
      const daysAgo = -Math.floor(Math.random() * 20) - 5;
      const status = i < 3 ? 'open' : 'passed';
      insertProposal.run(randomCommunity, proposer, p.title, p.description, p.proposed_text, p.motivation, status, `${daysAgo} days`);

      const proposalId = db.prepare('SELECT last_insert_rowid() as id').get().id;

      const votedUserIds = new Set();
      if (status === 'passed') {
        for (let j = 0; j < 8; j++) {
          const voter = userIds[Math.floor(Math.random() * userIds.length)];
          if (votedUserIds.has(voter)) continue;
          votedUserIds.add(voter);
          const vote = Math.random() > 0.2 ? 'support' : 'oppose';
          try { insertProposalVote.run(proposalId, voter, vote, vote === 'support' ? 'This would improve the community.' : 'I have concerns about this change.'); } catch(e) {}
        }
      } else {
        for (let j = 0; j < 4; j++) {
          const voter = userIds[Math.floor(Math.random() * userIds.length)];
          if (votedUserIds.has(voter)) continue;
          votedUserIds.add(voter);
          const vote = ['support', 'oppose', 'abstain'][Math.floor(Math.random() * 3)];
          try { insertProposalVote.run(proposalId, voter, vote, ''); } catch(e) {}
        }
      }
    }

    for (let i = 0; i < 15; i++) {
      const randomUser = userIds[Math.floor(Math.random() * userIds.length)];
      const notifTypes = ['moderation', 'appeal', 'mention', 'reply', 'proposal'];
      const notifType = notifTypes[Math.floor(Math.random() * notifTypes.length)];
      const daysAgo = -Math.floor(Math.random() * 14);
      let title, message, link;
      if (notifType === 'moderation') {
        title = 'Post reviewed';
        message = 'Your post has been reviewed by the community.';
        link = '/moderation';
      } else if (notifType === 'appeal') {
        title = 'Appeal update';
        message = 'There is an update on your appeal.';
        link = '/appeals';
      } else if (notifType === 'mention') {
        title = 'You were mentioned';
        message = 'Someone mentioned you in a post.';
        link = '/c/indie-makers';
      } else if (notifType === 'reply') {
        title = 'New reply';
        message = 'Someone replied to your post.';
        link = '/c/indie-makers';
      } else {
        title = 'Proposal update';
        message = 'A proposal you voted on has been updated.';
        link = '/c/indie-makers/proposals';
      }
      insertNotification.run(randomUser, notifType, title, message, link, `${daysAgo} days`);
    }

    db.prepare('INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES (?, ?, ?)').run('proposals', 1, 'Enable governance proposals');
    db.prepare('INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES (?, ?, ?)').run('appeals', 1, 'Enable appeals system');
    db.prepare('INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES (?, ?, ?)').run('precedents', 1, 'Enable precedent system');
    db.prepare('INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES (?, ?, ?)').run('community_health', 1, 'Enable community health dashboard');
  });

  transaction();
  console.log('Database seeded successfully!');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
