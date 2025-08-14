import React, { useState, useEffect } from 'react';
import { Award, Users, Star, Trophy, Target, Zap, CheckCircle, TrendingUp } from 'lucide-react';
import PP from "../assets/PP.jpg";
import { motion } from 'framer-motion';

const About = () => {
  // Easter egg states
  const [showLoreModal, setShowLoreModal] = useState(false);
  const [password, setPassword] = useState('');
  const [simpleClickCount, setSimpleClickCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [inputPassword, setInputPassword] = useState('');

  // Global event listener for password (keyboard)
  useEffect(() => {
    const handleKeyPress = (e) => {
      const currentPassword = password + e.key;
      setPassword(currentPassword);

      // Check if password matches
      if (currentPassword === '311220') {
        setShowLoreModal(true);
        setPassword('');
      } else if (currentPassword.length >= 6) {
        setPassword('');
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [password]);

  // Handle "Simple" word click for mobile easter egg
  const handleSimpleClick = () => {
    const newCount = simpleClickCount + 1;
    setSimpleClickCount(newCount);
    
    if (newCount === 5) {
      setShowPasswordModal(true);
      setSimpleClickCount(0); // Reset count
    }
  };

  // Handle password submission
  const handlePasswordSubmit = () => {
    if (inputPassword === '311220') {
      setShowLoreModal(true);
      setShowPasswordModal(false);
      setInputPassword('');
    } else {
      setInputPassword('');
      // You could add a toast notification here for wrong password
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const successStats = [
    { number: "100+", label: "Students Taught", icon: Users },
    { number: "90%", label: "(A* - A) Achievement", icon: Trophy },
    { number: "5+", label: "Years Experience", icon: Award },
    { number: "10+", label: "Countries Reached", icon: Target }
  ];

  const studentTestimonials = [
    {
      name: "Razan Mohamed",
      country: "Egypt",
      text: "Exam was 23 days ahead, and I had no idea what to do. i contacted Mr.Ahmad & we managed to compress all syllybus in no time, and surprisingly I got an A."
    },
    {
      name: "Jana Shoukry",
      country: "Egypt",
      text: "Will definitely miss this course as someone that hates computer related stuff this course was definitely amazing experience and definitely learned many things from it using interactive notes was really helpful as someone who gets distracted easily when using normal notes and they helped me remeber many things in the exam w most helpful tutor i have had this session"
    },
    {
      name: "Abdelrahman Mohamed",
      country: "Egypt",
      text: "Shokran awe ya mr aala taab hadretak w bgd ana mabsot ene da5lt el course maa hadretak we ene haset en rabena 5alany aaml retake lel ict aashan a2abl hadretak wna bgd msh aarf a2ol le hadretak eh aan taab w maghod hafretak fel notes wla fel practical bezat lola hadretak kan zamany bgd shelt el practical hadretak sa3detna kter"
    },
    {
      name: "Omar Tarek",
      country: "Egypt",
      text: "شكرا على المجهود الجبار الاتبذل معانا ك طلاب و معايا انا ك شخص و مش بقول كدة و خلاص بس انت مش بس مستر انت اخ كبير ❤️👬"
    },

    {
      name: "Jana Ramy",
      country: "Egypt",
      text: "really thank you for your hard working ana makontsh atwk3 eny alm ict fyh esbo3en bas fa bgd 4okran gedn gedn"
    },
    {
      name: "Ali Jamal",
      country: "Egypt",
      text: "The teacher was different from most teacher as he treated the students as friends not like students and put himself in the student point of view"
    },
    {
      name: "Malak Farrag",
      country: "UAE",
      text: "Thanks for being an amazing teacher 🌹I really enjoyed the course and learned a lot from it"
    },
    {
      name: "Nuria Amr",
      country: "Spain",
      text: "I benefited so much really and u did ur duty and way more thank you so much for all ur patience and hard work ❤️❤️"
    },
    {
      name: "Nouran Mohamed",
      country: "Egypt",
      text: "It was great, each point was explained in details and in a simple way"
    },
    {
      name: "Karam Al Jarara",
      country: "Jordan",
      text: "The amount of benefit I gained is beyond count — whether in the practical sessions (which were my favorite, by the way), or the theoretical ones, which I used to dislike. But thanks to the collaborative notes and the engaging sessions themselves, even the theory became much easier — with only about 10% needing memorization, and the rest being fully understood during the lesson. truly, Dr. Ahmad was one of the best teachers I've ever had. Not only because of his excellent teaching, but also because of his personality. He's extremely friendly, flexible (especially with timing!), and supportive. Beyond all that, I didn't just gain knowledge — I gained a mentor, and one of the most inspiring people I've met.That said... all of this still doesn't beat how much I appreciate and love him"
    },


  ];


  return (
    <div className="flex flex-col min-h-screen">
      {/* Password Modal for Mobile Easter Egg */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <p className="text-gray-600 mb-6 font-bold">You found an easter egg !<br /> Enter the password to reveal the lore.</p>
              
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-[#CA133E] focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
              
              <div className="flex gap-4">
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 bg-[#CA133E] text-white py-3 rounded-xl font-bold hover:bg-[#A01030] transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setInputPassword('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AT ICT Lore Modal */}
      {showLoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Historical Frame Design */}
            <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] border-4 border-[#CA133E] rounded-xl p-8 shadow-2xl">
              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#CA133E] rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#CA133E] rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#CA133E] rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#CA133E] rounded-br-lg"></div>

              {/* Close Button */}
              <button
                onClick={() => setShowLoreModal(false)}
                className="absolute top-5 right-8 text-[#CA133E] hover:text-white text-2xl font-bold transition-colors"
              >
                ✕
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-[#CA133E] mb-2">🏛️ The Chronicles of AT-ICT</h1>
                <div className="w-32 h-1 bg-gradient-to-r from-[#CA133E] to-[#A01030] mx-auto"></div>
                <p className="text-gray-400 mt-2">A Tale of Innovation & Excellence</p>
              </div>

              {/* Story Content */}
              <div className="prose prose-invert max-w-none">
                {/* <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
                  <h2 className="text-2xl font-bold text-[#CA133E] mb-4">📜 The Origin Story</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    This is where the real lore of AT-ICT will be written.
                    The story of how I Mr.Ahmad Tamer Ali Started IGCSE ICT education,
                    the challenges faced, the breakthrough moments, and the journey
                    that led to creating one of the most successful ICT tutoring organizations.
                  </p>
                </div> */}

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
                  <h2 className="text-2xl font-bold text-[#CA133E] mb-4">📜 The Origin Story</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    I was once an IGCSE student—quiet, introverted, unable to talk to anyone. I was extremely shy and often afraid to step out of my comfort zone.
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Everything changed on 31/12/2020. While playing football, I met the love of my life. She brought light into my world and gave me a reason to live with purpose. One day, as we were sharing our exam results, I told her I had scored an A+ in ICT. She was genuinely happy for me and, half-jokingly, said: <i>"You should teach ICT and compete with Mr. Safty."</i>
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Months passed, and during my four-month gap between school and university, I remembered her words. I thought to myself: <i>"Why not try it?"</i> I began creating what I called my <b>interactive notes</b>, just for fun. I showed them to a few friends and to my mentor, Dr. Ahmad Hassan, my history teacher. Of course, I also told her—and she was thrilled. She called it creative and innovative, even saying she wished she had taken ICT so I could teach her. Her encouragement made me seriously consider becoming a teacher.
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    What began as a small experiment turned into a mission. I completed all 13 chapters of the notes, then moved on to the <b>Practical Guidance</b>, <b>The Classified</b>, and <b>The Markscheme</b>. I worked every single day—no less than six hours daily—until the journey was complete.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    That’s how it all began. That’s how <b>AT-ICT</b> was born.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
                  <h2 className="text-2xl font-bold text-[#CA133E] mb-4">The First Student ⚡</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Who was the very first student to join AT-ICT?
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    It all began during a casual chat with my friends. I was explaining my plan to start teaching ICT, and word started to spread. One of my friends—a Math teacher—already knew my story. He told me, <i>"I know a girl who’s struggling with ICT and looking for a tutor. Since you’re starting out, I thought you could help her."</i> Then he said, <i>"Her name is Nuria. Here’s her father’s number—you can call him to arrange the details."</i>
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    That was the spark that lit the fire. Nuria became my very first student. She was Spanish, and at first, we struggled to communicate. Sometimes we had to rely on gestures, simple words, and even drawings to explain concepts. But slowly, lesson by lesson, we built understanding—not just of ICT, but of each other.
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    I still remember one particular day during our Excel revision. I had given her a set of difficult questions, the kind that could easily overwhelm a student. She kept trying, making mistakes, and trying again. At one point, she paused, her eyes filling with tears—not from giving up, but from the frustration of wanting to get it right so badly. I encouraged her, reminded her how far she’d come, and guided her through it step by step. The moment she finally solved the problem, her tears turned into the biggest smile I had ever seen.
                  </p>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    I’ll never forget our last session before her exam. She looked at me, smiling, and said, <i>"Thanks for everything"</i> Such a simple sentence, yet it meant everything. All the effort, the hours of preparation, and the moments of frustration had led to this: a student who once struggled was now confident and ready.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    When the session ended, I walked away with a mix of pride and gratitude. I realized this wasn’t just about teaching ICT—it was about changing lives, starting with hers. And in that moment, I knew AT-ICT was no longer just an idea. It had truly begun.
                  </p>
                </div>






              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm">
                  "Education is not preparation for life; education is life itself."
                  <br />
                  <span className="text-[#CA133E] font-semibold">- AT-ICT Philosophy</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <main className="flex-grow">
        {/* Hero Section - Attention Grabber */}
        <section className="pt-24 pb-12 bg-gradient-to-br from-[#1a1a1a] via-[#2a1a1a] to-[#3a1a1a] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNDQTEzM0UiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

          <div className="container mx-auto px-4 relative">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-center max-w-4xl mx-auto mt-10"
            >
              <span className="text-white font-bold text-[25pt] tracking-wide uppercase">Meet Your ICT Success Partner</span>
              <h1 className="text-4xl md:text-[20pt] font-bold mt-4 mb-6">
                From a <span className="text-[#CA133E]">Struggler</span> to
                <span className="text-[#CA133E]"> A* Champion !</span>
              </h1>
              <p className="text-xl md:text-[15pt] text-gray-300 mb-8 leading-relaxed">
                ICT explained using our <span className="text-[#CA133E] font-semibold">proven method</span> <br />
                That transforms confusion into confidence!
              </p>

              {/* Success Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {successStats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-[#CA133E] rounded-full flex items-center justify-center mx-auto mb-3">
                      <stat.icon className="text-white" size={28} />
                    </div>
                    <div className="text-[15pt] font-bold text-[#CA133E] mb-1">{stat.number}</div>
                    <div className="text-gray-400 text-[15pt]">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Teacher Profile - The Story */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-6xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Teacher Image & Credentials */}
                <div className="text-center lg:text-left">
                  <div className="relative inline-block">
                    <div className="w-80 h-80 mx-auto lg:mx-0">
                      <img
                        src={PP}
                        alt="Ahmad Tamer Ali"
                        className="w-full h-full object-cover rounded-xl shadow-[3px_3px_3px_3px_rgba(0,0,0,0.5)] border-4 border-red-600"
                      />
                    </div>
                  </div>

                  {/* Quick Credentials */}
                  <div className="mt-8">
                    <ul className="flex flex-col gap-4 pl-0">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                        <span className="text-gray-700 text-[15pt]">Software Engineer & IGCSE Expert</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                        <span className="text-gray-700 text-[15pt]">5+ Years Teaching Experience</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                        <span className="text-gray-700 text-[15pt]">Former IGCSE Student (I've Been There !)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* The Story */}
                <div>
                  <span className="text-[#CA133E] font-bold text-[15pt]">My Journey</span>
                  <h2 className="text-[20pt] font-bold text-gray-800 mt-2 mb-6">
                    Why I <span className="text-[#CA133E]">Developed</span> AT-ICT ?
                  </h2>

                  <div className="space-y-6 text-gray-700 leading-relaxed">
                    <p className="text-[14pt]">
                      <strong>I remember my own IGCSE struggles...</strong> <br />
                      Sitting in class, completely lost with <span className='text-[#CA133E] font-bold'>Notes and classfied</span>. <br />
                      That frustration? I've felt it too. That's exactly why I created AT-ICT.
                    </p>
                    <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-[#CA133E]">
                      <p className="font-semibold text-[#CA133E] mb-2 text-[14pt]">💡 The Breakthrough Moment:</p>
                      <p className="text-[14pt]">
                        "When I finally understood ICT through <em>real examples and hands-on practice</em>,
                        I knew I had to share this approach with others. That was 5 years ago..."
                      </p>
                    </div>

                    <p className='text-center text-[13pt]'>
                      Since then, I've dedicated my career to make Learning
                      <div className="my-8">
                        <ul className="flex flex-col sm:flex-row gap-6 sm:gap-10 justify-center pl-0 list-none">
                          <li>
                            <span
                              onClick={handleSimpleClick}
                              className="text-[#CA133E] bg-[#FDE8EC] font-bold rounded-xl px-4 py-2 text-[15pt] block cursor-pointer"
                            >
                              Simple
                            </span>
                          </li>
                          <li>
                            <span className="text-[#CA133E] bg-[#FDE8EC] font-bold rounded-xl px-4 py-2 text-[15pt] block">Engaging</span>
                          </li>
                          <li>
                            <span className="text-[#CA133E] bg-[#FDE8EC] font-bold rounded-xl px-4 py-2 text-[15pt] block">Actually Fun!</span>
                          </li>
                        </ul>
                      </div>
                    </p>
                  </div>
                </div>
              </div>

              {/* Promise Section - Centered Below */}
              <div className="mt-16 flex justify-center">
                <div className="bg-gray-200 p-6 rounded-xl max-w-4xl w-full">
                  <p className="font-bold text-[#CA133E] text-[15pt] text-center">My Promise to You:</p>
                  <p className="mt-2 text-[15pt] text-center">
                    "I won't just teach you ICT concepts – I'll show you how to <em>think like a tech expert</em>,
                    solve problems confidently, and ace your exams with strategies that actually work in the real world."
                  </p>
                  <div className="mt-4 flex items-center justify-center">
                    <img src={PP} alt="Ahmad" className="w-12 h-12 rounded-full mr-3" />
                    <div>
                      <div className="font-bold text-gray-800 text-[15pt]">Eng. Ahmad Tamer Ali</div>
                      <div className="text-[15pt] text-gray-600">Your ICT Success Partner</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Achievements Section */}
        {/* <section className="py-20 bg-gradient-to-r from-[#0F0F0F] via-[#4A0D0D] to-[#C70039]">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Why <span className="text-[#CA133E]">100+ Students</span> Choose AT-ICT
              </h2>
              <p className="text-xl text-gray-300 mb-12">
                Real results from real students. Here's what makes us different:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-left"
                  >
                    <p className="text-white text-lg">{achievement}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section> */}

        {/* Student Success Stories */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="max-w-6xl mx-auto"
            >
              <div className="text-center mb-16">
                <span className="text-[#CA133E] font-bold text-[25pt]">Student Stories</span>
                <h2 className="text-[15pt] font-bold text-gray-800 mt-2 mb-4">
                  Real Students, <span className="text-[#CA133E]">Real Results</span>
                </h2>
                <p className="text-[13pt] text-gray-600">
                  Don't just take our word for it - hear from students.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {studentTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-[#CA133E] rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                        <div className="flex items-center">
                          <span className="text-gray-500 text-sm">• {testimonial.country}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex text-[#CA133E] mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic">"{testimonial.text}"</p>
                  </motion.div>
                ))}
              </div>

              {/* Call to Action */}
              <div className="text-center mt-16">
                <div className="bg-[#CA133E] text-white rounded-xl p-8 max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold mb-4">Ready to Join Our Success Stories?</h3>
                  <p className="text-lg mb-6 opacity-90">
                    Your A* journey starts with a single step. Let's make it happen together!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/register" className="bg-white text-[#CA133E] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all">
                      Start Your Journey
                    </a>
                    <a href="/samples" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white hover:text-[#CA133E] transition-all">
                      Access Free Samples
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Choose AT-ICT - Enhanced */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-6xl mx-auto"
            >
              <div className="text-center mb-16">
                <h2 className="text-[25pt] font-bold text-gray-800 mb-4">
                  The <span className="text-[#CA133E]">AT-ICT Advantage</span>
                </h2>
                <p className="text-[15pt] text-gray-600">
                  What makes our students consistently outperform others?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: <Zap size={40} />,
                    title: "Interactive Learning",
                    description: "No boring lectures! Every concept comes alive through hands-on activities and real examples.",
                  },

                  {
                    icon: <Users size={40} />,
                    title: "Personal Support",
                    description: "Never feel stuck! Get personal guidance and answers to all your questions anytime.",
                  },
                  {
                    icon: <Trophy size={40} />,
                    title: "Exam Mastery",
                    description: "Learn insider tips and strategies that examiners look for to maximize your grades.",
                  },
                  {
                    icon: <TrendingUp size={40} />,
                    title: "Proven Method",
                    description: "Our step-by-step approach has helped 100+ students achieve A*/A grades consistently.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="text-[#CA133E] mb-6 flex justify-center">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800 text-center">{item.title}</h3>
                    <p className="text-gray-600 mb-4 text-center">{item.description}</p>

                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;