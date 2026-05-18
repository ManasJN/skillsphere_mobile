import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BrandLogo from '../components/brand/BrandLogo';

const announcements = [
  {
    title: 'Hackathon registrations are now open',
    desc: 'Students can now register for the inter-college hackathon event.',
    date: '15 May 2026',
  },
  {
    title: 'New coding leaderboard published',
    desc: 'Updated rankings based on LeetCode and Codeforces activity.',
    date: '12 May 2026',
  },
  {
    title: 'Web Development workshop this Friday',
    desc: 'Department workshop on MERN stack and deployment basics.',
    date: '10 May 2026',
  },
];

const features = [
  {
    title: 'Student Profiles',
    desc: 'Maintain student achievements, skills, projects, and certificates in one place.',
  },
  {
    title: 'Coding Progress',
    desc: 'Track coding activity and compare progress with classmates and friends.',
  },
  {
    title: 'Campus Updates',
    desc: 'Share notices, announcements, workshops, internship drives, and events.',
  },
  {
    title: 'Leaderboards',
    desc: 'Department-wise rankings based on coding activity and student participation.',
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, delay },
});

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030b1d] text-[#f8fafc]">

      {/* MAIN NAVBAR */}
      <nav className="bg-[#081225] border-b border-[#1e293b]">

        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">

          {/* LEFT */}
          <BrandLogo size="lg" subtitle="Student Growth & Campus Activity Platform" />

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 border border-[#253552] bg-[#081225] hover:bg-[#0b1630] text-sm text-white transition-all"
            >
              Login
            </button>

            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2 bg-[#4f46e5] text-white text-sm hover:bg-[#4338ca] transition-all"
            >
              Get Started
            </button>

          </div>

        </div>

      </nav>

      {/* HERO SECTION */}
      <section className="bg-[#081225] border-b border-[#1e293b]">

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2">

          {/* LEFT CONTENT */}
          <div className="px-6 md:px-10 py-14">

            <motion.div
              {...fadeUp(0)}
              className="inline-block bg-[#10192f] border border-[#253552] text-[#93c5fd] text-sm px-4 py-1 mb-6"
            >
              Centralized Student Platform
            </motion.div>

            <motion.h1
              {...fadeUp(0.1)}
              className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-white"
            >
              A Better Way
              <br />
              to Manage
              <br />
              Student Growth
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="text-[#94a3b8] text-lg leading-relaxed max-w-xl mb-8"
            >
              Track student profiles, coding progress,
              certificates, projects, leaderboards,
              announcements, and campus activities —
              all from one platform.
            </motion.p>

            <motion.div
              {...fadeUp(0.3)}
              className="flex gap-4 flex-wrap"
            >

              <button
                onClick={() => navigate('/register')}
                className="px-7 py-3 bg-[#4f46e5] text-white hover:bg-[#4338ca] transition-all"
              >
                Create Account
              </button>

              <button
                onClick={() => navigate('/login')}
                className="px-7 py-3 border border-[#253552] hover:bg-[#0b1630] text-white transition-all"
              >
                Student Login
              </button>

            </motion.div>

          </div>

          {/* RIGHT SIDE */}
          <div className="bg-[#0b1630] border-l border-[#1e293b] p-6 md:p-10">

            {/* IMAGE */}
            <div className="mb-6 overflow-hidden border border-[#1e293b] bg-[#10192f]">

              <img
                src="https://jecassam.ac.in/wp-content/uploads/2023/11/slide1.jpg"
                alt="Campus"
                className="w-full h-[240px] object-cover"
              />

            </div>

            {/* ANNOUNCEMENTS */}
            <div className="bg-[#10192f] border border-[#1e293b]">

              <div className="bg-[#111c35] border-b border-[#1e293b] text-white px-5 py-3 text-lg font-semibold">
                Recent Announcements
              </div>

              <div>

                {announcements.map((item, index) => (

                  <div
                    key={index}
                    className={`p-5 ${
                      index !== announcements.length - 1
                        ? 'border-b border-[#1e293b]'
                        : ''
                    }`}
                  >

                    <div className="text-sm text-[#64748b] mb-2">
                      {item.date}
                    </div>

                    <div className="font-semibold text-lg mb-2 text-white">
                      {item.title}
                    </div>

                    <div className="text-[#94a3b8] text-sm leading-relaxed">
                      {item.desc}
                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* QUICK INFO BAR */}
      <section className="bg-[#081225] border-b border-[#1e293b]">

        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-8 text-sm text-[#94a3b8]">

          <div>Student Profiles</div>

          <div>Coding Analytics</div>

          <div>Campus Announcements</div>

          <div>Skill Tracking</div>

          <div>Leaderboards</div>

        </div>

      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-16">

        <div className="mb-12">

          <div className="text-4xl font-bold mb-4 text-white">
            Platform Features
          </div>

          <p className="text-[#94a3b8] max-w-3xl leading-relaxed">
            SkillSphere helps colleges manage student growth,
            activities, coding progress, achievements,
            and institutional updates through a centralized platform.
          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {features.map((feature, index) => (

            <motion.div
              key={index}
              {...fadeUp(index * 0.1)}
              className={`bg-[#10192f] border border-[#1e293b] p-7 hover:border-[#334155] transition-all ${
                index % 2 === 0 ? 'mt-0' : 'mt-4'
              }`}
            >

              <div className="text-2xl font-semibold mb-4 text-white">
                {feature.title}
              </div>

              <div className="text-[#94a3b8] leading-relaxed">
                {feature.desc}
              </div>

            </motion.div>

          ))}

        </div>

      </section>

      {/* ACTIVITY SECTION */}
      <section className="bg-[#081225] border-t border-b border-[#1e293b]">

        <div className="max-w-7xl mx-auto px-6 py-16">

          <div className="text-4xl font-bold mb-10 text-white">
            Campus Activity Feed
          </div>

          <div className="space-y-4">

            <div className="border border-[#1e293b] p-5 bg-[#10192f] text-[#cbd5e1]">
              Rahul updated his coding profile and moved to Rank #4.
            </div>

            <div className="border border-[#1e293b] p-5 bg-[#0b1630] text-[#cbd5e1]">
              New internship opportunities added for final year students.
            </div>

            <div className="border border-[#1e293b] p-5 bg-[#10192f] text-[#cbd5e1]">
              Workshop registrations are now open for Web Development Bootcamp.
            </div>

            <div className="border border-[#1e293b] p-5 bg-[#0b1630] text-[#cbd5e1]">
              Department leaderboard updated based on recent contest activity.
            </div>

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">

        <div className="bg-[#10192f] border border-[#1e293b] p-10">

          <div className="text-4xl font-bold mb-4 text-white">
            Start Building Better Student Profiles
          </div>

          <p className="max-w-3xl text-[#94a3b8] leading-relaxed mb-8">
            A centralized platform for colleges and students
            to manage achievements, projects, skills,
            coding activity, and institutional updates.
          </p>

          <button
            onClick={() => navigate('/register')}
            className="bg-[#4f46e5] text-white px-7 py-3 hover:bg-[#4338ca] transition-all"
          >
            Get Started
          </button>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-[#081225] border-t border-[#1e293b] text-[#94a3b8]">

        <div className="max-w-7xl mx-auto px-6 py-10">

          <BrandLogo size="md" subtitle="Student Growth & Campus Activity Platform" />

        </div>

      </footer>

    </div>
  );
}
