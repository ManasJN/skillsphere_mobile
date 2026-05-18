/**
 * Rule-based career recommendation engine.
 * Structured for future AI API integration (replace generateRecommendations body).
 */

const DOMAIN_TECH = {
  'Web Development': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'REST APIs', 'Git'],
  'Mobile Development': ['JavaScript', 'React Native', 'Flutter', 'Firebase', 'REST APIs'],
  'AI/ML': ['Python', 'NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow', 'Statistics'],
  'Data Science': ['Python', 'SQL', 'Pandas', 'Visualization', 'Statistics', 'Excel'],
  'Cloud & DevOps': ['Linux', 'Docker', 'AWS', 'CI/CD', 'Networking', 'Bash'],
  'Cybersecurity': ['Networking', 'Linux', 'Cryptography', 'OWASP', 'Python scripting'],
  'DSA & Competitive Programming': ['Arrays', 'Trees', 'Graphs', 'DP', 'Greedy', 'C++ or Java'],
  'UI/UX Design': ['Figma', 'User research', 'Wireframing', 'Prototyping', 'Accessibility'],
  'Embedded/IoT': ['C', 'Microcontrollers', 'Sensors', 'RTOS', 'Electronics basics'],
};

const COURSE_CATALOG = {
  'Web Development': [
    { title: 'JavaScript fundamentals', provider: 'MDN / freeCodeCamp', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', weeks: 4 },
    { title: 'React – official docs & tutorials', provider: 'react.dev', url: 'https://react.dev/learn', weeks: 6 },
    { title: 'Node.js & Express basics', provider: 'Node.js docs', url: 'https://nodejs.org/en/learn', weeks: 4 },
  ],
  'AI/ML': [
    { title: 'Python for data analysis', provider: 'freeCodeCamp / Kaggle Learn', url: 'https://www.kaggle.com/learn', weeks: 5 },
    { title: 'Machine learning crash course', provider: 'Google MLCC', url: 'https://developers.google.com/machine-learning/crash-course', weeks: 6 },
  ],
  'DSA & Competitive Programming': [
    { title: 'Striver A2Z DSA sheet', provider: 'takeUforward', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2', weeks: 12 },
    { title: 'LeetCode patterns (NeetCode roadmap)', provider: 'NeetCode', url: 'https://neetcode.io/roadmap', weeks: 8 },
  ],
  'Data Science': [
    { title: 'SQL for data analysis', provider: 'Mode / SQLBolt', url: 'https://sqlbolt.com/', weeks: 3 },
    { title: 'Pandas & visualization', provider: 'Kaggle Learn', url: 'https://www.kaggle.com/learn/pandas', weeks: 4 },
  ],
  'Cloud & DevOps': [
    { title: 'Docker getting started', provider: 'Docker docs', url: 'https://docs.docker.com/get-started/', weeks: 2 },
    { title: 'AWS Cloud Practitioner path', provider: 'AWS Skill Builder', url: 'https://skillbuilder.aws/', weeks: 6 },
  ],
};

const CAREER_PATHS = {
  'Web Development': [
    { title: 'Full-stack web developer', description: 'Build and ship web apps end-to-end.', why: 'Matches your domain focus and project portfolio path.' },
    { title: 'Frontend specialist', description: 'Deep expertise in UI, React, and performance.', why: 'Good if you enjoy visual product work more than backend.' },
  ],
  'AI/ML': [
    { title: 'ML engineer (entry)', description: 'Train models, evaluate metrics, deploy basics.', why: 'Aligns with AI/ML interest and math-heavy coursework.' },
    { title: 'Data analyst → ML track', description: 'Start with analysis, move into modeling.', why: 'Softer ramp if DSA or coding stats are still growing.' },
  ],
  'DSA & Competitive Programming': [
    { title: 'Software engineer (product)', description: 'Strong fundamentals for campus placements.', why: 'Your competitive coding focus supports timed interviews.' },
    { title: 'Problem setter / contest contributor', description: 'Community roles after consistent practice.', why: 'Natural extension if you enjoy contests.' },
  ],
};

const normalize = (s) => (s || '').toLowerCase().trim();

const skillNames = (skills) => skills.map((s) => normalize(s.name));

const hasSkill = (skills, keyword) =>
  skillNames(skills).some((n) => n.includes(normalize(keyword)));

const skillLevel = (skills, keyword) => {
  const sk = skills.find((s) => normalize(s.name).includes(normalize(keyword)));
  return sk?.level ?? 0;
};

const pickCourses = (domain, weakAreas, skills) => {
  const base = COURSE_CATALOG[domain] || COURSE_CATALOG['Web Development'];
  const out = base.slice(0, 3).map((c, i) => ({
    ...c,
    priority: i === 0 ? 'high' : 'medium',
    why: i === 0
      ? 'Core foundation for your chosen domain — start here before jumping to frameworks.'
      : 'Builds on fundamentals already on your profile or fills a gap from your weak areas.',
  }));

  if (weakAreas.some((w) => normalize(w).includes('javascript')) && !hasSkill(skills, 'javascript')) {
    out.unshift({
      title: 'JavaScript deep dive',
      provider: 'javascript.info',
      url: 'https://javascript.info/',
      weeks: 5,
      priority: 'high',
      why: 'You marked JavaScript as a weak area — this should come before React or Node.',
    });
  }
  return out.slice(0, 5);
};

const buildSkillsToImprove = (domain, weakAreas, skills, profile) => {
  const list = [];
  const techStack = DOMAIN_TECH[domain] || DOMAIN_TECH['Web Development'];

  weakAreas.forEach((area) => {
    const key = normalize(area);
    const level = skillLevel(skills, key) || skillLevel(skills, area);
    list.push({
      name: area,
      currentGap: level < 40 ? 'Needs structured practice' : level < 70 ? 'Moderate — push to interview-ready' : 'Maintain with projects',
      why: level < 40
        ? `Listed as a weak area and your tracked level is around ${level}%. Short daily practice will help most.`
        : `You are improving, but interview questions still expect stronger ${area} fundamentals.`,
      priority: level < 40 ? 'high' : 'medium',
      targetLevel: Math.min(100, level + 25),
    });
  });

  techStack.slice(0, 4).forEach((tech) => {
    if (!hasSkill(skills, tech) && list.length < 8) {
      list.push({
        name: tech,
        currentGap: 'Not on your skill list yet',
        why: `Common in ${domain} roles at your stage — adding it keeps your profile aligned with recruiters.`,
        priority: 'medium',
        targetLevel: 60,
      });
    }
  });

  return list.slice(0, 8);
};

const buildRoadmap = (domain, weakAreas) => {
  const primaryWeak = weakAreas[0] || 'core fundamentals';
  const roadmaps = {
    'Web Development': [
      { phase: '1', title: 'Strengthen basics', timeframe: 'Weeks 1–3', tasks: [`Review ${primaryWeak}`, 'Build 2 small static pages', 'Push daily commits to GitHub'] },
      { phase: '2', title: 'Frontend depth', timeframe: 'Weeks 4–8', tasks: ['Learn React components & hooks', 'One mini app (todo, weather, or portfolio)', 'Fix accessibility on one page'] },
      { phase: '3', title: 'Backend & deployment', timeframe: 'Weeks 9–12', tasks: ['Simple REST API with Node/Express', 'Connect to MongoDB', 'Deploy on Render or Vercel'] },
    ],
    'AI/ML': [
      { phase: '1', title: 'Python & math refresh', timeframe: 'Weeks 1–4', tasks: ['NumPy/Pandas exercises', 'Linear algebra revision', 'Kaggle intro competition'] },
      { phase: '2', title: 'Supervised learning', timeframe: 'Weeks 5–8', tasks: ['Scikit-learn pipelines', 'Model evaluation metrics', 'Document one notebook on GitHub'] },
      { phase: '3', title: 'Project & deployment', timeframe: 'Weeks 9–12', tasks: ['End-to-end ML project', 'Simple API or Streamlit app', 'Write a short project report'] },
    ],
    'DSA & Competitive Programming': [
      { phase: '1', title: 'Pattern foundation', timeframe: 'Weeks 1–4', tasks: ['Arrays, hashing, two pointers', '20 easy problems', 'Track time per problem'] },
      { phase: '2', title: 'Core topics', timeframe: 'Weeks 5–8', tasks: ['Trees, graphs, BFS/DFS', '15 medium problems', 'One weekly contest'] },
      { phase: '3', title: 'Interview readiness', timeframe: 'Weeks 9–12', tasks: ['DP introduction', 'Mock interviews', 'Review company-specific tags'] },
    ],
  };

  return roadmaps[domain] || roadmaps['Web Development'];
};

const buildWeaknessAnalysis = (weakAreas, user, skills, goals) => {
  const analysis = weakAreas.map((area) => ({
    area,
    detail: `You flagged ${area} as an area to improve. Pair theory with one small exercise each day rather than long passive videos.`,
    severity: skillLevel(skills, area) < 35 ? 'high' : 'medium',
  }));

  if ((user.cgpa || 0) < 7.5 && user.aspiration === 'Placements') {
    analysis.push({
      area: 'Academic consistency',
      detail: `CGPA ${user.cgpa} may filter some campus drives — balance DSA practice with core subject revision.`,
      severity: 'medium',
    });
  }

  const cs = user.codingStats || {};
  if ((cs.leetcodeSolved || 0) < 50 && user.aspiration === 'Placements') {
    analysis.push({
      area: 'Problem-solving volume',
      detail: `You have ${cs.leetcodeSolved || 0} problems logged — most placement timelines expect 100–150+ by final year.`,
      severity: 'high',
    });
  }

  const overdueGoals = goals.filter((g) => g.status === 'active' && g.deadline && new Date(g.deadline) < new Date());
  if (overdueGoals.length) {
    analysis.push({
      area: 'Goal deadlines',
      detail: `${overdueGoals.length} active goal(s) are past deadline — reschedule or break them into smaller targets.`,
      severity: 'medium',
    });
  }

  return analysis.slice(0, 6);
};

const buildProgressInsights = (user, skills, goals, projects) => {
  const insights = [];
  const cs = user.codingStats || {};
  const avgSkill = skills.length
    ? Math.round(skills.reduce((s, k) => s + (k.level || 0), 0) / skills.length)
    : 0;

  insights.push({
    metric: 'Skills tracked',
    insight: skills.length
      ? `You track ${skills.length} skills with an average level of ${avgSkill}%.`
      : 'Add skills on the Skills page so recommendations can use real data.',
    trend: skills.length >= 3 ? 'up' : 'needs-work',
  });

  insights.push({
    metric: 'Coding activity',
    insight: (cs.leetcodeSolved || 0) > 0
      ? `${cs.leetcodeSolved} LeetCode problems logged${cs.codeforcesRating ? `, Codeforces rating ${cs.codeforcesRating}` : ''}.`
      : 'Update coding stats on your profile for sharper suggestions.',
    trend: (cs.leetcodeSolved || 0) >= 50 ? 'up' : (cs.leetcodeSolved || 0) >= 10 ? 'flat' : 'needs-work',
  });

  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  insights.push({
    metric: 'Goals',
    insight: `${completedGoals} completed, ${goals.filter((g) => g.status === 'active').length} active goals.`,
    trend: completedGoals >= 2 ? 'up' : 'flat',
  });

  insights.push({
    metric: 'Projects',
    insight: projects.length
      ? `${projects.length} project(s) on your portfolio — ${projects.filter((p) => p.status === 'completed').length} marked completed.`
      : 'At least one completed project strengthens placement and internship applications.',
    trend: projects.filter((p) => p.status === 'completed').length >= 1 ? 'up' : 'needs-work',
  });

  return insights;
};

const buildTechnologies = (domain, skills) => {
  const stack = DOMAIN_TECH[domain] || DOMAIN_TECH['Web Development'];
  return stack.map((name, i) => ({
    name,
    why: hasSkill(skills, name)
      ? 'Already on your profile — deepen with a small project.'
      : 'Recommended next in your domain roadmap.',
    order: i + 1,
  })).slice(0, 8);
};

const buildTips = (domain, user) => {
  const tips = [
    'Block 45–60 minutes daily for one focused topic instead of switching tools every day.',
    'Explain what you learned to a friend or in a short README — it exposes gaps early.',
    'Update your SkillSphere profile after each milestone so campus mentors see progress.',
  ];
  if (domain === 'Web Development') {
    tips.push('Rebuild one feature you already know without tutorials — that is when JavaScript really sticks.');
  }
  if (user.aspiration === 'Placements') {
    tips.push('Keep a simple spreadsheet of companies, deadlines, and required skills for your department.');
  }
  return tips.slice(0, 5);
};

const buildOpportunities = (domain, user, projects) => {
  const opps = [];
  if (domain === 'Web Development') {
    opps.push({
      title: 'Campus web club / tech society projects',
      description: 'Volunteer for college website, fest registration, or department portals.',
      why: 'Real deadlines teach more than tutorial clones.',
    });
  }
  if ((user.codingStats?.leetcodeSolved || 0) >= 30) {
    opps.push({
      title: 'Inter-college hackathons',
      description: 'Form a 2–4 person team and ship an MVP in 24–48 hours.',
      why: 'Your problem-solving count suggests you can handle timed builds.',
    });
  }
  if (projects.length === 0) {
    opps.push({
      title: 'Semester mini-project (course or self-initiated)',
      description: 'One deployed project with README and demo link.',
      why: 'Recruiters consistently ask for proof of work beyond coursework.',
    });
  }
  opps.push({
    title: 'Internship drives on Opportunities page',
    description: 'Check SkillSphere opportunities filtered by your department.',
    why: 'Aligned with your aspiration and current semester.',
  });
  return opps.slice(0, 4);
};

/**
 * Main entry — swap this function's internals for an AI provider later.
 */
function generateRecommendations({ user, profile, skills, goals, projects }) {
  const domain = profile.preferredDomain || 'Web Development';
  const interests = profile.interests || [];
  const weakAreas = profile.weakAreas || [];
  const learningGoals = profile.learningGoals || [];

  const courses = pickCourses(domain, weakAreas, skills);
  const skillsToImprove = buildSkillsToImprove(domain, weakAreas, skills, profile);
  const careerPaths = (CAREER_PATHS[domain] || CAREER_PATHS['Web Development']).map((p) => ({
    ...p,
    fitLabel: interests.some((i) => normalize(p.title).includes(normalize(i))) ? 'Strong match' : 'Good match',
  }));
  const weaknessAnalysis = buildWeaknessAnalysis(weakAreas, user, skills, goals);
  const roadmap = buildRoadmap(domain, weakAreas);
  const technologies = buildTechnologies(domain, skills);
  const priorityAreas = [
    ...weakAreas.slice(0, 2).map((area) => ({
      area,
      reason: 'You listed this as a weak area in your career profile.',
      urgency: 'now',
    })),
    {
      area: domain,
      reason: 'Your preferred domain — keep projects and skills aligned with it.',
      urgency: 'soon',
    },
  ];
  if (learningGoals[0]) {
    priorityAreas.push({
      area: learningGoals[0],
      reason: 'Matches your stated learning goal.',
      urgency: 'soon',
    });
  }

  const progressInsights = buildProgressInsights(user, skills, goals, projects);
  const tips = buildTips(domain, user);
  const futureOpportunities = buildOpportunities(domain, user, projects);

  const name = user.name?.split(' ')[0] || 'there';
  const summary = weakAreas.length
    ? `${name}, based on your focus on ${domain} and weak areas like ${weakAreas.slice(0, 2).join(' and ')}, the plan below prioritizes fundamentals first, then projects recruiters can review.`
    : `${name}, your profile points toward ${domain}. The suggestions below use your skills, goals, and activity on SkillSphere — update them anytime for fresher results.`;

  return {
    profileSnapshot: {
      interests,
      preferredDomain: domain,
      learningGoals,
      weakAreas,
      aspiration: user.aspiration,
      department: user.department,
      semester: user.semester,
      cgpa: user.cgpa,
      skillsCount: skills.length,
      goalsCount: goals.length,
      projectsCount: projects.length,
      codingStats: user.codingStats,
    },
    summary,
    courses,
    skillsToImprove,
    careerPaths,
    weaknessAnalysis,
    roadmap,
    technologies,
    priorityAreas: priorityAreas.slice(0, 5),
    progressInsights,
    tips,
    futureOpportunities,
    engineVersion: 'rule-v1',
  };
}

module.exports = { generateRecommendations };
