"use client";

import { useState } from 'react';
import Link from 'next/link';

interface SuccessStory {
  id: string;
  clientName: string;
  clientTitle: string;
  clientCompany: string;
  clientAvatar?: string;
  expertName: string;
  expertTitle: string;
  story: string;
  metrics: {
    label: string;
    value: string;
    change: string;
    positive: boolean;
  }[];
  tags: string[];
  videoUrl?: string;
  caseStudyUrl?: string;
  testimonial: string;
  industry: string;
  featured: boolean;
  date: string;
}

export default function SuccessStoriesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mock success stories data
  const successStories: SuccessStory[] = [
    {
      id: 'story-001',
      clientName: 'Sarah Chen',
      clientTitle: 'CEO',
      clientCompany: 'GrowthTech Solutions',
      clientAvatar: '/clients/sarah.jpg',
      expertName: 'Michael Rodriguez',
      expertTitle: 'Marketing Strategy Expert',
      story: 'Sarah was struggling with scaling her tech startup\'s customer acquisition. After consulting with Michael, she implemented a new multi-channel strategy that dramatically reduced CAC while increasing conversion rates.',
      metrics: [
        {
          label: 'Customer Acquisition Cost',
          value: '$24',
          change: '-42%',
          positive: true
        },
        {
          label: 'Conversion Rate',
          value: '3.8%',
          change: '+65%',
          positive: true
        },
        {
          label: 'Monthly Recurring Revenue',
          value: '$285K',
          change: '+28%',
          positive: true
        }
      ],
      tags: ['marketing', 'customer acquisition', 'growth strategy'],
      videoUrl: '/videos/sarahchen-testimonial.mp4',
      caseStudyUrl: '/case-studies/growthtech-solutions',
      testimonial: "Michael's guidance transformed our approach to customer acquisition. The frameworks he provided helped us identify hidden opportunities in our funnel and optimize our messaging for each segment. I estimate we've saved over $200K while growing faster than ever.",
      industry: 'Technology',
      featured: true,
      date: '2025-03-10'
    },
    {
      id: 'story-002',
      clientName: 'James Wilson',
      clientTitle: 'CFO',
      clientCompany: 'Heritage Manufacturing',
      clientAvatar: '/clients/james.jpg',
      expertName: 'Aisha Johnson',
      expertTitle: 'Financial Advisor',
      story: 'Heritage Manufacturing was facing cash flow challenges while trying to expand their operations. Aisha helped James restructure their financial planning and secure better financing terms while implementing more efficient cash management systems.',
      metrics: [
        {
          label: 'Operating Cash Flow',
          value: '$1.2M',
          change: '+35%',
          positive: true
        },
        {
          label: 'Financing Costs',
          value: '4.2%',
          change: '-1.5%',
          positive: true
        },
        {
          label: 'Days Sales Outstanding',
          value: '32 days',
          change: '-15 days',
          positive: true
        }
      ],
      tags: ['finance', 'cash flow', 'manufacturing'],
      caseStudyUrl: '/case-studies/heritage-manufacturing',
      testimonial: "Aisha quickly identified the inefficiencies in our cash management system and provided practical solutions that we could implement immediately. Her insights into financing options saved us hundreds of thousands in interest and gave us the runway we needed for expansion.",
      industry: 'Manufacturing',
      featured: true,
      date: '2025-02-18'
    },
    {
      id: 'story-003',
      clientName: 'Elena Martinez',
      clientTitle: 'Founder',
      clientCompany: 'Wellness Collective',
      clientAvatar: '/clients/elena.jpg',
      expertName: 'David Kim',
      expertTitle: 'Business Strategy Consultant',
      story: 'Elena\'s wellness business was struggling to differentiate in a crowded market. David helped her identify a unique positioning strategy and restructure her service offerings to create a more compelling value proposition.',
      metrics: [
        {
          label: 'New Client Acquisition',
          value: '46/month',
          change: '+87%',
          positive: true
        },
        {
          label: 'Average Client Value',
          value: '$840',
          change: '+35%',
          positive: true
        },
        {
          label: 'Client Retention',
          value: '84%',
          change: '+22%',
          positive: true
        }
      ],
      tags: ['healthcare', 'positioning', 'service design'],
      videoUrl: '/videos/elenamartinez-testimonial.mp4',
      testimonial: "David challenged my assumptions about our market and helped me see opportunities I was missing. The repositioning strategy he guided me through has completely transformed our business. We're now seen as the premium provider in our niche.",
      industry: 'Healthcare',
      featured: false,
      date: '2025-01-12'
    },
    {
      id: 'story-004',
      clientName: 'Robert Taylor',
      clientTitle: 'Operations Director',
      clientCompany: 'EcoLogistics',
      clientAvatar: '/clients/robert.jpg',
      expertName: 'Jessica Wong',
      expertTitle: 'Supply Chain Expert',
      story: 'EcoLogistics needed to optimize their supply chain while maintaining their commitment to sustainability. Jessica worked with Robert to redesign their logistics network and implement more efficient, eco-friendly processes.',
      metrics: [
        {
          label: 'Carbon Footprint',
          value: '1,240 tons',
          change: '-32%',
          positive: true
        },
        {
          label: 'Logistics Costs',
          value: '$3.4M',
          change: '-18%',
          positive: true
        },
        {
          label: 'Delivery Time',
          value: '2.3 days',
          change: '-30%',
          positive: true
        }
      ],
      tags: ['logistics', 'sustainability', 'operations'],
      caseStudyUrl: '/case-studies/ecologistics',
      testimonial: "Jessica understood our dual priorities of efficiency and sustainability. The solutions she proposed have allowed us to reduce both our environmental impact and our costs simultaneously, which many consultants told us was impossible.",
      industry: 'Logistics',
      featured: false,
      date: '2025-03-05'
    }
  ];

  // Filter stories based on search and industry filter
  const filteredStories = successStories.filter(story => {
    // Filter by industry
    if (selectedIndustry !== 'all' && story.industry !== selectedIndustry) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        story.clientName.toLowerCase().includes(query) ||
        story.clientCompany.toLowerCase().includes(query) ||
        story.expertName.toLowerCase().includes(query) ||
        story.story.toLowerCase().includes(query) ||
        story.tags.some(tag => tag.toLowerCase().includes(query)) ||
        story.industry.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Get unique industries for filter
  const industries = ['all', ...new Set(successStories.map(story => story.industry))];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <h1 className="text-2xl font-bold">Success Stories</h1>
        <p className="text-zinc-600">
          Real business transformations from our client community
        </p>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Featured stories highlight */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6">Featured Client Transformations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {successStories.filter(story => story.featured).map(story => (
                <div key={story.id} className="bg-white rounded-lg overflow-hidden shadow-md border border-zinc-200">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                        {story.clientAvatar ? (
                          <div className="font-bold">{story.clientName.charAt(0)}</div>
                        ) : (
                          <div className="font-bold">{story.clientName.charAt(0)}</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{story.clientName}</h3>
                        <p className="text-sm text-indigo-100">
                          {story.clientTitle} at {story.clientCompany}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-zinc-600 mb-6">
                      {story.story}
                    </p>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-zinc-500 uppercase mb-3">Key Results</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {story.metrics.map((metric, index) => (
                          <div key={index} className="bg-zinc-50 p-3 rounded-lg text-center">
                            <div className="text-lg font-bold">{metric.value}</div>
                            <div className={`text-sm font-medium ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                              {metric.change}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">{metric.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {story.videoUrl && (
                          <button className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Watch Video
                          </button>
                        )}
                        {story.caseStudyUrl && (
                          <button className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Read Case Study
                          </button>
                        )}
                      </div>
                      <Link
                        href={`/success-stories/${story.id}`}
                        className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full hover:bg-indigo-700"
                      >
                        Full Story
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search and filter */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
              <h2 className="text-xl font-bold">All Success Stories</h2>
              <div className="flex space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stories..."
                    className="pl-9 pr-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute left-3 top-2.5 text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Industries</option>
                  {industries.filter(industry => industry !== 'all').map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredStories.length === 0 ? (
              <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No stories found</h3>
                <p className="text-zinc-500 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedIndustry('all'); }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredStories.filter(story => !story.featured).map(story => (
                  <div key={story.id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="md:flex">
                      <div className="md:w-2/3 p-6">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 mr-3">
                            {story.clientName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold">{story.clientName}</h3>
                            <p className="text-sm text-zinc-500">
                              {story.clientTitle} at {story.clientCompany}
                            </p>
                          </div>
                          <div className="ml-auto">
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                              {story.industry}
                            </span>
                          </div>
                        </div>

                        <p className="text-zinc-600 mb-4 line-clamp-2">
                          {story.story}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {story.tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-zinc-100 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="text-sm">
                          <span className="font-medium">Expert:</span> {story.expertName}, {story.expertTitle}
                        </div>
                      </div>

                      <div className="md:w-1/3 bg-indigo-50 p-6 flex flex-col justify-center">
                        <blockquote className="italic text-indigo-900 mb-4 line-clamp-4">
                          "{story.testimonial.substring(0, 120)}..."
                        </blockquote>
                        <Link
                          href={`/success-stories/${story.id}`}
                          className="text-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                        >
                          Read Full Story
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Impact statistics */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white mb-8">
            <h2 className="text-xl font-bold mb-6 text-center">Platform Impact Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">$42M+</div>
                <div className="text-indigo-200">Revenue Growth Generated</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">184+</div>
                <div className="text-indigo-200">Success Stories</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">38%</div>
                <div className="text-indigo-200">Average Cost Reduction</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">4.2x</div>
                <div className="text-indigo-200">Average ROI</div>
              </div>
            </div>
          </div>

          {/* Submit your story CTA */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Share Your Success Story</h3>
            <p className="text-zinc-600 mb-4 max-w-xl mx-auto">
              Has working with our experts transformed your business? Share your story with our community and receive 500 reward points plus exclusive platform benefits.
            </p>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
              Submit Your Story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
