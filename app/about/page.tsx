import React from 'react';
import Link from 'next/link';
import { Code, Users, Zap, BarChart2, MessageSquare, FileText, CheckCircle } from 'lucide-react';

const AboutPage = () => {
  const features = [
    {
      icon: <Code className="w-8 h-8 text-blue-500" />,
      title: 'AI-Powered Interviews',
      description: 'Practice with our advanced AI that simulates real technical interviews.'
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: 'Personalized Feedback',
      description: 'Get detailed feedback on your answers to help you improve.'
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: 'Quick Setup',
      description: 'Start practicing in minutes with just your resume or job description.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Upload or Paste Resume',
      description: 'Provide your resume or job description to customize your interview.'
    },
    {
      number: '2',
      title: 'Start Interview',
      description: 'Begin your practice session with our AI interviewer.'
    },
    {
      number: '3',
      title: 'Get Feedback',
      description: 'Receive detailed feedback on your performance.'
    }
  ];

  const benefits = [
    'Practice anytime, anywhere',
    'No scheduling required',
    'Unlimited interview attempts',
    'Track your progress over time',
    'Build confidence in your skills'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-800 text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Revolutionizing Technical Interviews
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Practice technical interviews with our AI-powered platform and get the confidence you need to ace your next interview.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/interview/new" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
            Start Practicing
          </Link>
          <Link href="/dashboard" className="bg-transparent hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg border border-zinc-600 transition-colors">
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-zinc-800 p-6 rounded-xl hover:bg-zinc-700/50 transition-colors">
                <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Benefits</h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <CheckCircle className="text-green-500" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Ace Your Next Interview?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers who have improved their interview skills with our platform.
          </p>
          <Link 
            href="/interview/new" 
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-all transform hover:scale-105"
          >
            Start Your Free Interview Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
