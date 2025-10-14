'use client';

import { useState } from 'react';
import { getBlogPosts, createBlogPost } from '@/lib/database';

export default function DatabaseTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDatabase = async () => {
    setLoading(true);
    setTestResult('Testing database connection...\n');
    
    try {
      // Test 1: Get existing posts
      setTestResult(prev => prev + '1. Testing getBlogPosts...\n');
      const posts = await getBlogPosts();
      setTestResult(prev => prev + `   Found ${posts.length} posts\n`);
      
      if (posts.length > 0) {
        setTestResult(prev => prev + `   First post: ${JSON.stringify(posts[0], null, 2)}\n`);
      }
      
      // Test 2: Create a test post
      setTestResult(prev => prev + '2. Testing createBlogPost...\n');
      const testPost = {
        title: 'Test Post ' + new Date().toISOString(),
        slug: 'test-post-' + Date.now(),
        content: 'This is a test post content.',
        excerpt: 'This is a test post content...',
        meta_title: 'Test Post',
        meta_description: 'A test post for debugging.',
        status: 'published' as const,
        published_at: new Date().toISOString()
      };
      
      const newPost = await createBlogPost(testPost);
      setTestResult(prev => prev + `   Created post: ${JSON.stringify(newPost, null, 2)}\n`);
      
      setTestResult(prev => prev + '\n✅ All tests passed!');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTestResult(prev => prev + `\n❌ Error: ${errorMessage}\n`);
      setTestResult(prev => prev + `Stack: ${error instanceof Error ? error.stack : 'No stack trace'}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Database Test</h2>
        
        <button
          onClick={testDatabase}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 mb-4"
        >
          {loading ? 'Testing...' : 'Run Database Test'}
        </button>
        
        <div className="bg-gray-100 p-4 rounded-md">
          <pre className="whitespace-pre-wrap text-sm">
            {testResult || 'Click "Run Database Test" to check your database connection and schema.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
