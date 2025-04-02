// app/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(0);
  const languages = ['Japanese', 'Korean', 'Spanish', 'French', 'Chinese'];
  const languageEmojis = ['🇯🇵', '🇰🇷', '🇪🇸', '🇫🇷', '🇨🇳'];
  
  // Handle scroll events for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Rotate through languages for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLanguage((prev) => (prev + 1) % languages.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3">
              <RobotLogo />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 text-transparent bg-clip-text">
              ShinobiSpeak
            </span>
          </div>
          
          <div className="hidden md:flex space-x-8 text-slate-600">
            <Link href="#features" className="hover:text-cyan-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-cyan-600 transition-colors">How It Works</Link>
            <Link href="#testimonials" className="hover:text-cyan-600 transition-colors">Testimonials</Link>
            <Link href="#pricing" className="hover:text-cyan-600 transition-colors">Pricing</Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin" className="text-cyan-600 hover:text-cyan-700 font-medium">
              Log in
            </Link>
            <Link href="/auth/signin" className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg shadow-md transition-all transform hover:translate-y-[-2px]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden relative">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-20 right-[10%] w-64 h-64 bg-cyan-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-20 left-[5%] w-72 h-72 bg-teal-300 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-40 left-[15%] w-48 h-48 bg-amber-300 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-800 text-sm font-medium rounded-full mb-6">
                Learn languages with crypto incentives ⚡
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Master 
                <span className="relative inline-block mx-2 px-2">
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-200 to-teal-200 rounded-lg -rotate-1"></span>
                  <span className="relative">
                    <span className="animate-fade-in-out">{languages[currentLanguage]}</span>
                    <span className="ml-2">{languageEmojis[currentLanguage]}</span>
                  </span>
                </span>
                <br />with Real Incentives
              </h1>
              
              <p className="text-lg text-slate-600 mb-8 md:pr-6">
                ShinobiSpeak combines AI-powered conversation practice with financial incentives. 
                Stake crypto on your language learning goals and earn rewards for consistent progress.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signin" className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all transform hover:translate-y-[-2px] text-center">
                  Start Learning Now
                </Link>
                <Link href="#how-it-works" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-lg font-medium shadow-sm transition-colors text-center">
                  Learn More
                </Link>
              </div>
              
              <div className="mt-8 flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {['J', 'K', 'S', 'M'][i]}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">2,500+</span> language learners already joined
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="relative w-full h-[500px]">
                <HeroAnimation />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Partners Section */}
      <section className="py-8 border-y border-slate-200 bg-white">
        <div className="container mx-auto px-6">
          <p className="text-slate-500 text-center text-sm uppercase font-medium tracking-wider mb-6">
            Trusted by top blockchain and language learning partners
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="h-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-full w-28 bg-slate-300 rounded-md"></div>
            </div>
            <div className="h-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-full w-28 bg-slate-300 rounded-md"></div>
            </div>
            <div className="h-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-full w-28 bg-slate-300 rounded-md"></div>
            </div>
            <div className="h-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-full w-28 bg-slate-300 rounded-md"></div>
            </div>
            <div className="h-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-full w-28 bg-slate-300 rounded-md"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-sm font-medium rounded-full mb-4">
              Key Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why ShinobiSpeak is Revolutionary
            </h2>
            <p className="text-slate-600">
              Our platform combines cutting-edge AI with blockchain incentives to create a language learning experience unlike any other.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              }
              title="AI Conversation Practice"
              description="Engage in natural conversations with our AI tutors for immersive language practice that adapts to your skill level."
              color="cyan"
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Crypto Staking Rewards"
              description="Stake cryptocurrency on your learning goals and earn rewards for consistent practice and challenge completion."
              color="amber"
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="Gamified Challenges"
              description="Join language learning challenges with specific goals, track your progress, and compete with others."
              color="teal"
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
              title="Personalized Learning Path"
              description="Get a customized learning journey based on your proficiency level, goals, and learning style."
              color="purple"
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              }
              title="Real-time Feedback"
              description="Receive instant feedback on pronunciation, grammar, and vocabulary usage to improve faster."
              color="rose"
            />
            
            <FeatureCard 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Community Learning"
              description="Join a community of language learners, participate in group challenges, and learn together."
              color="emerald"
            />
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 text-sm font-medium rounded-full mb-4">
              Simple Process
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How ShinobiSpeak Works
            </h2>
            <p className="text-slate-600">
              Our platform makes language learning effective through financial incentives and AI conversation practice.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-16 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-teal-500 hidden md:block"></div>
              
              <div className="space-y-12">
                <ProcessStep 
                  number="1"
                  title="Connect your wallet"
                  description="Sign up with your cryptocurrency wallet to create your account and access the platform features."
                />
                
                <ProcessStep 
                  number="2"
                  title="Choose a language challenge"
                  description="Select a language and proficiency level, then choose a challenge that matches your learning goals."
                />
                
                <ProcessStep 
                  number="3"
                  title="Stake your crypto"
                  description="Commit to your language learning by staking USDC on your selected challenge."
                />
                
                <ProcessStep 
                  number="4"
                  title="Practice with AI tutors"
                  description="Engage in daily conversation practice with our AI tutors to improve your language skills."
                />
                
                <ProcessStep 
                  number="5"
                  title="Track your progress"
                  description="Monitor your learning streak, vocabulary growth, and overall proficiency improvements."
                />
                
                <ProcessStep 
                  number="6"
                  title="Complete challenges & earn rewards"
                  description="Successfully complete challenges to earn back your stake plus additional rewards from generated yield."
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 text-sm font-medium rounded-full mb-4">
              User Stories
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Users Say
            </h2>
            <p className="text-slate-600">
              Discover how ShinobiSpeak has transformed language learning journeys.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="The financial incentive really kept me committed to daily practice. I've tried many language apps before, but ShinobiSpeak is the first one I've stuck with for more than a month."
              author="Alex Tanaka"
              title="Learning Japanese"
              avatar="/images/avatar-1.png"
            />
            
            <TestimonialCard 
              quote="Conversation practice with the AI tutor feels remarkably natural. I'm able to practice Spanish in realistic scenarios, which has boosted my confidence when speaking with native speakers."
              author="Maria Rodriguez"
              title="Learning Spanish"
              avatar="/images/avatar-2.png"
            />
            
            <TestimonialCard 
              quote="The challenge system makes language learning feel like a game. I love competing with others and seeing my progress on the leaderboard. Plus, earning rewards is a nice bonus!"
              author="David Kim"
              title="Learning Korean"
              avatar="/images/avatar-3.png"
            />
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 text-sm font-medium rounded-full mb-4">
              Flexible Plans
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Learning Plan
            </h2>
            <p className="text-slate-600">
              Select the plan that best fits your language learning goals and budget.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              title="Basic"
              price="Free"
              description="Perfect for casual learners"
              features={[
                "1 language",
                "10 minutes of AI conversation daily",
                "Basic progress tracking",
                "Community access"
              ]}
              cta="Get Started"
              highlighted={false}
            />
            
            <PricingCard 
              title="Premium"
              price="$14.99"
              period="per month"
              description="Ideal for serious language learners"
              features={[
                "3 languages",
                "Unlimited AI conversation",
                "Advanced progress analytics",
                "No-loss staking challenges",
                "Priority support"
              ]}
              cta="Start Free Trial"
              highlighted={true}
            />
            
            <PricingCard 
              title="Enterprise"
              price="Custom"
              description="For teams and organizations"
              features={[
                "Unlimited languages",
                "Custom challenge creation",
                "Team leaderboards",
                "API access",
                "Dedicated account manager"
              ]}
              cta="Contact Us"
              highlighted={false}
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Language Learning?
            </h2>
            <p className="text-xl mb-8 text-cyan-50">
              Join thousands of learners who are achieving their language goals with ShinobiSpeak.
            </p>
            <Link href="/auth/signin" className="inline-block bg-white text-cyan-600 hover:bg-cyan-50 px-8 py-4 rounded-lg font-medium shadow-lg transition-all transform hover:translate-y-[-2px]">
              Start Your Journey Now
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center mb-4">
                <div className="mr-3">
                  <RobotLogo dark={true} />
                </div>
                <span className="text-xl font-bold text-white">
                  ShinobiSpeak
                </span>
              </div>
              <p className="mb-4 text-slate-400">
                Revolutionizing language learning with AI and blockchain technology. Practice conversations and earn rewards.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} ShinobiSpeak. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Robot Logo Component
function RobotLogo({ dark = false }) {
  return (
    <div className="w-10 h-10 relative">
      <div className={`relative ${dark ? 'bg-gradient-to-br from-cyan-500 to-teal-600' : 'bg-gradient-to-br from-cyan-400 to-teal-500'} rounded-xl w-full h-full flex items-center justify-center overflow-hidden border-2 ${dark ? 'border-teal-400' : 'border-cyan-300'} shadow-md`}>
        {/* Eyes */}
        <div className="flex space-x-1">
          <div className="bg-yellow-300 rounded-full w-[20%] h-[20%] flex items-center justify-center border border-yellow-400">
            <div className="bg-black rounded-full w-[50%] h-[50%]"></div>
          </div>
          <div className="bg-yellow-300 rounded-full w-[20%] h-[20%] flex items-center justify-center border border-yellow-400">
            <div className="bg-black rounded-full w-[50%] h-[50%]"></div>
          </div>
        </div>
        
        {/* Antenna */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
          <div className="w-[2px] h-[5px] bg-slate-600"></div>
          <div className="w-[4px] h-[4px] rounded-full bg-red-500 animate-pulse"></div>
        </div>
        
        {/* Mouth */}
        <div className="absolute bottom-[15%] w-[40%] h-[2px] bg-slate-700 rounded-full"></div>
      </div>
    </div>
  );
}

// Hero Animation Component
function HeroAnimation() {
  return (
    <div className="relative w-full h-full">
      {/* Main image */}
      <div className="absolute w-[80%] h-[80%] top-[10%] left-[10%] rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-200">
        <div className="p-6">
          {/* Robot Avatar and chat interface mockup */}
          <div className="flex">
            <div className="mr-4 flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center border-2 border-cyan-300 shadow-md">
                <div className="flex space-x-1">
                  <div className="bg-yellow-300 rounded-full w-3 h-3"></div>
                  <div className="bg-yellow-300 rounded-full w-3 h-3"></div>
                </div>
              </div>
            </div>
            <div className="bg-slate-100 rounded-2xl p-4 rounded-tl-none max-w-[70%]">
              <p className="text-slate-800">こんにちは！レストランでの注文の練習をしましょう。何か飲み物を注文してみてください。</p>
              <p className="text-xs text-slate-500 mt-2">Hello! Let's practice ordering at a restaurant. Try ordering a drink.</p>
            </div>
          </div>
          
          {/* User response mockup */}
          <div className="flex justify-end mt-4">
            <div className="bg-cyan-100 rounded-2xl p-4 rounded-tr-none max-w-[70%]">
              <p className="text-slate-800">コーヒーをお願いします。</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-500">I would like a coffee, please.</p>
                <div className="text-xs text-green-600 font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Correct
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress display mockup */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <p>Daily Goal: 15/20 minutes</p>
              <p>75% Complete</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-cyan-400 to-teal-500 h-2 rounded-full w-[75%]"></div>
            </div>
          </div>
          
          {/* Stats mockup */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500">Current Streak</p>
              <p className="text-lg font-bold text-slate-800">12 days</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500">Vocab Learned</p>
              <p className="text-lg font-bold text-slate-800">728 words</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-500">USDC Staked</p>
              <p className="text-lg font-bold text-slate-800">$200</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-[5%] right-[5%] w-28 h-28 rounded-full bg-amber-100 animate-float-slow"></div>
      <div className="absolute bottom-[15%] left-[0%] w-20 h-20 rounded-full bg-cyan-100 animate-float"></div>
      
      {/* Stats Cards Floating */}
      <div className="absolute top-[15%] right-[-5%] bg-white rounded-lg shadow-lg p-4 border border-slate-100 animate-float">
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-amber-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500">Current Streak</p>
            <p className="text-lg font-bold text-slate-800">12 days</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-[10%] right-[10%] bg-white rounded-lg shadow-lg p-4 border border-slate-100 animate-float delay-150">
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-teal-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-slate-500">Potential Reward</p>
            <p className="text-lg font-bold text-slate-800">$220 USDC</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, color }) {
  const colors = {
    cyan: "from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-600",
    teal: "from-teal-50 to-teal-100 border-teal-200 text-teal-600",
    amber: "from-amber-50 to-amber-100 border-amber-200 text-amber-600",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-600",
    rose: "from-rose-50 to-rose-100 border-rose-200 text-rose-600",
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-600"
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className={`p-6 border-b border-slate-100 bg-gradient-to-r ${colors[color]}`}>
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
          <div className={`text-${color}-600`}>{icon}</div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600">{description}</p>
      </div>
      <div className="p-6 bg-white">
        <Link href="#" className={`text-${color}-600 hover:text-${color}-700 font-medium flex items-center`}>
          Learn more
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// Process Step Component
function ProcessStep({ number, title, description }) {
  return (
    <div className="flex items-start md:items-center">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white flex items-center justify-center font-bold text-lg z-10 shadow-md">
        {number}
      </div>
      <div className="ml-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600">{description}</p>
      </div>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({ quote, author, title, avatar }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex-1">
        <svg className="h-8 w-8 text-slate-300 mb-4" fill="currentColor" viewBox="0 0 32 32">
          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
        </svg>
        <p className="text-slate-600 italic mb-4">{quote}</p>
      </div>
      <div className="flex items-center">
        <div className="mr-3">
          {avatar ? (
            <Image src={avatar} alt={author} width={40} height={40} className="rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
              {author.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium text-slate-800">{author}</h4>
          <p className="text-sm text-slate-500">{title}</p>
        </div>
      </div>
    </div>
  );
}

// Pricing Card Component
function PricingCard({ title, price, period, description, features, cta, highlighted }) {
  return (
    <div className={`rounded-xl overflow-hidden ${
      highlighted 
        ? 'bg-white border-2 border-cyan-500 shadow-lg relative transform -translate-y-4' 
        : 'bg-white border border-slate-100 shadow-sm'
    }`}>
      {highlighted && (
        <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-slate-800">{price}</span>
          {period && <span className="text-slate-500 text-sm ml-1">{period}</span>}
        </div>
        <p className="text-slate-600 mb-6">{description}</p>
        
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-slate-600">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Link href="/auth/signin" className={`block text-center py-3 px-6 rounded-lg font-medium transition-colors ${
          highlighted
            ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-md'
            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-800'
        }`}>
          {cta}
        </Link>
      </div>
    </div>
  );
}

// Add this style to your globals.css
const additionalGlobalStyles = `
  @keyframes fade-in-out {
    0%, 100% { opacity: 0; }
    20%, 80% { opacity: 1; }
  }
  
  .animate-fade-in-out {
    animation: fade-in-out 2s ease-in-out infinite;
  }
  
  @keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  
  .animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
  }
  
  .delay-150 {
    animation-delay: 150ms;
  }
`;